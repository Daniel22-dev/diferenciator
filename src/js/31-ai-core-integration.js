const DPL_AI_APP=Object.freeze({id:'differentiator',version:'1.3.31'});
const DPL_WORKSHEET_SCHEMA=Object.freeze({
  type:'object',
  properties:{
    worksheet_title:{type:'string'},
    student_instructions:{type:'string'},
    tasks:{type:'string'},
    answer_key:{type:'string'},
    teacher_note:{type:'string'}
  },
  required:['worksheet_title','student_instructions','tasks','answer_key','teacher_note'],
  additionalProperties:false
});
const DPL_AI_SCHEMAS=Object.freeze({
  'differentiator.text.v1':Object.freeze({type:'object',required:['text'],properties:{text:{type:'string'}},additionalProperties:false}),
  'differentiator.object.v1':DPL_WORKSHEET_SCHEMA
});
const DPL_AI_OPERATIONS=Object.freeze({schema:'ghrab-ai-operations-v1',appId:DPL_AI_APP.id,operations:Object.freeze({
  'cefr-detection':{outputSchemaId:'differentiator.text.v1',defaultModelProfile:'economy',allowedModelProfiles:['economy','balanced','quality'],inputTypes:['text'],streaming:false,requiredCapabilities:[],expectedOutputs:1,maxOutputTokensHint:4096},
  'material-extraction':{outputSchemaId:'differentiator.text.v1',defaultModelProfile:'balanced',allowedModelProfiles:['economy','balanced','quality'],inputTypes:['text','image','document'],streaming:false,requiredCapabilities:[],expectedOutputs:1,maxOutputTokensHint:32768},
  'worksheet-generation':{outputSchemaId:'differentiator.object.v1',defaultModelProfile:'balanced',allowedModelProfiles:['economy','balanced','quality'],inputTypes:['text','image','document'],streaming:false,requiredCapabilities:[],expectedOutputs:1,maxOutputTokensHint:32768},
  'worksheet-structure-repair':{outputSchemaId:'differentiator.object.v1',defaultModelProfile:'economy',allowedModelProfiles:['economy','balanced','quality'],inputTypes:['text'],streaming:false,requiredCapabilities:[],expectedOutputs:1,maxOutputTokensHint:32768},
  'answer-key-generation':{outputSchemaId:'differentiator.text.v1',defaultModelProfile:'economy',allowedModelProfiles:['economy','balanced','quality'],inputTypes:['text','image','document'],streaming:false,requiredCapabilities:[],expectedOutputs:1,maxOutputTokensHint:16384},
  'worksheet-quality-audit':{outputSchemaId:'differentiator.text.v1',defaultModelProfile:'economy',allowedModelProfiles:['economy','balanced','quality'],inputTypes:['text','image','document'],streaming:false,requiredCapabilities:[],expectedOutputs:1,maxOutputTokensHint:8192},
  'worksheet-quality-revision':{outputSchemaId:'differentiator.object.v1',defaultModelProfile:'balanced',allowedModelProfiles:['economy','balanced','quality'],inputTypes:['text','image','document'],streaming:false,requiredCapabilities:[],expectedOutputs:1,maxOutputTokensHint:32768}
})});

const DPL_EMAIL_RE=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const dplPreflightDecisionCache=new Map();
let dplConfiguredSignature='';

function dplDeployment(){return window.__GHRAB_DEPLOYMENT_CONFIG__||{}}
function dplSchoolMode(){
  if(window.__GHRAB_RUNTIME_CONFIG__?.ai?.defaultMode==='school-gateway')return true;
  const platformCheck=window.GHRAB_PLATFORM&&window.GHRAB_PLATFORM.isSchoolProfile;
  if(typeof platformCheck==='function'){
    try{return platformCheck.call(window.GHRAB_PLATFORM)===true}catch(_){}
  }
  const deployment=dplDeployment();
  return deployment.profile==='school-server'||deployment.aiTransport==='school-gateway';
}
function dplApiUrl(endpointKey,fallback){
  const deployment=dplDeployment();
  const base=String(deployment.apiBaseUrl||'').trim();
  const endpoint=String(deployment.endpoints?.[endpointKey]||'').trim();
  if(!base||!endpoint)return fallback;
  try{return new URL(endpoint,base.endsWith('/')?base:base+'/').href}catch(_){return fallback}
}
function dplRuntimeConfig(){
  const raw=window.__GHRAB_RUNTIME_CONFIG__;
  if(!raw||raw.schema!=="ghrab-runtime-config-v1"||!raw.ai)throw makeAppError("Veřejná runtime konfigurace AI není dostupná. Obnov stránku přes AI Studio.","CONFIGURATION_ERROR");
  const cfg=JSON.parse(JSON.stringify(raw));
  const school=dplSchoolMode();
  if(school){
    cfg.ai.defaultMode="school-gateway";cfg.ai.selectedMode="school-gateway";cfg.ai.allowedModes=["school-gateway"];cfg.ai.allowUserModeSelection=false;cfg.ai.automaticFallback=false;delete cfg.ai.directGemini;
  }else{
    const map=cfg.ai.directGemini&&cfg.ai.directGemini.profileModels;
    if(cfg.ai.defaultMode!=="direct-gemini"||!map||!MODEL_PROFILES.every(profile=>typeof map[profile]==="string"&&map[profile]))throw makeAppError("Serverless runtime nemá úplné mapování profilů AI.","CONFIGURATION_ERROR");
    cfg.ai.defaultMode="direct-gemini";cfg.ai.selectedMode="direct-gemini";cfg.ai.allowedModes=["direct-gemini"];cfg.ai.allowUserModeSelection=false;cfg.ai.automaticFallback=false;
  }
  cfg.ai.gatewayUrl=dplApiUrl("aiGenerate",cfg.ai.gatewayUrl||"/api/v1/ai/generate");
  cfg.ai.healthUrl=dplApiUrl("aiHealth",cfg.ai.healthUrl||"/api/v1/ai/health");
  cfg.telemetry={...(cfg.telemetry||{}),enabled:dplDeployment().telemetryMode!=="off"};
  return cfg;
}
function dplModelProfile(operation){
  const registration=DPL_AI_OPERATIONS.operations[operation];
  if(!registration)return MODEL_PROFILE_DEFAULT;
  const desired=normalizeModelProfile(selectedModelProfile);
  return registration.allowedModelProfiles.includes(desired)?desired:registration.defaultModelProfile;
}
function dplReasoningHint(operation,requested){
  const hint=String(requested||THINKING_DEFAULT||'medium').trim().toLowerCase();
  if(dplSchoolMode())return hint;
  const profile=dplModelProfile(operation);
  const allowed=window.__GHRAB_RUNTIME_CONFIG__?.ai?.directGemini?.profileThinkingLevels?.[profile];
  if(!Array.isArray(allowed)||!allowed.length||allowed.includes(hint))return hint;
  return allowed.includes('low')?'low':allowed[0];
}
function dplCoreParts(parts){
  const out=[];
  for(const part of(Array.isArray(parts)?parts:[])){
    if(part&&typeof part.text==='string'){out.push({type:'text',text:part.text});continue}
    const inline=part?.inline_data||part?.inlineData;
    if(inline?.data){
      const mime=inline.mime_type||inline.mimeType||'application/octet-stream';
      out.push({type:String(mime).startsWith('image/')?'image':'document',mimeType:mime,name:inline.name||'material',source:{kind:'inline-base64',data:inline.data}});
    }
  }
  return out;
}
function dplEmailMatches(parts){
  const found=new Set();
  for(const part of parts){
    if(part.type!=='text')continue;
    for(const match of String(part.text||'').matchAll(DPL_EMAIL_RE))found.add(match[0]);
  }
  return [...found].sort((a,b)=>a.localeCompare(b));
}
function dplAnonymizeEmails(parts){
  return parts.map(part=>part.type==='text'?{...part,text:String(part.text||'').replace(DPL_EMAIL_RE,'[e-mail anonymizován]')}:part);
}
function dplPrivacyDecision(emails,hasOpaqueInput){
  const fingerprint=emails.join('\n');
  if(dplPreflightDecisionCache.has(fingerprint))return Promise.resolve(dplPreflightDecisionCache.get(fingerprint));
  const overlay=document.getElementById('privacyOverlay');
  const list=document.getElementById('privacyEmailList');
  const note=document.getElementById('privacyInputNote');
  const cancel=document.getElementById('privacyClose');
  const anonymize=document.getElementById('privacyAnonymize');
  const proceed=document.getElementById('privacyContinue');
  if(!overlay||!list||!cancel||!anonymize||!proceed)return Promise.reject(makeAppError('Bezpečnostní kontrola našla e-mailovou adresu, ale potvrzovací dialog se nepodařilo otevřít.','PREFLIGHT_BLOCKED'));
  list.textContent=emails.join(', ');
  if(note)note.textContent=hasOpaqueInput?'Kontrola rozpoznává e-mailové adresy jen v textové části. Text uvnitř obrázků nebo skenů se před odesláním tímto krokem nekontroluje.':'Kontrola se týká textu, který aplikace právě odesílá do AI.';
  overlay.classList.add('show');
  return new Promise(resolve=>{
    let done=false;
    const finish=decision=>{
      if(done)return;done=true;overlay.classList.remove('show');
      cancel.onclick=null;anonymize.onclick=null;proceed.onclick=null;
      if(decision!=='cancel')dplPreflightDecisionCache.set(fingerprint,decision);
      resolve(decision);
    };
    cancel.onclick=()=>finish('cancel');
    anonymize.onclick=()=>finish('anonymize');
    proceed.onclick=()=>finish('continue');
  });
}
async function dplPreflight(parts){
  const emails=dplEmailMatches(parts);
  if(!emails.length)return{parts,clientAnonymized:false};
  const decision=await dplPrivacyDecision(emails,parts.some(part=>part.type!=='text'));
  if(decision==='cancel')throw makeAppError('Odeslání do AI bylo zrušeno kvůli kontrole osobních údajů.','PREFLIGHT_BLOCKED');
  if(decision==='anonymize')return{parts:dplAnonymizeEmails(parts),clientAnonymized:true};
  return{parts,clientAnonymized:false};
}
function dplAiSignature(){
  const runtime=dplRuntimeConfig();
  return [runtime.ai.defaultMode,runtime.ai.gatewayUrl,runtime.ai.healthUrl].join('|');
}
function dplEnsureAiCore(){
  const ai=window.GHRAB_AI;
  if(!ai||typeof ai.configure!=='function'||typeof ai.generate!=='function'||typeof ai.getState!=='function'||typeof ai.formatUserError!=='function'){
    throw makeAppError('Společná AI vrstva GHRAB AI Core není dostupná nebo nemá očekávané rozhraní. Obnov stránku přes AI Studio.','CONFIGURATION_ERROR');
  }
  if(!window.GHRAB_PLATFORM||typeof window.GHRAB_PLATFORM.unlockProtectedScripts!=='function'){
    throw makeAppError('GHRAB Platform není dostupná v očekávané verzi. Obnov stránku přes AI Studio.','CONFIGURATION_ERROR');
  }
  const signature=dplAiSignature();
  const state=ai.getState();
  if(state?.configured&&state.app?.id===DPL_AI_APP.id&&dplConfiguredSignature===signature)return state;
  const platform=window.GHRAB_PLATFORM;
  const config={
    app:DPL_AI_APP,
    runtimeConfig:dplRuntimeConfig(),
    operations:DPL_AI_OPERATIONS,
    outputSchemas:DPL_AI_SCHEMAS,
    credentialProvider:async({mode})=>mode==='direct-gemini'?{apiKey:cleanKey(geminiApiKey)}:null
  };
  if(typeof platform.authProvider==='function')config.authProvider=context=>platform.authProvider(context);
  if(typeof platform.recordTelemetry==='function')config.telemetrySink=event=>platform.recordTelemetry({type:'ai-usage',appId:DPL_AI_APP.id,appVersion:DPL_AI_APP.version,...event});
  const configured=ai.configure(config);
  dplConfiguredSignature=signature;
  return configured;
}

callGemini=async function callGeminiThroughCore(parts,opts={}){
  try{
    dplEnsureAiCore();
    const operation=opts.operation||(opts.json?'worksheet-generation':'material-extraction');
    const registration=DPL_AI_OPERATIONS.operations[operation];
    if(!registration)throw makeAppError('Neznámá AI operace: '+operation,'UNREGISTERED_OPERATION');
    const converted=dplCoreParts(parts);
    const preflight=await dplPreflight(converted);
    const plain=registration.outputSchemaId==='differentiator.text.v1';
    const instructions=plain?'Vrať pouze validní JSON objekt přesně ve tvaru {"text":"..."}. Hodnota text musí obsahovat pouze požadovanou odpověď bez markdownu.':'Vrať pouze validní JSON bez markdownu a dodrž strukturu požadovanou v zadání.';
    const response=await window.GHRAB_AI.generate({
      operation,
      modelProfile:dplModelProfile(operation),
      instructions,
      inputParts:preflight.parts,
      outputSchemaId:registration.outputSchemaId,
      options:{reasoningHint:dplReasoningHint(operation,opts.thinking),maxOutputTokensHint:registration.maxOutputTokensHint},
      privacy:{clientAnonymized:preflight.clientAnonymized,preflightPassed:true},
      usageContext:{expectedOutputs:registration.expectedOutputs||1},
      workflowId:opts.workflowId||undefined
    });
    return plain?String(response.result.text||''):JSON.stringify(response.result);
  }catch(error){
    if(error?.code==='CONFIGURATION_ERROR'||error?.code==='PREFLIGHT_BLOCKED'||error?.code==='UNREGISTERED_OPERATION')throw makeAppError(error.message,error.code);
    const formatter=window.GHRAB_AI&&window.GHRAB_AI.formatUserError;
    let message=error?.message||'AI požadavek se nepodařilo dokončit.';
    if(typeof formatter==='function'){
      try{message=formatter(error,'cs-CZ')||message}catch(_){}
    }
    throw makeAppError(message,error?.code||'AI_ERROR');
  }
};

function dplRemoveLocalProviderKeys(){
  storageRemovePair('local',KEY_SK,LEGACY_STORAGE_KEYS.keyLocal);
  storageRemovePair('session',KEY_SESSION_SK,LEGACY_STORAGE_KEYS.keySession);
  geminiApiKey='';geminiKeyScope='server';
}
function dplApplyServerKeyPolicy(){
  if(!dplSchoolMode()){if(typeof applyAiRuntimeUi==='function')applyAiRuntimeUi();return}
  const platform=window.GHRAB_PLATFORM||{};
  if(typeof platform.enforceLocalKeyPolicy==='function'){
    try{platform.enforceLocalKeyPolicy({localStorageKeys:[KEY_SK,LEGACY_STORAGE_KEYS.keyLocal],sessionStorageKeys:[KEY_SESSION_SK,LEGACY_STORAGE_KEYS.keySession],onRemoved:dplRemoveLocalProviderKeys})}catch(_){dplRemoveLocalProviderKeys()}
  }else dplRemoveLocalProviderKeys();
  if(typeof applyAiRuntimeUi==='function')applyAiRuntimeUi();
  const input=document.getElementById('keyInput');
  if(input){input.value='';input.disabled=true;input.placeholder='Osobní klíč se ve školním režimu nepoužívá'}
  setStatus('statusKey','školní server','ok');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',dplApplyServerKeyPolicy,{once:true});else dplApplyServerKeyPolicy();
