const MODEL_PROFILE_DEFAULT="balanced", MODEL_PROFILES=Object.freeze(["economy","balanced","quality"]);
const MODEL_PROFILE_LABELS=Object.freeze({economy:"Úsporný",balanced:"Doporučený",quality:"Důkladný"});
const THINKING_DEFAULT='medium',THINKING_CHEAP='minimal';
let geminiApiKey="", geminiKeyScope="", selectedModelProfile=MODEL_PROFILE_DEFAULT;

function currentAiMode(){return window.__GHRAB_RUNTIME_CONFIG__?.ai?.defaultMode==="school-gateway"?"school-gateway":"direct-gemini"}
function applyAiRuntimeUi(){const direct=$('#directGeminiSettings');if(direct)direct.hidden=currentAiMode()==="school-gateway";updateApiToggleText();updateKeyStatus()}
window.addEventListener("ghrab:runtime-config-changed",applyAiRuntimeUi);
function cleanKey(s){return String(s||"").replace(/[^\x21-\x7E]/g,"")}
function inputKey(){return cleanKey($('#keyInput').value)}
function setKey(key,scope){geminiApiKey=cleanKey(key);geminiKeyScope=geminiApiKey?scope:"";$('#keyInput').value=geminiApiKey;updateKeyStatus()}
function loadKey(){let sessionKey=storageReadMigrated('session',KEY_SESSION_SK,LEGACY_STORAGE_KEYS.keySession)||"",persisted="";try{persisted=localStorage.getItem(KEY_SK)||localStorage.getItem(LEGACY_STORAGE_KEYS.keyLocal)||""}catch(_){}if(!sessionKey&&persisted){try{sessionStorage.setItem(KEY_SESSION_SK,persisted);sessionKey=persisted}catch(_){}}storageRemovePair('local',KEY_SK,LEGACY_STORAGE_KEYS.keyLocal);setKey(sessionKey,sessionKey?"session":"")}
function useKeySession(){const k=inputKey();let stored=true;try{if(k)sessionStorage.setItem(KEY_SESSION_SK,k);else sessionStorage.removeItem(KEY_SESSION_SK);sessionStorage.removeItem(LEGACY_STORAGE_KEYS.keySession)}catch(_){stored=false}setKey(k,k?(stored?"session":"memory"):"");return stored}
function showMessage(title,message){
  const t=$('#messageTitle'), m=$('#messageText');
  if(t)t.textContent=title||"Upozornění";
  if(m)m.textContent=String(message||"");
  $('#messageOverlay').classList.add("show");
}
function clearKey(){storageRemovePair('session',KEY_SESSION_SK,LEGACY_STORAGE_KEYS.keySession);storageRemovePair('local',KEY_SK,LEGACY_STORAGE_KEYS.keyLocal);setKey("","")}
function updateKeyStatus(){
  const el=$('#keyStatus');el.className="api-status";
  if(currentAiMode()==="school-gateway"){el.textContent="✓ Školní AI služba";el.classList.add("ok");setStatus("statusKey","školní server","ok");return}
  if(geminiApiKey){
    if(geminiKeyScope==="session"){el.textContent="✓ Klíč uložen pro relaci";el.classList.add("ok");setStatus("statusKey","relace","ok")}
    else{el.textContent="✓ Klíč zadán (neuložen)";el.classList.add("ok")}
  } else {
    el.textContent="Klíč není nastaven";
    setStatus("statusKey","chybí klíč","warn");
  }
  if(geminiApiKey&&geminiKeyScope==="memory")setStatus("statusKey","zadán, neuložen","warn");
}
$('#btnSession').onclick=()=>{const stored=useKeySession();if(stored)flashBtn($('#btnSession'),"Uloženo pro relaci ✓");else showMessage("Úložiště relace není dostupné","Klíč lze použít na právě otevřené stránce, ale prohlížeč ho nedokázal uložit do relace. Po obnovení stránky ho bude nutné vložit znovu.")};
$('#btnClear').onclick=()=>{clearKey();$('#keyInput').value=""};
$('#messageClose').onclick=()=>$('#messageOverlay').classList.remove("show");
$('#messageOverlay').addEventListener("click",e=>{if(e.target.id==="messageOverlay")$('#messageOverlay').classList.remove("show")});
function updateApiToggleText(){const btn=$('#apiToggle'),panel=$('#apiPanel');if(!btn||!panel)return;const open=panel.classList.contains("open");btn.textContent=open?"Skrýt nastavení AI ▴":"Nastavení AI ▾";btn.setAttribute("aria-expanded",open?"true":"false")}
$('#apiToggle').onclick=()=>{$('#apiPanel').classList.toggle("open");updateApiToggleText()};
updateApiToggleText();
$('#keyInput').addEventListener("input",()=>{
  geminiApiKey=inputKey();
  if(geminiApiKey){if(!geminiKeyScope)geminiKeyScope="memory"}else geminiKeyScope="";
  updateKeyStatus();
});
function flashBtn(btn,msg){const o=btn.textContent;btn.textContent=msg;btn.disabled=true;setTimeout(()=>{btn.textContent=o;btn.disabled=false},1300)}
function hasApiKey(){return currentAiMode()==='school-gateway'||!!cleanKey(geminiApiKey)}
function requireApiKeyForAction(actionLabel){
  if(hasApiKey())return true;
  const label=actionLabel||'tuto akci';
  const msg='Bez API klíče nejde spustit '+label+'. Vlož klíč v kroku 1 pod tlačítkem „Nastavit / změnit API klíč“ a zvol „Použít jen pro relaci“. Výstup se bez klíče nezačne vytvářet.';
  const api=$('#apiPanel'), apiStep=$('#apiStepPanel');
  if(api)api.classList.add('open');
  updateApiToggleText();
  setStatus('statusKey','chybí klíč','warn');
  showMessage('Chybí API klíč',msg);
  setTimeout(()=>{safeScrollIntoView(apiStep||api||document.body,{behavior:'smooth',block:'start'});const input=$('#keyInput');if(input)input.focus()},80);
  return false;
}

function normalizeModelProfile(n){const v=String(n||"").trim().toLowerCase();return MODEL_PROFILES.includes(v)?v:MODEL_PROFILE_DEFAULT}
function migrateStoredModelProfile(n){const v=String(n||"").trim().toLowerCase();return MODEL_PROFILES.includes(v)?v:/flash-lite/.test(v)?"economy":v==="gemini-3.5-flash"?"quality":/^gemini-.*flash/.test(v)?"balanced":MODEL_PROFILE_DEFAULT}
function setModelProfile(n){selectedModelProfile=normalizeModelProfile(n);try{localStorage.setItem(MODEL_PROFILE_SK,selectedModelProfile);localStorage.removeItem(LEGACY_STORAGE_KEYS.model)}catch(_){}updateModelUI()}
function loadModelProfile(){const s=storageReadMigrated('local',MODEL_PROFILE_SK,LEGACY_STORAGE_KEYS.model)||"";selectedModelProfile=migrateStoredModelProfile(s);try{localStorage.setItem(MODEL_PROFILE_SK,selectedModelProfile);localStorage.removeItem(LEGACY_STORAGE_KEYS.model)}catch(_){}updateModelUI()}
function updateModelUI(){
  document.querySelectorAll("[data-model-profile]").forEach(btn=>{const active=btn.dataset.modelProfile===selectedModelProfile;btn.classList.toggle("active",active);btn.setAttribute("aria-pressed",active?"true":"false")});
  setStatus("statusModel",MODEL_PROFILE_LABELS[selectedModelProfile]||MODEL_PROFILE_LABELS[MODEL_PROFILE_DEFAULT],"ok");
}
document.querySelectorAll("[data-model-profile]").forEach(btn=>{btn.onclick=()=>setModelProfile(btn.dataset.modelProfile)});
loadKey();loadModelProfile();applyAiRuntimeUi();

const MAX_INLINE_REQUEST_BYTES=18*1024*1024;
const MAX_TEXT_CHARS=180000;
const MAX_SINGLE_MEDIA_ORIGINAL_BYTES=12*1024*1024;
const MAX_MULTIMEDIA_SOURCE_BYTES=12*1024*1024;
const MAX_PDF_BYTES=13*1024*1024;
const MAX_IMAGE_SOURCE_BYTES=40*1024*1024;
const MAX_IMAGE_SOURCE_TOTAL_BYTES=80*1024*1024;
const MAX_IMAGE_COUNT=8;
const MAX_OFFICE_SOURCE_BYTES=25*1024*1024;
const MAX_ZIP_ENTRIES=2500;
const MAX_ZIP_ENTRY_BYTES=20*1024*1024;
const MAX_ZIP_TOTAL_UNCOMPRESSED_BYTES=80*1024*1024;
const IMAGE_TOTAL_TARGET_BYTES=12*1024*1024;
function humanBytes(n){if(n<1024)return n+' B';if(n<1024*1024)return Math.round(n/1024)+' kB';return (n/1024/1024).toFixed(1).replace('.0','')+' MB'}
function utf8Bytes(s){try{return new TextEncoder().encode(String(s||'')).length}catch(_){return String(s||'').length}}
function assertTextLength(text,label){if(String(text||'').length>MAX_TEXT_CHARS)throw makeAppError((label||'Text')+' je příliš dlouhý ('+String(text||'').length+' znaků). Limit je '+MAX_TEXT_CHARS+' znaků. Rozděl zadání na části, aby model stihl bezpečně vytvořit všechny verze.','TEXT_TOO_LONG')}
function officeExtractNote(kind,text){
  const count=String(text||'').trim().split(/\s+/).filter(Boolean).length;
  const math=kind==='DOCX'?' Word Equation zlomky, exponenty, indexy a běžné odmocniny se převádějí do zachovatelného textového zápisu; složité matice a nestandardní rovnicové objekty je potřeba ověřit v náhledu.':'';
  return kind+' byl načten lokálně jako textová vrstva ('+count+' slov).'+math+' Před generováním zkontroluj přepis: složité tabulky, textová pole, některé speciální vzorce, obrázky a pořadí prvků se mohou v Office souborech převést jen částečně.';
}
function makeAppError(message,code){const e=new Error(message);e.code=code||"APP";return e}
function friendlyApiMessage(e){
  if(!e)return "Neznámá chyba.";
  if(e.code==="MISSING_KEY")return "Chybí API klíč. Vlož ho v kroku 1 pod tlačítkem „Nastavit / změnit API klíč“ a zvol „Použít jen pro relaci“.";
  if(e.name==="AbortError"||e.code==="TIMEOUT")return "Model neodpověděl včas. Zkus akci spustit znovu.";
  if(e.code==="TEXT_TOO_LONG"||e.code==="FILE_TOO_LARGE"||e.code==="REQUEST_TOO_LARGE"||e.code==="TOO_MANY_IMAGES")return e.message;
  if(e.code==="INCOMPLETE_RESPONSE")return "Model odpověď nedokončil, takže ji appka raději nepoužila. Zkrať zadání, vyber méně verzí nebo to spusť znovu.";
  if(e.code==="SAFETY_STOP")return "Model odpověď zastavil bezpečnostním filtrem. Uprav zadání nebo zkus vložit jen čistý text úloh.";
  if(e.quota)return "Kvóta nebo limit API je vyčerpaný. Zkus to později nebo přepni profil AI.";
  if(e.status===401||e.status===403)return "API klíč není platný nebo nemá oprávnění. Zkontroluj klíč v panelu nahoře.";
  if(e.status===404)return "Zvolený profil AI není momentálně dostupný. Přepni profil v panelu nastavení nebo to zkus později.";
  if(e.status===400)return "Gemini odmítlo požadavek. Zkontroluj délku nebo obsah vstupu.";
  if(e.status>=500)return "Služba Gemini má dočasný problém. Zkus to znovu.";
  return e.message||"Nepovedlo se spojit s modelem.";
}
let callGemini;

function openGuide(auto=false){
  $('#guide').classList.add('show');
  if(auto){try{localStorage.setItem(GUIDE_SEEN_SK,'1');localStorage.removeItem(LEGACY_STORAGE_KEYS.guide)}catch(_){}}
}
function closeGuide(){
  $('#guide').classList.remove('show');
  try{localStorage.setItem(GUIDE_SEEN_SK,'1');localStorage.removeItem(LEGACY_STORAGE_KEYS.guide)}catch(_){}
}
function bindGuideButton(id){const btn=$(id);if(btn)btn.addEventListener('click',()=>openGuide(false));}
bindGuideButton('#helpBtn');
bindGuideButton('#helpTopBtn');
$('#guideClose').addEventListener('click',closeGuide);
$('#guide').addEventListener('click',e=>{if(e.target.id==='guide')closeGuide()});

renderChangelog();
$('#changelogBtn').addEventListener('click',()=>$('#changelogOverlay').classList.add('show'));
$('#changelogClose').addEventListener('click',()=>$('#changelogOverlay').classList.remove('show'));
$('#changelogOverlay').addEventListener('click',e=>{if(e.target.id==='changelogOverlay')$('#changelogOverlay').classList.remove('show')});


const FullscreenControl={
  isActive(){return !!(document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement)},
  update(){
    const btn=$('#fullscreenToggle'); if(!btn)return;
    const active=this.isActive();
    btn.classList.toggle('active',active);
    btn.textContent=active?'⤢':'⛶';
    btn.setAttribute('aria-label',active?'Ukončit režim celé obrazovky':'Zapnout režim celé obrazovky');
    btn.title=active?'Ukončit celou obrazovku':'Celá obrazovka';
  },
  async toggle(){
    const root=document.documentElement;
    try{
      if(!this.isActive()){
        const fn=root.requestFullscreen||root.webkitRequestFullscreen||root.msRequestFullscreen;
        if(!fn){showMessage('Celá obrazovka není dostupná','Tento prohlížeč nebo způsob otevření aplikace fullscreen režim nepodporuje.');return}
        await fn.call(root);
      }else{
        const fn=document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen;
        if(fn)await fn.call(document);
      }
    }catch(err){showMessage('Celá obrazovka se nepodařila spustit',friendlyApiMessage(err))}
    this.update();
  },
  init(){
    const btn=$('#fullscreenToggle');
    if(btn)btn.addEventListener('click',()=>this.toggle());
    document.addEventListener('fullscreenchange',()=>this.update());
    document.addEventListener('webkitfullscreenchange',()=>this.update());
    this.update();
  }
};
FullscreenControl.init();

function applyTheme(mode){
  const dark=mode==='dark';
  document.body.classList.toggle('dark',dark);
  const btn=$('#themeToggle'); if(btn){btn.textContent=dark?'☀️':'🌙';btn.setAttribute('aria-label',dark?'Přepnout na světlý režim':'Přepnout na tmavý režim')}
  const themeMeta=document.querySelector('meta[name="theme-color"]');if(themeMeta)themeMeta.setAttribute('content',dark?'#161A20':'#3F9270');
}
function loadTheme(){const m=storageReadMigrated('local',THEME_SK,LEGACY_STORAGE_KEYS.theme)||'light';applyTheme(m)}
$('#themeToggle').addEventListener('click',()=>{
  const next=document.body.classList.contains('dark')?'light':'dark';
  applyTheme(next); try{localStorage.setItem(THEME_SK,next)}catch(_){}
});
loadTheme();

if(!IS_TEST_MODE&&!storageReadMigrated('local',GUIDE_SEEN_SK,LEGACY_STORAGE_KEYS.guide))openGuide(true);
$('#copyClose').addEventListener('click',()=>$('#copyOverlay').classList.remove('show'));
$('#copyOverlay').addEventListener('click',e=>{if(e.target.id==='copyOverlay')$('#copyOverlay').classList.remove('show')});
$('#pasteText').addEventListener('input',()=>{if($('#pasteText').value.trim())setStatus('statusInput','vložený text','ok');else if(!uploaded)setStatus('statusInput','čeká na zadání','warn')});
$('#cefr').addEventListener('change',async()=>{
  const c=$('#cefr');
  if(c.checked && !subjectAllowsCefr()){
    c.checked=false;saveCefrPreference(false);applyCefrLevels(null);
    setCefrNote('CEFR nelze použít: předmět nevypadá jako jazykový. Pokud jde opravdu o jazykový materiál s neobvyklou zkratkou, zapni ruční vynucení CEFR.','warn');
    showMessage('Předmět nebyl rozpoznán jako jazykový','Zapni volbu „Vynutit CEFR i u nerozpoznaného jazykového předmětu“ hned pod tímto přepínačem a CEFR zaškrtni znovu — pak se úrovně A1–C2 odvodí normálně. U nejazykových předmětů nech CEFR vypnutý; aplikace pracuje jen s úrovněmi obtížnosti.');
    return;
  }
  saveCefrPreference(c.checked);
  if(c.checked)await detectCefrForBase($('#baseText').value.trim());
  else {applyCefrLevels(null);setCefrNote('CEFR je vypnutý. U nejazykových předmětů aplikace používá jen úrovně obtížnosti.')}
  updateCefrRunButton();
});
const cefrForceEl=$('#cefrForce');
if(cefrForceEl)cefrForceEl.addEventListener('change',async()=>{
  syncCefrHintFromSubject();
  const c=$('#cefr');
  if(c&&c.checked&&subjectAllowsCefr())await detectCefrForBase($('#baseText').value.trim());
});
$('#subject').addEventListener('change',syncCefrHintFromSubject);
const cefrRunBtn=$('#cefrRunBtn');if(cefrRunBtn)cefrRunBtn.addEventListener('click',()=>detectCefrForBase($('#baseText').value.trim()));
restoreCefrPreference();updateCefrRunButton();

function setTipOpen(t,open){t.classList.toggle('open',!!open);t.setAttribute('aria-expanded',open?'true':'false')}
function toggleTip(t){document.querySelectorAll('.tip.open').forEach(o=>{if(o!==t)setTipOpen(o,false)});setTipOpen(t,!t.classList.contains('open'))}
document.querySelectorAll('.tip').forEach(t=>{
  t.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleTip(t)});
  t.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();toggleTip(t)}else if(e.key==='Escape')setTipOpen(t,false)});
});
document.addEventListener('click',()=>document.querySelectorAll('.tip.open').forEach(o=>setTipOpen(o,false)));

function fileToDataUrl(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Soubor se nepodařilo načíst.'));r.readAsDataURL(file)})}
function dataUrlToBase64(dataUrl){return String(dataUrl||'').split(',')[1]||''}
function fileToBase64(file){return fileToDataUrl(file).then(dataUrlToBase64)}
function fileToArrayBuffer(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Soubor se nepodařilo načíst.'));r.readAsArrayBuffer(file)})}
function fileToText(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Soubor se nepodařilo načíst.'));r.readAsText(file,'utf-8')})}
function loadImg(src){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=()=>rej(new Error('Obrázek se nepodařilo načíst.'));img.src=src})}
function canvasToBlob(canvas,type,quality){return new Promise(res=>canvas.toBlob(res,type,quality))}
async function blobToBase64(blob){return dataUrlToBase64(await fileToDataUrl(blob))}
async function resizeImage(file,forceCompress=false,totalCount=1){
  if(file.size>MAX_IMAGE_SOURCE_BYTES)throw makeAppError('Obrázek '+file.name+' je příliš velký ('+humanBytes(file.size)+'). Maximum pro zpracování v prohlížeči je '+humanBytes(MAX_IMAGE_SOURCE_BYTES)+'.','FILE_TOO_LARGE');
  const originalType=(file.type&&/^image\//.test(file.type))?file.type:'image/jpeg';
  const svgSource=originalType==='image/svg+xml',providerNative=isImageMime(originalType);
  const keepOriginal=providerNative&&!forceCompress&&totalCount===1&&file.size<=MAX_SINGLE_MEDIA_ORIGINAL_BYTES;
  const originalDataUrl=await fileToDataUrl(file);
  if(keepOriginal){return {mime_type:originalType,data:dataUrlToBase64(originalDataUrl),name:file.name,bytes:file.size,originalBytes:file.size,compressed:false}}
  let img;try{img=await loadImg(originalDataUrl)}catch(_){throw makeAppError('Obrázek '+file.name+' je ve formátu, který tento prohlížeč neumí bezpečně převést. Ulož ho jako JPG/PNG/WebP nebo PDF a zkus znovu.','UNSUPPORTED_IMAGE')}
  let maxDim=totalCount>1?1900:2300;
  const perImageTarget=Math.max(900*1024,Math.floor(IMAGE_TOTAL_TARGET_BYTES/Math.max(1,totalCount)));
  let quality=0.88, blob=null, canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
  for(let attempt=0;attempt<8;attempt++){
    const scale=Math.min(1,maxDim/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
    canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    blob=await canvasToBlob(canvas,svgSource?'image/png':'image/jpeg',svgSource?undefined:quality);
    if(!blob)throw new Error('Obrázek se nepodařilo zmenšit.');
    if(blob.size<=perImageTarget||maxDim<=1200)break;
    if(quality>0.72)quality-=0.08;else maxDim=Math.round(maxDim*0.82);
  }
  return {mime_type:svgSource?'image/png':'image/jpeg',data:await blobToBase64(blob),name:file.name,bytes:blob.size,originalBytes:file.size,compressed:true,width:canvas.width,height:canvas.height};
}
function visualAnalysisPayload(asset){if(!asset)return null;const mime=isImageMime(asset.analysis_mime_type)?asset.analysis_mime_type:asset.mime_type,data=String(asset.analysis_data||asset.data||'').replace(/\s+/g,'');return isImageMime(mime)&&data?{mime_type:mime,data}:null}
function extractionMediaParts(upload){
  const out=[];
  for(const it of ((upload&&upload.items)||[])){if(!isImageMime(it&&it.mime_type))out.push({inline_data:{mime_type:it.mime_type,data:it.data}})}
  for(const asset of sourceVisualAssets){const payload=visualAnalysisPayload(asset);if(!payload)continue;out.push({text:String(asset.id||'VISUAL')+' — zdrojový obrázek '+String(asset.name||'')+(asset.analysis_data?' (AI dostává lokálně vylepšenou čtecí kopii; originál je zachován pro výstup).':'.')});out.push({inline_data:payload})}
  return out;
}
function mediaBytes(items){return items.reduce((sum,it)=>sum+utf8Bytes(it.data||''),0)}
let multimediaModulePromise=null;
function loadMultimediaModule(){return multimediaModulePromise||(multimediaModulePromise=import('./modules/multimedia.js'))}
let sourceMediaAsset=null;
function cloneMediaSource(value,withData=true){if(!value||!/^(?:audio|video)$/.test(String(value.kind||'')))return null;const mime=String(value.mime_type||'');if(!/^(?:audio|video)\//i.test(mime))return null;const out={kind:value.kind,name:String(value.name||value.kind).slice(0,300),mime_type:mime,bytes:Number(value.bytes)||0};if(withData)out.data=String(value.data||'').replace(/\s+/g,'');return out}
function resetSourceMedia(){sourceMediaAsset=null}
function sourceMediaPromptLines(){if(!sourceMediaAsset)return [];const k=sourceMediaAsset.kind==='audio'?'AUDIO / POSLECH':'VIDEO / AUDIOVIZUÁLNÍ PODKLAD';return [k+': zdrojový soubor „'+sourceMediaAsset.name+'“ je pevnou součástí materiálu. V tasks vlož marker [[MEDIA_SOURCE]] tam, kde má žák dostat pokyn k přehrání podkladu. Pokud jde o poslechovou nebo observační úlohu, NESMÍŠ do student_instructions ani tasks prozradit transkript, titulky, přesné repliky, popis odpovědí nebo jiné informace, které má žák teprve zjistit ze záznamu. Transkript/rozbor smí být použit v answer_key a teacher_note. Zdrojové médium při paralelní variantě neměň ani nepředstírej, že vznikl nový soubor.'];}
function sheetMediaAiParts(sheet){const m=cloneMediaSource(sheet&&sheet._mediaSource,true);return m&&m.data?[{text:(m.kind==='audio'?'Zdrojové audio':'Zdrojové video')+' pro tento pracovní list: '+m.name+'.'},{inline_data:{mime_type:m.mime_type,data:m.data}}]:[]}

function ensureMediaSourceMarker(parsed){
  if(!sourceMediaAsset||!parsed)return parsed;
  const parts={...(parsed.parts||{})},combined=[parts.instructions,parts.tasks,parsed.worksheet].join('\n');
  if(!/\[\[MEDIA_SOURCE\]\]/i.test(combined))parts.tasks='[[MEDIA_SOURCE]]\n\n'+String(parts.tasks||parsed.worksheet||'').trim();
  const worksheet=[parts.title,parts.instructions,parts.tasks].map(x=>String(x||'').trim()).filter(Boolean).join('\n\n');
  return {...parsed,parts,worksheet:worksheet||parts.tasks||parsed.worksheet};
}
function normalizedSafetyWords(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/\[\[media_source\]\]/gi,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/).filter(w=>w.length>1)}
function mediaStudentSafetyIssues(parsed,sourceText){
  if(!sourceMediaAsset||!parsed)return [];
  const parts=parsed.parts||{},student=normalizedSafetyWords([parts.instructions,parts.tasks].join(' ')),source=normalizedSafetyWords(sourceText),issues=[];
  if(!/\[\[MEDIA_SOURCE\]\]/i.test(String(parts.instructions||'')+'\n'+String(parts.tasks||'')))issues.push('V žákovské části chybí marker [[MEDIA_SOURCE]].');
  if(student.length<14||source.length<14)return issues;
  const studentText=' '+student.join(' ')+' ',windowSize=14;
  for(let i=0;i<=source.length-windowSize;i++){
    const seq=source.slice(i,i+windowSize).join(' ');
    if(seq.length>50&&studentText.includes(' '+seq+' ')){issues.push('Žákovská část obsahuje souvislou pasáž zdrojového přepisu ('+source.slice(i,i+Math.min(windowSize,8)).join(' ')+' …).');break}
  }
  return issues;
}
function mediaSourceNode(media,printMode=false){const m=cloneMediaSource(media,true);if(!m)return null;const box=document.createElement('figure');box.className=printMode?'print-media-source':'worksheet-media-source';const cap=document.createElement('figcaption');cap.textContent=(m.kind==='audio'?'Poslechový podklad: ':'Video podklad: ')+m.name;box.appendChild(cap);if(!printMode&&m.data){const el=document.createElement(m.kind==='audio'?'audio':'video');el.controls=true;el.preload='metadata';el.src='data:'+m.mime_type+';base64,'+m.data;if(m.kind==='video')el.playsInline=true;box.appendChild(el)}else{const note=document.createElement('div');note.className='media-print-note';note.textContent='Zdrojový soubor přehraje učitel / je přiložen samostatně.';box.appendChild(note)}return box}
function mediaSourceHtml(media){const m=cloneMediaSource(media,false);return m?'<figure class="print-media-source"><figcaption>'+esc((m.kind==='audio'?'Poslechový podklad: ':'Video podklad: ')+m.name)+'</figcaption><div class="media-print-note">Zdrojový soubor přehraje učitel / je přiložen samostatně.</div></figure>':''}

const VISUAL_MODES=Object.freeze(['preserve','reconstruct','reference','ignore']);
const VISUAL_ROLES=Object.freeze(['critical','supporting','page_scan','decorative','unknown']);
const VISUAL_TYPES=Object.freeze(['map','graph','diagram','geometry','biology','chemistry','table','notation','timeline','circuit','molecule','anatomy','artwork','photograph','source','other']);
const VISUAL_INTENTS=Object.freeze(['content_visual','task_image','hybrid','decorative','unknown']);
let sourceVisualAssets=[];
let sourceDocumentVisualNotes=[];
let sourceScanReport=null;
let sourceStructureReport=null;
let visualAssetSeq=0;
let cropState=null;
function nextVisualId(){visualAssetSeq+=1;return 'VISUAL_'+visualAssetSeq}
function isImageMime(mime){return /^image\/(?:png|jpe?g|webp|gif)$/i.test(String(mime||''))}
function visualDataUrl(asset){return asset&&isImageMime(asset.mime_type)&&/^[A-Za-z0-9+/=\r\n]+$/.test(String(asset.data||''))?'data:'+asset.mime_type+';base64,'+String(asset.data||'').replace(/\s+/g,''):''}
function visualRoleLabel(role){return ({critical:'obrazově klíčový podklad',supporting:'podpůrný obrázek',page_scan:'fotografie / sken celé stránky',decorative:'dekorativní obrázek',unknown:'nerozpoznaný obrázek'})[role]||'nerozpoznaný obrázek'}
function visualTypeLabel(type){return ({map:'mapa',graph:'graf',diagram:'schéma',geometry:'geometrický nákres',biology:'biologický obrázek',chemistry:'chemický obrazový podklad',table:'tabulka jako obraz',notation:'speciální zápis / notace',timeline:'časová osa',circuit:'elektrické schéma',molecule:'strukturní / molekulový obraz',anatomy:'anatomický obraz',artwork:'reprodukce díla',photograph:'fotografie',source:'obrazový pramen',other:'jiný obrazový podklad'})[type]||'jiný obrazový podklad'}
function normalizeVisualIntent(value){return VISUAL_INTENTS.includes(String(value||'').toLowerCase())?String(value).toLowerCase():'unknown'}
function visualIntentLabel(intent){return ({content_visual:'obrazový obsah, který má žák skutečně používat',task_image:'úloha zachycená jako obrázek',hybrid:'obrazový obsah a textová úloha v jednom obrázku',decorative:'dekorativní obraz',unknown:'role obrazu není jistá'})[normalizeVisualIntent(intent)]||'role obrazu není jistá'}
function normalizeVisualConfidence(value){const n=Number(String(value??'').replace(',','.'));return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0}
function normalizeVisualItemCounts(value){const src=Array.isArray(value)?value:String(value??'').split(',');return src.map(x=>Number.parseInt(String(x).trim(),10)).filter(n=>Number.isInteger(n)&&n>0&&n<=200).slice(0,60)}
function normalizeExplicitExamples(value){if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number.parseInt(String(value).trim(),10);return Number.isInteger(n)&&n>=0&&n<=50?n:null}
function normalizeStructureLayout(value){const v=String(value||'').trim().toLowerCase().replace(/[\s-]+/g,'_');return /^(?:vertical_arithmetic_grid|grid|table|list|mixed)$/.test(v)?v:''}
function normalizeStructureDimension(value){const n=normalizeExplicitExamples(value);return n?n:null}
function normalizeVisualMode(value){const v=String(value||'').toLowerCase();if(v==='task'||v==='convert')return 'reconstruct';return VISUAL_MODES.includes(v)?v:'reference'}
function defaultVisualMode(role,intent='unknown'){
  const i=normalizeVisualIntent(intent);
  if(i==='task_image'||i==='hybrid')return 'reconstruct';
  if(i==='content_visual')return 'preserve';
  if(i==='decorative'||role==='decorative')return 'ignore';
  if(role==='page_scan')return 'reconstruct';
  return role==='critical'?'preserve':'reference';
}
function cloneVisualAsset(asset){return asset?{id:String(asset.id||''),name:String(asset.name||''),mime_type:String(asset.mime_type||''),data:String(asset.data||''),role:VISUAL_ROLES.includes(asset.role)?asset.role:'unknown',type:VISUAL_TYPES.includes(asset.type)?asset.type:'other',intent:normalizeVisualIntent(asset.intent),confidence:normalizeVisualConfidence(asset.confidence),description:String(asset.description||'').slice(0,500),task_item_counts:normalizeVisualItemCounts(asset.task_item_counts),explicit_examples:normalizeExplicitExamples(asset.explicit_examples),mode:normalizeVisualMode(asset.mode),source:String(asset.source||'upload'),optimized:!!asset.optimized,width:Number(asset.width)||0,height:Number(asset.height)||0} : null}
function cloneSourceVisualAsset(asset){const out=cloneVisualAsset(asset);if(!out)return null;out.analysis_data=String(asset.analysis_data||'');out.analysis_mime_type=String(asset.analysis_mime_type||'');out.analysis_mode=String(asset.analysis_mode||'');out.quality=asset.quality?{...asset.quality,warnings:[...(asset.quality.warnings||[])]}:null;out.modeTouched=!!asset.modeTouched;return out}
function setSourceVisualAssetsFromItems(items,source='upload'){
  visualAssetSeq=0;
  sourceVisualAssets=(items||[]).filter(it=>isImageMime(it&&it.mime_type)).map(it=>({id:nextVisualId(),name:String(it.name||'obrázek'),mime_type:it.mime_type,data:String(it.data||''),bytes:Number(it.bytes)||0,role:'unknown',type:'other',intent:'unknown',confidence:0,description:'',task_item_counts:[],explicit_examples:null,mode:'reference',source,optimized:!!it.compressed,width:Number(it.width)||0,height:Number(it.height)||0,analysis_data:'',analysis_mime_type:'',analysis_mode:'',quality:null,modeTouched:false}));
  sourceDocumentVisualNotes=[];sourceScanReport=null;sourceStructureReport=null;
  renderSourceVisualPanel();
  for(const asset of sourceVisualAssets)analyzeVisualQuality(asset).then(()=>renderSourceVisualPanel()).catch(()=>{});
}
function resetSourceVisualAssets(){sourceVisualAssets=[];sourceDocumentVisualNotes=[];sourceScanReport=null;sourceStructureReport=null;visualAssetSeq=0;renderSourceVisualPanel()}
function parseVisualManifestLine(line){
  const raw=String(line||'').trim();if(!raw)return null;
  const parts=raw.split('|').map(x=>x.trim()).filter(Boolean),head=parts.shift()||'',out={};
  if(/^VISUAL_\d+$/i.test(head))out.id=head.toUpperCase();
  else if(/^PDF_VISUAL$/i.test(head))out.id='PDF_VISUAL';
  else if(/^SCAN_REPORT$/i.test(head))out.id='SCAN_REPORT';
  else if(/^SOURCE_STRUCTURE$/i.test(head))out.id='SOURCE_STRUCTURE';
  else return null;
  for(const part of parts){const m=part.match(/^([a-z_]+)\s*=\s*(.*)$/i);if(m)out[m[1].toLowerCase()]=m[2].trim()}
  return out;
}
function splitVisualManifest(raw){
  const src=String(raw||'');
  const m=src.match(/<<<VISUAL_MANIFEST>>>([\s\S]*?)<<<END_VISUAL_MANIFEST>>>/i);
  if(!m)return {text:src.trim(),entries:[],documentEntries:[],scanReports:[],sourceStructures:[]};
  const entries=[],documentEntries=[],scanReports=[],sourceStructures=[];
  for(const line of m[1].split(/\r?\n/)){const item=parseVisualManifestLine(line);if(!item)continue;if(item.id==='PDF_VISUAL')documentEntries.push(item);else if(item.id==='SCAN_REPORT')scanReports.push(item);else if(item.id==='SOURCE_STRUCTURE')sourceStructures.push(item);else entries.push(item)}
  const text=(src.slice(0,m.index)+src.slice((m.index||0)+m[0].length)).trim();
  return {text,entries,documentEntries,scanReports,sourceStructures};
}
function applyVisualManifest(entries,documentEntries,scanReports=[],sourceStructures=[]){
  const byId=new Map((entries||[]).map(x=>[String(x.id||'').toUpperCase(),x]));
  sourceVisualAssets=sourceVisualAssets.map(asset=>{
    const meta=byId.get(String(asset.id).toUpperCase());if(!meta)return asset;
    const role=VISUAL_ROLES.includes(String(meta.role||'').toLowerCase())?String(meta.role).toLowerCase():'unknown';
    const type=VISUAL_TYPES.includes(String(meta.type||'').toLowerCase())?String(meta.type).toLowerCase():'other';
    const intent=normalizeVisualIntent(meta.intent||meta.visual_intent),confidence=normalizeVisualConfidence(meta.confidence);
    return {...asset,role,type,intent,confidence,description:String(meta.description||meta.desc||'').slice(0,500),task_item_counts:normalizeVisualItemCounts(meta.task_item_counts||meta.item_counts),explicit_examples:normalizeExplicitExamples(meta.explicit_examples),mode:asset.modeTouched?normalizeVisualMode(asset.mode):defaultVisualMode(role,intent)};
  });
  sourceDocumentVisualNotes=(documentEntries||[]).map(x=>({page:String(x.page||''),role:VISUAL_ROLES.includes(String(x.role||'').toLowerCase())?String(x.role).toLowerCase():'unknown',type:VISUAL_TYPES.includes(String(x.type||'').toLowerCase())?String(x.type).toLowerCase():'other',intent:normalizeVisualIntent(x.intent||x.visual_intent),confidence:normalizeVisualConfidence(x.confidence),description:String(x.description||x.desc||'').slice(0,500)}));
  const report=(scanReports||[])[0]||null;sourceScanReport=report?{status:/^(good|fair|poor)$/i.test(String(report.status||''))?String(report.status).toLowerCase():'fair',pages:Math.max(0,Number.parseInt(report.pages,10)||0),issues:String(report.issues||report.description||'').slice(0,700)}:null;
  const structure=(sourceStructures||[])[0]||null;sourceStructureReport=structure?{itemCounts:normalizeVisualItemCounts(structure.task_item_counts||structure.item_counts),explicitExamples:normalizeExplicitExamples(structure.explicit_examples),layout:normalizeStructureLayout(structure.layout),columns:normalizeStructureDimension(structure.columns),rows:normalizeStructureDimension(structure.rows)}:null;
  renderSourceVisualPanel();
}
function visualManifestPrompt(actualCount,isPdf=false){const rows=actualCount?'For EACH image '+Array.from({length:actualCount},(_,i)=>'VISUAL_'+(i+1)).join(', ')+' add a row. ':'';return 'After transcription add hidden block.\n<<<VISUAL_MANIFEST>>>\n'+rows+'Add SOURCE_STRUCTURE|task_item_counts=12|layout=list|columns=1|rows=12|explicit_examples=0|description=short note. task_item_counts = solvable items per main task in source order; exclude title/instructions/decoration. layout: vertical_arithmetic_grid / grid / table / list / mixed. A written-arithmetic grid uses vertical_arithmetic_grid with real columns/rows; the grid is ONE main task, each calculation one item. If uncertain leave task_item_counts empty. explicit_examples counts only explicitly unscored examples. Image: VISUAL_1|role=critical|type=map|intent=content_visual|confidence=0.95|task_item_counts=7|explicit_examples=0|description=short note. For task_image/hybrid give task counts; content_visual/decorative may leave them empty. role: critical / supporting / page_scan / decorative. type: map / graph / diagram / geometry / biology / chemistry / table / notation / timeline / circuit / molecule / anatomy / artwork / photograph / source / other. intent REQUIRED: content_visual / task_image / hybrid / decorative / unknown. task_image=scanned task to reconstruct; content_visual=image pupils need; hybrid=both; decorative=non-didactic; confidence=0-1. '+(isPdf?'For a critical PDF image not attached separately add PDF_VISUAL|page=number|role=critical|type=map|intent=content_visual|confidence=0.95|description=short note. ':'')+'Add SCAN_REPORT|status=good|pages=1|issues=none; status good/fair/poor. Never guess unreadable content or invent visuals.\n<<<END_VISUAL_MANIFEST>>>'}
function sourceVisualPromptLines(){
  const active=sourceVisualAssets.filter(a=>a.mode!=='ignore');if(!active.length&&!sourceDocumentVisualNotes.length)return [];
  const lines=['OBRAZOVÉ PODKLADY — DIDAKTICKÁ ROLE JE ZÁVAZNÁ:'];
  for(const a of active){
    const intent=normalizeVisualIntent(a.intent);
    if(a.mode==='preserve'){
      lines.push(a.id+': POUŽÍT JAKO PŮVODNÍ OBRAZOVÝ PODKLAD; '+visualTypeLabel(a.type)+'; '+(a.description||visualIntentLabel(intent))+'.');
      lines.push('Pro '+a.id+' vlož do tasks marker [['+a.id+']] PŘESNĚ JEDNOU a vždy jako samostatný blokový řádek mezi dvěma úplnými větami/odstavci. Marker nesmí být uvnitř věty. Obraz nepřekresluj, nepřepisuj do textu a neměň jeho obsah; aplikace marker nahradí uloženým zdrojovým obrázkem. VŠECHNY hodnoty, popisky, polohy, symboly a fakta zakódované v zachovaném obrazu jsou neměnné.');
      if(intent==='task_image'||intent==='hybrid')lines.push('UPOZORNĚNÍ: učitel ručně přepsal doporučení a chce zachovat celý '+a.id+'. Nevkládej jej vícekrát a neopakuj stejnou úlohu ještě jednou jako kopii pod obrázkem.');
    }else if(a.mode==='reconstruct'){
      lines.push(a.id+': PŘEVÉST NA NOVOU EDITOVATELNOU/DIFERENCOVANOU ÚLOHU; '+visualTypeLabel(a.type)+'; '+(a.description||visualIntentLabel(intent))+'.');
      if(a.task_item_counts&&a.task_item_counts.length)lines.push('STRUKTURNÍ KONTRAKT '+a.id+': jednotlivé hlavní úlohy v tomto obrazu mají po '+a.task_item_counts.join(', ')+' položkách. Při režimu se zachováním struktury tyto počty přesně dodrž.');
      if(a.explicit_examples===0)lines.push('V '+a.id+' není žádná položka výslovně označená jako nehodnocený příklad. Nepřeváděj předvyplněnou nebo ručně dopsanou odpověď na „Example / not scored“; v nové variantě zachovej odpovídající plnohodnotnou řešitelnou a bodovatelnou položku.');
      else if(Number.isInteger(a.explicit_examples)&&a.explicit_examples>0)lines.push('V '+a.id+' je výslovně označeno '+a.explicit_examples+' nehodnocených příkladů/vzorů; nevytvářej další navíc.');
      lines.push('Pro '+a.id+' NEVKLÁDEJ marker [['+a.id+']] ani původní bitmapu do žákovského výstupu. Nejprve věrně pochop strukturu, položky, instrukce, data a vazby zachycené v obrazu a potom je vytvoř jako čistý text/tabulku/úlohu v tasks podle zvolené diferenciace. Chraň význam, pořadí a řešitelnost úlohy, nikoli pixely. Nezdvojuj původní a novou verzi stejné úlohy.');
      if(intent==='hybrid')lines.push('HYBRIDNÍ PODKLAD '+a.id+': celý screenshot nezachovávej. Pokud bez skutečné obrazové části nelze úlohu bezpečně rekonstruovat, upozorni v teacher_note, že učitel má vyříznout a zachovat jen mapu/graf/schéma/fotografii.');
    }else{
      lines.push(a.id+': POUŽÍT JEN JAKO REFERENCI; '+visualTypeLabel(a.type)+'; '+(a.description||visualIntentLabel(intent))+'. Marker [['+a.id+']] do žákovského výstupu nevkládej.');
    }
  }
  if(sourceDocumentVisualNotes.length)lines.push('Zdrojový PDF/dokument obsahuje obrazově důležitý prvek. Pokud k němu učitel přidal samostatný snímek nebo výřez mezi VISUAL_n, respektuj jeho zvolenou didaktickou roli. Pokud samostatný obraz přidán není, nevymýšlej náhradu a v teacher_note upozorni, že původní obraz z PDF nelze pixelově přenést bez doplňkového snímku.');
  return [lines.join(' ')];
}
function sourceStructurePromptLines(){const r=sourceStructureReport;if(!r||!r.itemCounts?.length)return [];const n=r.itemCounts.reduce((a,b)=>a+b,0),p=['SOURCE STRUCTURE: '+r.itemCounts.length+' tasks; items '+r.itemCounts.join(', ')+'; total '+n+'.'];if(r.layout==='vertical_arithmetic_grid')p.push('WRITTEN ARITHMETIC GRID'+(r.columns?' '+r.columns+' cols':'')+(r.rows?' x '+r.rows+' rows':'')+': one main task + one EDU_ARITH with all items. Each item once; NEPI\u0160 sou\u010dasn\u011b horizontalni a svisly zapis.');else if(r.layout)p.push('Layout '+r.layout+(r.columns?', '+r.columns+' cols':'')+(r.rows?', '+r.rows+' rows':'')+'.');return [p.join(' ')]}
function sourceStructureContract(key='core'){
  const a=typeof getAdvancedOptions==='function'?getAdvancedOptions():{variantMode:'auto',allowExtensions:false};
  // The explicit structure selector is authoritative. In auto mode resolvedStructureMode()
  // still derives strict/flexible from the selected variant mode, but an explicit Flexible
  // choice must not be silently overridden by same_format_new_content/same_content_same_format.
  const strict=(typeof resolvedStructureMode==='function'?resolvedStructureMode(key):'auto')==='strict';
  const reconstructed=sourceVisualAssets.filter(x=>x.mode==='reconstruct'&&(normalizeVisualIntent(x.intent)==='task_image'||normalizeVisualIntent(x.intent)==='hybrid'));
  const rawGlobalCounts=normalizeVisualItemCounts(sourceStructureReport&&sourceStructureReport.itemCounts);
  const globalCounts=sourceStructureReport&&sourceStructureReport.layout==='vertical_arithmetic_grid'&&rawGlobalCounts.length>1?[rawGlobalCounts.reduce((a,b)=>a+b,0)]:rawGlobalCounts;
  const itemCounts=globalCounts.length?globalCounts:reconstructed.flatMap(x=>normalizeVisualItemCounts(x.task_item_counts));
  const globalExamples=sourceStructureReport?normalizeExplicitExamples(sourceStructureReport.explicitExamples):null;
  const exampleValues=reconstructed.map(x=>normalizeExplicitExamples(x.explicit_examples));
  const examplesKnown=exampleValues.length>0&&exampleValues.every(x=>x!==null);
  return {enforce:!!strict,itemCounts,expectedMainTasks:itemCounts.length,explicitExamples:globalExamples!==null?globalExamples:(examplesKnown?exampleValues.reduce((a,b)=>a+b,0):null),allowExtensions:!!a.allowExtensions,variantMode:String(a.variantMode||'auto'),layout:normalizeStructureLayout(sourceStructureReport&&sourceStructureReport.layout),columns:normalizeStructureDimension(sourceStructureReport&&sourceStructureReport.columns),rows:normalizeStructureDimension(sourceStructureReport&&sourceStructureReport.rows)};
}
function generatedMainTaskBlocks(text){return typeof splitScoringBlocks==='function'?splitScoringBlocks(text).filter(b=>b.isTask):[]}
function looksLikeStandaloneMathEquation(value){
  let s=String(value||'').trim().replace(/^\*{1,2}|\*{1,2}$/g,'').trim();
  s=s.replace(/^\d{1,3}\s*[.)-]\s*/, '').trim();
  if(!s.includes('=')||!/[a-zA-Z]/.test(s))return false;
  if(/[?!]/.test(s)||/\b(?:solve|vyřeš|vypočítej|rovnic|equation|doplň|urči)\b/i.test(s))return false;
  return !/[^0-9a-zA-Z\s=+\-−–—*/:·×÷().,\[\]{}^\\]/.test(s);
}
function mathEquationItemCount(lines){
  let table=0,standalone=0;
  for(const raw of lines){const line=String(raw||'').trim();if(!line)continue;
    if(line.includes('|')){const cells=line.replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());if(cells.length>1&&!cells.every(x=>/^:?-{3,}:?$/.test(x)))for(const cell of cells)if(looksLikeStandaloneMathEquation(cell))table++;continue;}
    if(looksLikeStandaloneMathEquation(line))standalone++;
  }
  return table||standalone;
}
function arithmeticMarkerMeta(lines){for(const raw of lines){const info=typeof educationalMarkerInfo==='function'?educationalMarkerInfo(raw):null;if(info&&info.kind==='arith'&&!info.error){const items=Array.isArray(info.spec&&info.spec.items)?info.spec.items:[],columns=normalizeStructureDimension(info.spec&&info.spec.columns);return {count:items.length,columns}}}return null}
function generatedMainTaskItemCounts(text){return generatedMainTaskBlocks(text).map(block=>{const lines=String(block.text||'').split(/\r?\n/);lines.shift();const arith=arithmeticMarkerMeta(lines);if(arith&&arith.count)return arith.count;const nums=[];for(const line of lines){const m=String(line||'').trim().replace(/^\*{1,2}/,'').match(/^(\d{1,3})\s*(?:[.)-]|:)\s*\S/);if(m)nums.push(Number(m[1]))}const numbered=new Set(nums).size;if(numbered)return numbered;return typeof stemSubjectKind==='function'&&stemSubjectKind(typeof getSubjectValue==='function'?getSubjectValue():'')==='math'?mathEquationItemCount(lines):0})}
function structurePreservationIssues(text,contract){
  const c=contract&&typeof contract==='object'?contract:null;if(!c||!c.enforce||!Array.isArray(c.itemCounts)||!c.itemCounts.length)return [];
  const issues=[],blocks=generatedMainTaskBlocks(text),actual=generatedMainTaskItemCounts(text),expected=c.itemCounts;
  if(c.allowExtensions){if(blocks.length<expected.length)issues.push('Režim zachování struktury očekává nejméně '+expected.length+' původních hlavních úloh, ale výstup jich má '+blocks.length+'.')}
  else if(blocks.length!==expected.length)issues.push('Režim zachování struktury očekává přesně '+expected.length+' hlavních úloh, ale výstup jich má '+blocks.length+'.');
  for(let i=0;i<Math.min(expected.length,actual.length);i++)if(actual[i]!==expected[i])issues.push('Hlavní úloha '+(i+1)+' má mít '+expected[i]+' položek podle originálu, ale výstup jich rozpoznal '+actual[i]+'.');
  if(c.layout==='vertical_arithmetic_grid'){const metas=blocks.slice(0,expected.length).map(b=>arithmeticMarkerMeta(String(b.text||'').split(/\r?\n/).slice(1))).filter(Boolean);if(metas.length!==1)issues.push('Originál používá kompaktní mřížku písemné aritmetiky; výstup ji má zachovat jako jeden blok EDU_ARITH místo opakovaného horizontálního a svislého zápisu.');else if(c.columns&&metas[0].columns!==c.columns)issues.push('Mřížka písemné aritmetiky má zachovat '+c.columns+' sloupce podle originálu, ale výstup používá '+(metas[0].columns||'neurčený počet')+'.');}
  if(c.explicitExamples===0){const protectedText=blocks.slice(0,expected.length).map(b=>b.text).join('\n');if(/\b(?:example|sample|vzor|příklad)\b[^\n]{0,45}\b(?:not\s+scored|unscored|nehodnocen|nebodovan)/i.test(protectedText)||/\b(?:not\s+scored|unscored|nehodnocen[áýo]?|nebodovan[áýo]?)\b/i.test(protectedText))issues.push('Výstup vytvořil nehodnocený příklad, přestože originál žádný výslovně označený nehodnocený příklad nemá. Předvyplněnou odpověď nelze automaticky považovat za vzor.');}
  return [...new Set(issues)];
}
function generationVisualParts(){
  const parts=[];
  for(const a of sourceVisualAssets.filter(x=>x.mode!=='ignore'&&visualDataUrl(x))){const payload=visualAnalysisPayload(a)||{mime_type:a.mime_type,data:a.data};const modeLabel=a.mode==='preserve'?'použít jako původní obrazový podklad':a.mode==='reconstruct'?'převést na novou úlohu':'pouze reference';parts.push({text:a.id+' — '+(a.description||visualTypeLabel(a.type))+'; didaktická role '+visualIntentLabel(a.intent)+'; režim '+modeLabel+(a.task_item_counts&&a.task_item_counts.length?'; původní počty položek '+a.task_item_counts.join(', '):'')+(a.explicit_examples!==null?'; explicitní nehodnocené příklady '+a.explicit_examples:'')+(a.analysis_data?'; pro čtení je přiložena lokálně vylepšená kopie, ale případný zachovaný obraz používá originál':'')+'.'});parts.push({inline_data:payload})}
  return parts;
}
function preservedSourceVisualAssets(){return sourceVisualAssets.filter(a=>a.mode==='preserve'&&visualDataUrl(a)).map(cloneVisualAsset).filter(Boolean)}
function sheetVisualAiParts(sheet){const parts=[];for(const a of ((sheet&&sheet._visualAssets)||[])){if(!visualDataUrl(a))continue;parts.push({text:String(a.id||'VISUAL')+' — přesně zachovaný obrazový podklad: '+(a.description||visualTypeLabel(a.type))+'.'});parts.push({inline_data:{mime_type:a.mime_type,data:a.data}})}return parts}
function hasPdfUpload(){return !!(uploaded&&Array.isArray(uploaded.items)&&uploaded.items.some(it=>it&&it.mime_type==='application/pdf'))}
function scanStatusLabel(status){return ({good:'dobrá',fair:'omezená – zkontroluj přepis',poor:'nízká – nutná ruční kontrola'})[status]||'nezjištěná'}
async function analyzeVisualQuality(asset){
  const url=visualDataUrl(asset);if(!asset||!url)return null;
  const img=await loadImg(url),max=420,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);const px=ctx.getImageData(0,0,c.width,c.height).data,lums=new Float32Array(c.width*c.height);let sum=0,sum2=0,edge=0,edgeN=0;
  for(let i=0,j=0;i<px.length;i+=4,j++){const y=.2126*px[i]+.7152*px[i+1]+.0722*px[i+2];lums[j]=y;sum+=y;sum2+=y*y}
  for(let y=1;y<c.height;y++)for(let x=1;x<c.width;x++){const i=y*c.width+x;edge+=Math.abs(lums[i]-lums[i-1])+Math.abs(lums[i]-lums[i-c.width]);edgeN+=2}
  const n=Math.max(1,lums.length),mean=sum/n,std=Math.sqrt(Math.max(0,sum2/n-mean*mean)),sharp=edge/Math.max(1,edgeN),warnings=[];
  if(Math.min(img.naturalWidth,img.naturalHeight)<700||Math.max(img.naturalWidth,img.naturalHeight)<1100)warnings.push('nižší rozlišení');
  if(std<26)warnings.push('nízký kontrast');
  if(sharp<5.5&&Math.min(img.naturalWidth,img.naturalHeight)>=500)warnings.push('obraz může být rozmazaný');
  asset.width=img.naturalWidth;asset.height=img.naturalHeight;asset.quality={contrast:Math.round(std*10)/10,sharpness:Math.round(sharp*10)/10,warnings};return asset.quality;
}
async function rotateVisualAsset(id,dir=1){
  const asset=sourceVisualAssets.find(a=>a.id===id),url=visualDataUrl(asset);if(!asset||!url)return;const img=await loadImg(url),c=document.createElement('canvas'),turn=dir<0?-1:1;c.width=img.naturalHeight;c.height=img.naturalWidth;const ctx=c.getContext('2d');ctx.translate(c.width/2,c.height/2);ctx.rotate(turn*Math.PI/2);ctx.drawImage(img,-img.naturalWidth/2,-img.naturalHeight/2);const mime=asset.mime_type==='image/png'?'image/png':'image/jpeg',blob=await canvasToBlob(c,mime,mime==='image/jpeg'?0.95:undefined);if(!blob)return;asset.mime_type=mime;asset.data=await blobToBase64(blob);asset.bytes=blob.size;asset.width=c.width;asset.height=c.height;asset.analysis_data='';asset.analysis_mime_type='';asset.analysis_mode='';await analyzeVisualQuality(asset).catch(()=>{});renderSourceVisualPanel();
}
async function enhanceVisualForAnalysis(id){
  const asset=sourceVisualAssets.find(a=>a.id===id),url=visualDataUrl(asset);if(!asset||!url)return;
  if(asset.analysis_data){asset.analysis_data='';asset.analysis_mime_type='';asset.analysis_mode='';renderSourceVisualPanel();return}
  const img=await loadImg(url),maxDim=2300,scale=Math.min(1,maxDim/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);const image=ctx.getImageData(0,0,c.width,c.height),px=image.data,hist=new Uint32Array(256),count=c.width*c.height;
  for(let i=0;i<px.length;i+=4){const y=Math.max(0,Math.min(255,Math.round(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2])));hist[y]++}
  const percentile=q=>{const target=count*q;let acc=0;for(let i=0;i<256;i++){acc+=hist[i];if(acc>=target)return i}return q<.5?0:255},lo=percentile(.02),hi=Math.max(lo+24,percentile(.98)),gain=255/(hi-lo);
  for(let i=0;i<px.length;i+=4){px[i]=Math.max(0,Math.min(255,(px[i]-lo)*gain));px[i+1]=Math.max(0,Math.min(255,(px[i+1]-lo)*gain));px[i+2]=Math.max(0,Math.min(255,(px[i+2]-lo)*gain))}
  ctx.putImageData(image,0,0);const blob=await canvasToBlob(c,'image/jpeg',0.92);if(!blob)return;asset.analysis_data=await blobToBase64(blob);asset.analysis_mime_type='image/jpeg';asset.analysis_mode='contrast';renderSourceVisualPanel();
}
function moveVisualAsset(id,delta){
  const i=sourceVisualAssets.findIndex(a=>a.id===id),j=i+delta;if(i<0||j<0||j>=sourceVisualAssets.length)return;const [a]=sourceVisualAssets.splice(i,1);sourceVisualAssets.splice(j,0,a);renderSourceVisualPanel();
}
async function appendSupplementalVisualFiles(fileList){
  const files=[...fileList].filter(f=>(f.type||'').startsWith('image/'));if(!files.length)return;
  if(sourceVisualAssets.length+files.length>MAX_IMAGE_COUNT)throw makeAppError('Celkem lze držet maximálně '+MAX_IMAGE_COUNT+' obrazových podkladů.','TOO_MANY_IMAGES');
  const items=[];for(const f of files)items.push(await resizeImage(f,true,Math.max(1,files.length)));
  for(const it of items){const asset={id:nextVisualId(),name:String(it.name||'doplňkový obrázek'),mime_type:it.mime_type,data:String(it.data||''),bytes:Number(it.bytes)||0,role:'critical',type:'other',intent:'content_visual',confidence:1,description:'Doplňkový snímek nebo výřez přidaný učitelem k PDF/skenu',mode:'preserve',source:'pdf-supplement',optimized:!!it.compressed,width:Number(it.width)||0,height:Number(it.height)||0,analysis_data:'',analysis_mime_type:'',analysis_mode:'',quality:null,modeTouched:true};sourceVisualAssets.push(asset);analyzeVisualQuality(asset).then(()=>renderSourceVisualPanel()).catch(()=>{})}
  renderSourceVisualPanel();showMessage('Obrazový podklad přidán','Snímek/výřez je nastavený na zachování. Pokud obsahuje jen část stránky, můžeš ho ještě otočit, vylepšit pro čtení AI nebo dále vyříznout.');
}
function visualModeLabel(mode){return ({preserve:'Použít jako původní obrazový podklad',reconstruct:'Převést na novou diferencovanou úlohu',reference:'Použít jen jako referenci',ignore:'Nepoužívat'})[normalizeVisualMode(mode)]||'Použít jen jako referenci'}
function visualModeHelp(mode){return ({reconstruct:'Vhodné pro screenshot nebo scan hotové úlohy: AI ji přečte a vytvoří znovu; původní obrázek se do žákovského výstupu nevloží.',preserve:'Vhodné pro mapu, graf, fotografii nebo schéma, které má žák opravdu používat. Původní obraz zůstane ve výsledku.',reference:'AI smí obrázek použít jako zdroj informací nebo kontext, ale nemusí zachovat stejnou úlohu a obrázek se do výsledku nevloží.',ignore:'Obrázek se při tvorbě nové verze ignoruje.'})[normalizeVisualMode(mode)]||''}
function visualIntentReliable(asset){const intent=normalizeVisualIntent(asset&&asset.intent),confidence=normalizeVisualConfidence(asset&&asset.confidence);return intent!=='unknown'&&(confidence===0||confidence>=.6)}
function visualRecommendedMode(asset){return defaultVisualMode(asset&&asset.role,asset&&asset.intent)}
function renderSourceVisualPanel(){
  const panel=$('#visualSourcePanel'),list=$('#visualSourceList'),summary=$('#visualSourceSummary'),badge=$('#visualSourceBadge'),warning=$('#visualSourceWarning'),supp=$('#visualSupplementBtn'),applyAll=$('#visualApplyRecommendedBtn'),enhanceAll=$('#visualEnhanceRecommendedBtn');if(!panel||!list)return;
  list.replaceChildren();
  const pdf=hasPdfUpload(),has=sourceVisualAssets.length||sourceDocumentVisualNotes.length||sourceScanReport||pdf;panel.classList.toggle('hide',!has);if(supp)supp.classList.toggle('hide',!pdf&&!sourceDocumentVisualNotes.length);if(applyAll)applyAll.classList.toggle('hide',!sourceVisualAssets.length);
  if(!has)return;
  const qualityTargets=sourceVisualAssets.filter(a=>a.quality&&a.quality.warnings&&a.quality.warnings.length&&!a.analysis_data);
  if(enhanceAll){enhanceAll.classList.toggle('hide',!qualityTargets.length);enhanceAll.onclick=async()=>{for(const asset of qualityTargets)await enhanceVisualForAnalysis(asset.id);showMessage('Čtecí kopie vylepšeny','Vylepšena byla jen kopie pro čtení AI u '+qualityTargets.length+' '+(qualityTargets.length===1?'podkladu':'podkladů')+'. Původní obrázky zůstaly beze změny.');};}
  if(applyAll)applyAll.onclick=()=>{let applied=0,skipped=0;for(const asset of sourceVisualAssets){if(!visualIntentReliable(asset)){skipped++;continue}asset.mode=visualRecommendedMode(asset);asset.modeTouched=true;applied++}renderSourceVisualPanel();showMessage('Doporučené režimy nastaveny',applied+' '+(applied===1?'podklad byl nastaven':'podklady byly nastaveny')+' podle rozpoznané role.'+(skipped?' U '+skipped+' nejistých '+(skipped===1?'podkladu':'podkladů')+' se nic automaticky nezměnilo — zvol režim ručně.':'')+' Úlohy v obrázku se převádějí; skutečné mapy, grafy, fotografie a schémata se zachovávají.');};
  if(badge)badge.textContent=sourceVisualAssets.length+' '+(sourceVisualAssets.length===1?'podklad':sourceVisualAssets.length<5?'podklady':'podkladů');
  const taskCount=sourceVisualAssets.filter(a=>a.intent==='task_image').length,contentCount=sourceVisualAssets.filter(a=>a.intent==='content_visual').length,hybridCount=sourceVisualAssets.filter(a=>a.intent==='hybrid').length,uncertainCount=sourceVisualAssets.filter(a=>!visualIntentReliable(a)).length;
  if(summary){
    const intents=[];if(taskCount)intents.push(taskCount+'× úloha v obrázku');if(contentCount)intents.push(contentCount+'× skutečný obrazový podklad');if(hybridCount)intents.push(hybridCount+'× kombinovaný podklad');if(uncertainCount)intents.push(uncertainCount+'× role není jistá');
    if(intents.length)summary.textContent='Rozpoznáno: '+intents.join(' · ')+'. '+(uncertainCount?'U nejistých podkladů zvol použití ručně; hromadné doporučení je nepřepíše.':'Doporučený režim je už předvolený.')+(sourceScanReport?' Čitelnost zdroje: '+scanStatusLabel(sourceScanReport.status)+(sourceScanReport.pages?' · '+sourceScanReport.pages+' stran':'')+'.':'');
    else if(sourceScanReport)summary.textContent='Čitelnost zdroje: '+scanStatusLabel(sourceScanReport.status)+(sourceScanReport.pages?' · '+sourceScanReport.pages+' stran':'')+'.';
    else summary.textContent=pdf?'PDF je připravené. Pokud potřebuješ přesně zachovat mapu, graf nebo schéma, přidej snímek příslušné stránky.':'Zkontroluj didaktickou roli obrazových podkladů.';
  }
  for(let index=0;index<sourceVisualAssets.length;index++){
    const asset=sourceVisualAssets[index],card=document.createElement('div');card.className='visual-source-card';card.dataset.visualId=asset.id;
    const prev=document.createElement('div');prev.className='visual-source-preview';const img=document.createElement('img');img.src=visualDataUrl(asset);img.alt=asset.description||asset.name||'Zdrojový obrazový podklad';prev.appendChild(img);
    const copy=document.createElement('div');copy.className='visual-source-copy';const title=document.createElement('strong');title.textContent=(sourceVisualAssets.length>1?'#'+(index+1)+' · ':'')+asset.id+' · '+visualIntentLabel(asset.intent);
    const meta=document.createElement('div');meta.className='visual-source-meta';const bits=[asset.description||asset.name||'Bez popisu',visualTypeLabel(asset.type),visualRoleLabel(asset.role)];if(asset.confidence)bits.push('jistota '+Math.round(asset.confidence*100)+' %');if(asset.width&&asset.height)bits.push(asset.width+' × '+asset.height+' px');if(asset.optimized)bits.push('technicky zmenšená kopie');if(asset.analysis_data)bits.push('AI čte vylepšenou kopii');if(asset.task_item_counts&&asset.task_item_counts.length)bits.push('struktura úloh: '+asset.task_item_counts.join(' + ')+' položek');if(asset.quality&&asset.quality.warnings&&asset.quality.warnings.length)bits.push('pozor: '+asset.quality.warnings.join(', '));meta.textContent=bits.join(' · ');
    const reliable=visualIntentReliable(asset),recommended=reliable?visualRecommendedMode(asset):'',rec=document.createElement('div');rec.className='visual-source-recommendation'+(reliable?'':' uncertain');rec.textContent=reliable?('Doporučeno: '+visualModeLabel(recommended)+(asset.intent==='hybrid'?' — pokud žák potřebuje skutečnou obrazovou část, vyřízni a zachovej jen ji.':'')):'Role obrazu není jistá. Je-li to screenshot hotové úlohy, zvol „Převést na novou diferencovanou úlohu“. Je-li to mapa, graf, fotografie nebo schéma, zvol „Použít jako původní obrazový podklad“.';
    const controls=document.createElement('div');controls.className='visual-source-controls';const lab=document.createElement('label');lab.textContent='Použití';const sel=document.createElement('select');sel.id='visualMode_'+asset.id;lab.htmlFor=sel.id;sel.dataset.visualMode=asset.id;[['reconstruct','Převést na novou diferencovanou úlohu'],['preserve','Použít jako původní obrazový podklad'],['reference','Použít jen jako referenci'],['ignore','Nepoužívat']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t+(recommended&&v===recommended?' · doporučeno':'');if(asset.mode===v)o.selected=true;sel.appendChild(o)});sel.addEventListener('change',()=>{asset.mode=normalizeVisualMode(sel.value);asset.modeTouched=true;renderSourceVisualPanel()});controls.append(lab,sel);const modeHelp=document.createElement('div');modeHelp.className='visual-mode-help';modeHelp.textContent=visualModeHelp(asset.mode);controls.appendChild(modeHelp);
    const left=document.createElement('button');left.type='button';left.className='btn ghost small';left.textContent='↺ Otočit';left.title='Otočí zdrojový obraz o 90° doleva. Operace je lokální.';left.addEventListener('click',()=>rotateVisualAsset(asset.id,-1));
    const right=document.createElement('button');right.type='button';right.className='btn ghost small';right.textContent='↻ Otočit';right.title='Otočí zdrojový obraz o 90° doprava. Operace je lokální.';right.addEventListener('click',()=>rotateVisualAsset(asset.id,1));
    const enhance=document.createElement('button');enhance.type='button';enhance.className='btn ghost small';enhance.textContent=asset.analysis_data?'Zrušit vylepšení AI':'Vylepšit čitelnost pro AI';enhance.title='Lokálně zvýší kontrast kopie, kterou čte AI. Původní soubor se nemění.';enhance.addEventListener('click',()=>enhanceVisualForAnalysis(asset.id));
    const crop=document.createElement('button');crop.type='button';crop.className='btn ghost small';crop.textContent='Vyříznout oblast';crop.title='Vytvoří lokální výřez skutečného obrazového podkladu bez dalšího AI dotazu.';crop.addEventListener('click',()=>openVisualCrop(asset.id));controls.append(left,right,enhance,crop);
    const order=document.createElement('div');order.className='visual-order-controls';if(sourceVisualAssets.length>1){const orderLabel=document.createElement('span');orderLabel.className='visual-order-label';orderLabel.textContent='Pořadí v materiálu:';const earlier=document.createElement('button');earlier.type='button';earlier.className='btn ghost small';earlier.textContent='↑ Posunout o místo výš';earlier.disabled=index===0;earlier.title='Přesune tento podklad o jednu pozici výš, pokud byl z originálu načten ve špatném pořadí.';earlier.addEventListener('click',()=>moveVisualAsset(asset.id,-1));const later=document.createElement('button');later.type='button';later.className='btn ghost small';later.textContent='↓ Posunout o místo níž';later.disabled=index===sourceVisualAssets.length-1;later.title='Přesune tento podklad o jednu pozici níž, pokud byl z originálu načten ve špatném pořadí.';later.addEventListener('click',()=>moveVisualAsset(asset.id,1));const orderNote=document.createElement('span');orderNote.className='visual-order-note';orderNote.textContent='Použij jen při špatném pořadí obrázků; obsah ani kvalitu tím neměníš.';order.append(orderLabel,earlier,later,orderNote)}
    copy.append(title,meta,rec,controls);if(sourceVisualAssets.length>1)copy.appendChild(order);card.append(prev,copy);list.appendChild(card);
  }
  const notes=[];
  if(sourceScanReport&&sourceScanReport.status!=='good')notes.push('AI označila čitelnost zdroje jako '+scanStatusLabel(sourceScanReport.status)+'. '+(sourceScanReport.issues&&sourceScanReport.issues!=='none'?'Problém: '+sourceScanReport.issues+'. ':'')+'Před generováním porovnej přepis se zdrojem; nečitelná čísla nebo značky neopravuj odhadem.');
  const qualityProblemAssets=sourceVisualAssets.filter(a=>a.quality&&a.quality.warnings&&a.quality.warnings.length);if(qualityProblemAssets.length){const detail=qualityProblemAssets.map((a,i)=>{const idx=sourceVisualAssets.indexOf(a)+1;return '#'+idx+' '+a.id+' ('+a.quality.warnings.join(', ')+')'+(a.analysis_data?' — čtecí kopie už je vylepšená':'')}).join('; ');notes.push('Čitelnost pro AI může být horší u: '+detail+'. Pokud text na snímku není úplně ostrý, použij u něj „Vylepšit čitelnost pro AI“ nebo tlačítko „Vylepšit hůře čitelné pro AI“. Mění se pouze čtecí kopie pro AI; originál zůstává beze změny.');}
  if(sourceVisualAssets.some(a=>a.intent==='task_image'&&a.mode==='preserve'))notes.push('Alespoň jedna úloha zachycená jako obrázek je ručně nastavená na zachování. Tím se do nové verze může vrátit původní nediferencovaná úloha; doporučeno je „Převést na novou diferencovanou úlohu“.');
  if(sourceVisualAssets.some(a=>a.intent==='hybrid'&&a.mode==='preserve'))notes.push('Alespoň jeden kombinovaný screenshot je nastavený na zachování celý. Bezpečnější je převést textovou úlohu a pomocí „Vyříznout oblast“ zachovat jen skutečnou mapu/graf/schéma/fotografii.');
  if(sourceVisualAssets.some(a=>a.confidence>0&&a.confidence<0.6))notes.push('U alespoň jednoho obrazu je nízká jistota didaktické klasifikace. Zkontroluj doporučený režim ručně.');
  if(sourceVisualAssets.some(a=>a.mode==='preserve'&&a.optimized))notes.push('Alespoň jeden zachovaný obraz je kvůli původní velikosti technicky zmenšený. U velmi jemných map nebo schémat zkontroluj čitelnost v náhledu PDF.');
  if(sourceDocumentVisualNotes.length){const pages=[...new Set(sourceDocumentVisualNotes.map(x=>x.page).filter(Boolean))].join(', ');notes.push('PDF obsahuje obrazově klíčový prvek'+(pages?' na straně '+pages:'')+'. Pro pixelově přesné zachování skutečné mapy, grafu nebo schématu použij „Přidat snímek / výřez k PDF“.');}
  if(warning){warning.textContent=notes.join(' ');warning.classList.toggle('hide',!notes.length)}
}
function drawCropCanvas(){
  if(!cropState||!cropState.ctx)return;const {ctx,canvas,img,rect}=cropState;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);if(rect&&rect.w>2&&rect.h>2){ctx.save();ctx.fillStyle='rgba(0,0,0,.42)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.clearRect(rect.x,rect.y,rect.w,rect.h);ctx.drawImage(img,rect.x*(img.naturalWidth/canvas.width),rect.y*(img.naturalHeight/canvas.height),rect.w*(img.naturalWidth/canvas.width),rect.h*(img.naturalHeight/canvas.height),rect.x,rect.y,rect.w,rect.h);ctx.strokeStyle='#4ea3ff';ctx.lineWidth=3;ctx.strokeRect(rect.x+1.5,rect.y+1.5,Math.max(0,rect.w-3),Math.max(0,rect.h-3));ctx.restore()}}
function cropCanvasPoint(ev){const c=cropState&&cropState.canvas,r=c&&c.getBoundingClientRect();if(!c||!r)return {x:0,y:0};return {x:Math.max(0,Math.min(c.width,(ev.clientX-r.left)*(c.width/r.width))),y:Math.max(0,Math.min(c.height,(ev.clientY-r.top)*(c.height/r.height)))}}
async function openVisualCrop(id){
  const asset=sourceVisualAssets.find(a=>a.id===id),url=visualDataUrl(asset);if(!asset||!url)return;
  const img=await loadImg(url),canvas=$('#visualCropCanvas'),ctx=canvas&&canvas.getContext('2d');if(!canvas||!ctx)return;
  const maxW=900,maxH=620,scale=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight);canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));cropState={asset,img,canvas,ctx,dragging:false,start:null,rect:{x:0,y:0,w:canvas.width,h:canvas.height}};drawCropCanvas();const hint=$('#visualCropHint');if(hint){hint.textContent='Je vybraný celý obrázek. Tažením můžeš označit jen potřebnou oblast.';hint.classList.add('has-selection')}$('#visualCropOverlay')?.classList.add('show');
}
function closeVisualCrop(){const ov=$('#visualCropOverlay');if(ov)ov.classList.remove('show');cropState=null}
function resetVisualCrop(){if(!cropState)return;cropState.rect={x:0,y:0,w:cropState.canvas.width,h:cropState.canvas.height};drawCropCanvas();const hint=$('#visualCropHint');if(hint){hint.textContent='Je vybraný celý obrázek.';hint.classList.add('has-selection')}}
async function applyVisualCrop(){
  if(!cropState||!cropState.rect)return;const {asset,img,canvas,rect}=cropState;if(rect.w<8||rect.h<8){showMessage('Výřez je příliš malý','Označ větší oblast mapy, grafu nebo schématu.');return}
  const sx=Math.round(rect.x*img.naturalWidth/canvas.width),sy=Math.round(rect.y*img.naturalHeight/canvas.height),sw=Math.max(1,Math.round(rect.w*img.naturalWidth/canvas.width)),sh=Math.max(1,Math.round(rect.h*img.naturalHeight/canvas.height));const out=document.createElement('canvas');out.width=sw;out.height=sh;out.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,sw,sh);const mime=asset.mime_type==='image/png'?'image/png':'image/jpeg',blob=await canvasToBlob(out,mime,mime==='image/jpeg'?0.94:undefined);if(!blob)return;
  asset.mode='reference';asset.modeTouched=true;const newAsset={id:nextVisualId(),name:'výřez-'+asset.name,mime_type:mime,data:await blobToBase64(blob),bytes:blob.size,role:'critical',type:asset.type||'other',intent:'content_visual',confidence:1,description:'Ručně vybraný klíčový výřez z '+(asset.description||asset.name),task_item_counts:[],explicit_examples:null,mode:'preserve',source:'crop',optimized:false,width:sw,height:sh,analysis_data:'',analysis_mime_type:'',analysis_mode:'',quality:null,modeTouched:true};sourceVisualAssets.push(newAsset);await analyzeVisualQuality(newAsset).catch(()=>{});closeVisualCrop();renderSourceVisualPanel();showMessage('Výřez je připravený','Původní celá stránka zůstala jen jako reference a nový výřez je nastavený na „Použít jako původní obrazový podklad“.');
}
function visualAssetMap(assets){return new Map((assets||[]).filter(Boolean).map(a=>[String(a.id||'').toUpperCase(),a]))}
function visualMarkerRegex(){return /\[\[(VISUAL_\d+)\]\]/gi}
function annotatedVisualSources(text){const out=new Set();if(typeof educationalMarkerInfo!=='function')return out;for(const line of String(text||'').split(/\r?\n/)){const m=educationalMarkerInfo(line);if(m&&!m.error&&m.kind==='annotate'){const id=String(m.spec&&m.spec.source||'').toUpperCase();if(/^VISUAL_\d+$/.test(id))out.add(id)}}return out}
function sanitizeVisualMarkers(text,assets){
  const allowed=visualAssetMap(assets),annotated=annotatedVisualSources(text),seen=new Set();
  let out=String(text||'').replace(visualMarkerRegex(),(m,id)=>{id=String(id).toUpperCase();if(!allowed.has(id)||annotated.has(id)||seen.has(id))return '';seen.add(id);return '\n\n[['+id+']]\n\n'});
  return out.replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function visualReferenceUsed(text,id){const src=String(text||''),re=new RegExp('\\[\\['+id+'\\]\\]','i');if(re.test(src))return true;if(typeof educationalMarkerInfo==='function')for(const line of src.split(/\r?\n/)){const m=educationalMarkerInfo(line);if(m&&!m.error&&m.kind==='annotate'&&String(m.spec&&m.spec.source||'').toUpperCase()===id)return true}return false}
function ensureVisualMarkers(text,assets){let out=sanitizeVisualMarkers(text,assets);const missing=[];for(const a of (assets||[])){const id=String(a.id||'').toUpperCase();if(id&&!visualReferenceUsed(out,id))missing.push('[['+id+']]')}out=(missing.length?missing.join('\n\n')+'\n\n':'')+out;return sanitizeVisualMarkers(out,assets)}
function appendRichSegment(parent,text,assets=[]){if(typeof appendEducationalRichText==='function'){appendEducationalRichText(parent,text,undefined,assets);return}if(typeof appendStemRichText==='function'){appendStemRichText(parent,text);return}const src=String(text||'');const re=/\*\*(.+?)\*\*/g;let last=0,m;while((m=re.exec(src))){if(m.index>last)parent.appendChild(document.createTextNode(src.slice(last,m.index)));const b=document.createElement('b');b.textContent=m[1];parent.appendChild(b);last=re.lastIndex}if(last<src.length)parent.appendChild(document.createTextNode(src.slice(last)))}
function makeVisualFigure(asset,printMode=false){const url=visualDataUrl(asset);if(!url)return null;const fig=document.createElement('figure');fig.className=printMode?'print-visual':'worksheet-visual';fig.dataset.visualId=String(asset.id||'');const img=document.createElement('img');img.src=url;img.alt=asset.description||visualTypeLabel(asset.type)||'Obrazový podklad';fig.appendChild(img);return fig}
function setRichTextWithVisuals(el,text,assets,media=null){if(!el)return;const map=visualAssetMap(assets),frag=document.createDocumentFragment(),src=String(text||''),re=/\[\[(VISUAL_\d+|MEDIA_SOURCE)\]\]/gi;let last=0,m;while((m=re.exec(src))){if(m.index>last)appendRichSegment(frag,src.slice(last,m.index),assets);const id=String(m[1]).toUpperCase();if(id==='MEDIA_SOURCE'){const node=mediaSourceNode(media,false);if(node)frag.appendChild(node);else appendRichSegment(frag,'[[MEDIA_SOURCE]]',assets)}else{const a=map.get(id),fig=makeVisualFigure(a,false);if(fig)frag.appendChild(fig)}last=re.lastIndex}if(last<src.length)appendRichSegment(frag,src.slice(last),assets);el.replaceChildren(frag)}
function visualFigureHtml(asset,printMode=true){const url=visualDataUrl(asset);if(!url)return '';const cls=printMode?'print-visual':'worksheet-visual';return '<figure class="'+cls+'" data-visual-id="'+esc(String(asset.id||''))+'"><img src="'+url+'" alt="'+esc(asset.description||visualTypeLabel(asset.type)||'Obrazový podklad')+'"></figure>'}
function renderTextWithVisuals(text,assets,printMode=true,media=null){const map=visualAssetMap(assets),src=String(text||''),re=/\[\[(VISUAL_\d+|MEDIA_SOURCE)\]\]/gi,rich=s=>typeof renderEducationalTextHtml==='function'?renderEducationalTextHtml(s,undefined,assets):render(s);let out='',last=0,m;while((m=re.exec(src))){out+=rich(src.slice(last,m.index));const id=String(m[1]).toUpperCase();if(id==='MEDIA_SOURCE')out+=mediaSourceHtml(media);else{const a=map.get(id);if(a)out+=visualFigureHtml(a,printMode)}last=re.lastIndex}out+=rich(src.slice(last));return out}
function setUploadInfo(msg){const el=$('#uploadInfo');if(msg){el.textContent=msg;el.classList.add('show');setStatus('statusInput','soubor připraven','ok')}else{el.textContent='';el.classList.remove('show');if(!$('#pasteText')||!$('#pasteText').value.trim())setStatus('statusInput','čeká na zadání','warn')}}
function htmlToPlainText(html){const doc=new DOMParser().parseFromString(String(html||''),'text/html');doc.querySelectorAll('script,style,noscript').forEach(el=>el.remove());return (doc.body?doc.body.innerText:doc.documentElement.textContent||'').replace(/\n{3,}/g,'\n\n').trim()}

async function readZipEntries(file,kind){
  if(file.size>MAX_OFFICE_SOURCE_BYTES)throw makeAppError(kind+' soubor je příliš velký ('+humanBytes(file.size)+'). Bezpečný limit je '+humanBytes(MAX_OFFICE_SOURCE_BYTES)+'.','FILE_TOO_LARGE');
  const buf=await fileToArrayBuffer(file), dv=new DataView(buf), bytes=new Uint8Array(buf);
  if(bytes.length<22)throw new Error('Soubor není platný '+kind+'.');
  let eocd=-1;
  const min=Math.max(0,bytes.length-22-65535);
  for(let i=bytes.length-22;i>=min;i--){if(i+22<=bytes.length&&dv.getUint32(i,true)===0x06054b50){eocd=i;break}}
  if(eocd<0)throw new Error('Soubor není platný '+kind+' (chybí ZIP konec).');
  const cdOffset=dv.getUint32(eocd+16,true), cdCount=dv.getUint16(eocd+10,true);
  if(cdCount>MAX_ZIP_ENTRIES)throw makeAppError(kind+' obsahuje příliš mnoho položek.','FILE_TOO_LARGE');
  if(cdOffset>=bytes.length)throw new Error('Soubor '+kind+' má poškozený centrální adresář.');
  let p=cdOffset,totalUncompressed=0;const entries=[];
  for(let i=0;i<cdCount;i++){
    if(p+46>bytes.length||dv.getUint32(p,true)!==0x02014b50)throw new Error('Soubor '+kind+' má neúplný centrální adresář.');
    const method=dv.getUint16(p+10,true),compSize=dv.getUint32(p+20,true),uncompSize=dv.getUint32(p+24,true),nameLen=dv.getUint16(p+28,true),extraLen=dv.getUint16(p+30,true),commentLen=dv.getUint16(p+32,true),lho=dv.getUint32(p+42,true);
    const next=p+46+nameLen+extraLen+commentLen;
    if(next>bytes.length||lho+30>bytes.length)throw new Error('Soubor '+kind+' obsahuje poškozenou položku.');
    if(uncompSize>MAX_ZIP_ENTRY_BYTES)throw makeAppError('Jedna část '+kind+' je po rozbalení příliš velká.','FILE_TOO_LARGE');
    totalUncompressed+=uncompSize;
    if(totalUncompressed>MAX_ZIP_TOTAL_UNCOMPRESSED_BYTES)throw makeAppError(kind+' je po rozbalení příliš velký.','FILE_TOO_LARGE');
    const name=new TextDecoder().decode(bytes.subarray(p+46,p+46+nameLen));
    entries.push({name,method,compSize,uncompSize,lho});p=next;
  }
  async function extract(entry){
    const lp=entry.lho;
    if(dv.getUint32(lp,true)!==0x04034b50)throw new Error('Soubor '+kind+' obsahuje poškozenou lokální položku.');
    const lNameLen=dv.getUint16(lp+26,true),lExtraLen=dv.getUint16(lp+28,true),dataStart=lp+30+lNameLen+lExtraLen,dataEnd=dataStart+entry.compSize;
    if(dataStart<0||dataEnd>bytes.length)throw new Error('Soubor '+kind+' obsahuje neúplná data.');
    const raw=bytes.subarray(dataStart,dataEnd);let out;
    if(entry.method===0)out=raw;
    else if(entry.method===8){
      if(typeof DecompressionStream==='undefined')throw new Error('Prohlížeč neumí rozbalit '+kind+' (chybí DecompressionStream). Zkus vložit text ručně.');
      const ds=new DecompressionStream('deflate-raw');out=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer());
    }else throw new Error('Nepodporovaná komprese v '+kind+'.');
    if(out.length>MAX_ZIP_ENTRY_BYTES||entry.uncompSize&&out.length!==entry.uncompSize)throw new Error('Rozbalená položka '+kind+' má neočekávanou velikost.');
    return out;
  }
  return {entries,extract};
}
function xmlUnescape(t){return String(t||'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'")}
function officeXmlText(xml){return [...String(xml||'').matchAll(/<(?:w:t|a:t)\b[^>]*>([\s\S]*?)<\/(?:w:t|a:t)>|<(?:w:tab|a:tab)\b[^>]*\/?>(?:<\/(?:w:tab|a:tab)>)?|<(?:w:br|w:cr|a:br)\b[^>]*\/?>(?:<\/(?:w:br|w:cr|a:br)>)?/g)].map(m=>m[1]!=null?xmlUnescape(m[1]):'\n').join('').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim()}
function officeBlockText(xml,blockRe){
  if(typeof officeDomBlockText==='function'){
    const enhanced=officeDomBlockText(xml);if(String(enhanced||'').trim())return enhanced;
  }
  const blocks=[...String(xml||'').matchAll(blockRe)].map(m=>officeXmlText(m[0])).map(t=>t.trim()).filter(Boolean);
  return blocks.length?blocks.join('\n'):officeXmlText(xml);
}
function officeImageMime(name){const n=String(name||'').toLowerCase();if(n.endsWith('.png'))return 'image/png';if(/\.jpe?g$/.test(n))return 'image/jpeg';if(n.endsWith('.webp'))return 'image/webp';if(n.endsWith('.gif'))return 'image/gif';if(n.endsWith('.svg'))return 'image/svg+xml';return ''}
function docxReferencedMediaPaths(documentXml,relsXml){
  const rels=new Map();
  for(const m of String(relsXml||'').matchAll(/<Relationship\b[^>]*>/gi)){
    const tag=m[0],id=(tag.match(/\bId=["']([^"']+)["']/i)||[])[1],target=(tag.match(/\bTarget=["']([^"']+)["']/i)||[])[1],type=(tag.match(/\bType=["']([^"']+)["']/i)||[])[1];
    if(id&&target&&/\/image$/i.test(type||''))rels.set(id,target);
  }
  const normalizeTarget=id=>{
    const target=rels.get(id);if(!target)return '';
    const normalized=('word/'+target.replace(/^\.\//,'')).replace(/\/\.\.\//g,'/');
    return /^word\/media\//i.test(normalized)?normalized:'';
  };
  const refs=[];let paragraphIndex=0;
  const paragraphRe=/<w:p\b[\s\S]*?<\/w:p>/gi;
  for(const paragraphMatch of String(documentXml||'').matchAll(paragraphRe)){
    const paragraph=paragraphMatch[0],local=[];let sourceOrder=0;
    const drawingRe=/<wp:(anchor|inline)\b[\s\S]*?<\/wp:\1>/gi;
    for(const drawingMatch of paragraph.matchAll(drawingRe)){
      const block=drawingMatch[0],kind=String(drawingMatch[1]||'').toLowerCase();
      const vTag=(block.match(/<wp:positionV\b([^>]*)>([\s\S]*?)<\/wp:positionV>/i)||[]),hTag=(block.match(/<wp:positionH\b([^>]*)>([\s\S]*?)<\/wp:positionH>/i)||[]);
      const vRef=((vTag[1]||'').match(/\brelativeFrom=["']([^"']+)["']/i)||[])[1]||'';
      const vRaw=((vTag[2]||'').match(/<wp:posOffset>\s*(-?\d+)\s*<\/wp:posOffset>/i)||[])[1];
      const hRaw=((hTag[2]||'').match(/<wp:posOffset>\s*(-?\d+)\s*<\/wp:posOffset>/i)||[])[1];
      const y=vRaw!==undefined?Number(vRaw):null,x=hRaw!==undefined?Number(hRaw):null;
      for(const blip of block.matchAll(/<a:blip\b[^>]*\br:embed=["']([^"']+)["'][^>]*>/gi)){
        const path=normalizeTarget(blip[1]);if(path)local.push({path,kind,vRef,y:Number.isFinite(y)?y:null,x:Number.isFinite(x)?x:null,sourceOrder:sourceOrder++});
      }
    }
    // Floating pictures anchored to one Word paragraph are often stored in insertion order,
    // not in their visible top-to-bottom order. If their vertical offsets share one coordinate
    // system, order them visually; otherwise preserve XML order. Inline/mixed content stays
    // untouched because its XML order is already semantically meaningful.
    const anchorsOnly=local.length>1&&local.every(r=>r.kind==='anchor'&&r.y!==null&&r.vRef&&r.vRef===local[0].vRef);
    if(anchorsOnly)local.sort((a,b)=>a.y-b.y||((a.x??Number.POSITIVE_INFINITY)-(b.x??Number.POSITIVE_INFINITY))||a.sourceOrder-b.sourceOrder);
    refs.push(...local.map(r=>({path:r.path,paragraphIndex,sourceOrder:r.sourceOrder})));
    paragraphIndex++;
  }
  // Fallback for unusual/minimal DOCX XML where drawings are not wrapped in the paragraph
  // pattern above. This keeps the previous safe document-order behavior.
  if(!refs.length){
    let sourceOrder=0;
    for(const m of String(documentXml||'').matchAll(/<a:blip\b[^>]*\br:embed=["']([^"']+)["'][^>]*>/gi)){
      const path=normalizeTarget(m[1]);if(path)refs.push({path,paragraphIndex:0,sourceOrder:sourceOrder++});
    }
  }
  const out=[],seen=new Set();
  for(const ref of refs)if(!seen.has(ref.path)){seen.add(ref.path);out.push(ref.path)}
  return out;
}
async function readDocxRich(file){
  const zip=await readZipEntries(file,'.docx');
  const wanted=zip.entries.filter(e=>/^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/i.test(e.name));
  wanted.sort((a,b)=>{const rank=n=>/document\.xml$/i.test(n)?0:/header/i.test(n)?1:/footer/i.test(n)?2:/footnotes/i.test(n)?3:4;return rank(a.name)-rank(b.name)||a.name.localeCompare(b.name)});
  if(!wanted.length)throw new Error('V .docx se nenašel čitelný obsah dokumentu.');
  const chunks=[];let documentXml='';
  for(const entry of wanted){const xml=new TextDecoder('utf-8').decode(await zip.extract(entry));if(/^word\/document\.xml$/i.test(entry.name))documentXml=xml;const text=officeBlockText(xml,/<w:p\b[\s\S]*?<\/w:p>/g);if(text.trim())chunks.push(text.trim())}
  let text=chunks.join('\n\n').trim();
  const nativeObjects=await (await loadOfficeRichModule()).readDocxNativeObjects(zip,officeRichDeps());if(nativeObjects.text)text+=(text?'\n\n':'')+nativeObjects.text;
  const relEntry=zip.entries.find(e=>/^word\/_rels\/document\.xml\.rels$/i.test(e.name));
  const relsXml=relEntry?new TextDecoder('utf-8').decode(await zip.extract(relEntry)):'';
  let paths=docxReferencedMediaPaths(documentXml,relsXml);
  if(!paths.length)paths=zip.entries.filter(e=>/^word\/media\//i.test(e.name)).map(e=>e.name);
  paths=[...new Set(paths)];
  const unsupportedImagePaths=paths.filter(name=>!officeImageMime(name));
  paths=paths.filter(name=>officeImageMime(name));
  if(paths.length>MAX_IMAGE_COUNT)throw makeAppError('DOCX obsahuje '+paths.length+' vložených obrázků. Tato verze bezpečně zpracuje maximálně '+MAX_IMAGE_COUNT+'. Ulož dokument jako PDF nebo rozděl materiál na menší části.','TOO_MANY_IMAGES');
  const items=[];
  for(const path of paths){
    const entry=zip.entries.find(e=>e.name===path);if(!entry)continue;
    const bytes=await zip.extract(entry),mime=officeImageMime(path);if(!mime)continue;
    const name=path.split('/').pop()||'obrazek';
    const imageFile=new File([bytes],name,{type:mime});
    items.push(await resizeImage(imageFile,paths.length>1,Math.max(1,paths.length)));
  }
  if(!text&&!items.length)throw new Error('V .docx se nenašel čitelný text ani podporované vložené obrázky.');
  return {text,items,imageCount:items.length,chartCount:nativeObjects.chartCount,diagramCount:nativeObjects.diagramCount,drawingCount:nativeObjects.drawingCount,unsupportedNativeCount:nativeObjects.unsupportedNativeCount,unsupportedImageCount:unsupportedImagePaths.length,unsupportedImageNames:unsupportedImagePaths.slice(0,8).map(x=>x.split('/').pop())};
}
let officeRichModulePromise=null;
function officeRichDeps(){return {readZipEntries,officeBlockText,officeImageMime,resizeImage,xmlUnescape,makeAppError,maxImageCount:MAX_IMAGE_COUNT}}
function loadOfficeRichModule(){return officeRichModulePromise||(officeRichModulePromise=import('./modules/office-rich.js'))}
async function readPptxRich(file){return (await loadOfficeRichModule()).readPptxRich(file,officeRichDeps())}
async function readXlsxRich(file){return (await loadOfficeRichModule()).readXlsxRich(file,officeRichDeps())}
let geoJsonModulePromise=null;
function loadGeoJsonModule(){return geoJsonModulePromise||(geoJsonModulePromise=import('./modules/geojson-engine.js').catch(error=>{geoJsonModulePromise=null;throw error}))}
async function prepareGeoJsonMap(file){
  if(file.size>24*1024*1024)throw makeAppError('GeoJSON je příliš velký pro bezpečné lokální zpracování. Maximum je 24 MB.','FILE_TOO_LARGE');
  const raw=await fileToText(file),g=await loadGeoJsonModule();let fc=null,json='',tol=.00005;
  for(let i=0;i<9;i++){fc=g.normalizeGeoJson(raw,{tolerance:tol,maxFeatures:1200,maxPoints:60000});json=JSON.stringify(fc);if(json.length<=155000)break;tol=tol?tol*2:.0001}
  if(!fc||json.length>170000)throw makeAppError('Mapová vrstva je i po bezpečném zjednodušení příliš detailní. Exportuj pouze potřebné kraje/okresy/oblasti nebo použij jednodušší GeoJSON.','FILE_TOO_LARGE');
  const names=g.geoJsonFeatureSummary(fc).map(x=>x.name).filter(Boolean);
  return {text:'PŘESNÁ MAPOVÁ VRSTVA ZE ZDROJOVÉHO SOUBORU '+file.name+' — geometrii nepřekresluj ani nevymýšlej. Pro úlohy zachovej tento marker:\n[[EDU_MAP|'+JSON.stringify({title:file.name.replace(/\.geojson$/i,''),geojson:fc})+']]\nPrvky vrstvy: '+names.slice(0,180).join(' | '),featureCount:fc.features.length,pointCount:fc.meta?.pointCount||0,tolerance:tol};
}
function readRtf(text){
  const cpMatch=String(text||'').match(/\\ansicpg(\d+)/i);
  const enc=cpMatch&&cpMatch[1]==='65001'?'utf-8':(cpMatch?'windows-'+cpMatch[1]:'windows-1250');
  const decodeByte=hex=>{const b=parseInt(hex,16);try{return new TextDecoder(enc).decode(new Uint8Array([b]))}catch(_){return String.fromCharCode(b)}};
  let t=String(text||'');
  t=t.replace(/\\u(-?\d+)\??/g,(_,n)=>String.fromCharCode((Number(n)+65536)%65536));
  t=t.replace(/\\'([0-9a-fA-F]{2})/g,(_,h)=>decodeByte(h));
  t=t.replace(/\\par[d]?/g,'\n').replace(/\\tab/g,'\t');
  t=t.replace(/\{\\\*?\\[^{}]*\}/g,'');
  t=t.replace(/\\[a-zA-Z]+-?\d*\s?/g,'');
  t=t.replace(/[{}]/g,'');
  return t.split('\n').map(l=>l.trim()).filter(Boolean).join('\n');
}

let uploaded=null;
const drop=$('#drop'),fileInput=$('#file');
drop.addEventListener('click',()=>fileInput.click());
drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput.click()}});
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>{if(e.dataTransfer.files&&e.dataTransfer.files.length)handleFiles(e.dataTransfer.files)});
fileInput.addEventListener('change',e=>{if(e.target.files&&e.target.files.length)handleFiles(e.target.files)});
const visualCropCanvas=$('#visualCropCanvas');
if(visualCropCanvas){
  visualCropCanvas.addEventListener('pointerdown',ev=>{if(!cropState)return;const p=cropCanvasPoint(ev);cropState.dragging=true;cropState.start=p;cropState.rect={x:p.x,y:p.y,w:0,h:0};try{visualCropCanvas.setPointerCapture(ev.pointerId)}catch(_){}drawCropCanvas()});
  visualCropCanvas.addEventListener('pointermove',ev=>{if(!cropState||!cropState.dragging)return;const p=cropCanvasPoint(ev),x=Math.min(cropState.start.x,p.x),y=Math.min(cropState.start.y,p.y);cropState.rect={x,y,w:Math.abs(p.x-cropState.start.x),h:Math.abs(p.y-cropState.start.y)};drawCropCanvas();const hint=$('#visualCropHint');if(hint){hint.textContent='Vybraná oblast: '+Math.round(cropState.rect.w)+' × '+Math.round(cropState.rect.h)+' px v náhledu.';hint.classList.add('has-selection')}});
  const stop=ev=>{if(!cropState)return;cropState.dragging=false;try{visualCropCanvas.releasePointerCapture(ev.pointerId)}catch(_){}};visualCropCanvas.addEventListener('pointerup',stop);visualCropCanvas.addEventListener('pointercancel',stop);
}
$('#visualCropCancel')?.addEventListener('click',closeVisualCrop);$('#visualCropReset')?.addEventListener('click',resetVisualCrop);$('#visualCropApply')?.addEventListener('click',applyVisualCrop);$('#visualCropOverlay')?.addEventListener('click',e=>{if(e.target.id==='visualCropOverlay')closeVisualCrop()});
const visualSupplementFile=$('#visualSupplementFile'),visualSupplementBtn=$('#visualSupplementBtn');
if(visualSupplementBtn&&visualSupplementFile){visualSupplementBtn.addEventListener('click',()=>visualSupplementFile.click());visualSupplementFile.addEventListener('change',async e=>{try{await appendSupplementalVisualFiles(e.target.files||[])}catch(err){showMessage('Podklad se nepodařilo přidat',friendlyApiMessage(err))}finally{visualSupplementFile.value=''}})}

async function handleFiles(fileList){
  const previous={uploaded,filename:$('#filename').textContent,info:$('#uploadInfo').textContent,chip:$('#filechip').classList.contains('show'),thumb:$('#thumb').classList.contains('show'),thumbSrc:$('#thumbImg').src,visualAssets:sourceVisualAssets.map(cloneSourceVisualAsset),visualNotes:sourceDocumentVisualNotes.map(x=>({...x})),scanReport:sourceScanReport?{...sourceScanReport}:null,structureReport:sourceStructureReport?{...sourceStructureReport,itemCounts:[...(sourceStructureReport.itemCounts||[])]}:null,visualSeq:visualAssetSeq,mediaSource:cloneMediaSource(sourceMediaAsset,true)};
  clearErr($('#inputErr'));setUploadInfo('');$('#thumb').classList.remove('show');
  const files=[...fileList];
  if(!files.length)return;
  try{
    if(files.length>1){
      const images=files.filter(f=>(f.type||'').startsWith('image/')),pdfs=files.filter(f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name||'')),other=files.filter(f=>!images.includes(f)&&!pdfs.includes(f));
      if(other.length||pdfs.length>1||(!pdfs.length&&images.length!==files.length))throw makeAppError('Více souborů najednou lze použít jako sadu fotografií, nebo jako jedno PDF doplněné obrázky/výřezy. Office a textové soubory nahraj po jednom.','TOO_MANY_IMAGES');
      if(images.length>MAX_IMAGE_COUNT)throw makeAppError('Najednou lze použít maximálně '+MAX_IMAGE_COUNT+' obrázků. U větší sady je rozděl na více částí.','TOO_MANY_IMAGES');
      const totalSource=files.reduce((sum,f)=>sum+f.size,0);if(totalSource>MAX_IMAGE_SOURCE_TOTAL_BYTES+MAX_PDF_BYTES)throw makeAppError('Vybrané soubory jsou dohromady příliš velké pro bezpečné zpracování.','FILE_TOO_LARGE');
      const imageItems=[];for(const f of images)imageItems.push(await resizeImage(f,true,Math.max(1,images.length)));
      const items=[];
      if(pdfs.length){const pdf=pdfs[0];if(pdf.size>MAX_PDF_BYTES)throw makeAppError('PDF je příliš velké pro přímé odeslání ('+humanBytes(pdf.size)+'). Bezpečný limit je '+humanBytes(MAX_PDF_BYTES)+'.','FILE_TOO_LARGE');items.push({mime_type:'application/pdf',data:await fileToBase64(pdf),name:pdf.name,bytes:pdf.size,originalBytes:pdf.size,compressed:false})}
      items.push(...imageItems);if(mediaBytes(items)>MAX_INLINE_REQUEST_BYTES)throw makeAppError('Média jsou i po zmenšení pro přímé API volání příliš velká ('+humanBytes(mediaBytes(items))+'). Uber počet fotek, zmenši PDF nebo materiál rozděl.','REQUEST_TOO_LARGE');
      uploaded={kind:'media',items};resetSourceMedia();setSourceVisualAssetsFromItems(imageItems,pdfs.length?'pdf-supplement':'multi-image');
      if(imageItems.length){$('#thumbImg').src='data:'+imageItems[0].mime_type+';base64,'+imageItems[0].data;$('#thumb').classList.add('show')}
      $('#filename').textContent=pdfs.length?'📑 '+pdfs[0].name+' + '+images.length+' obrázků':'🖼️ '+images.length+' obrázků';
      const saved=images.reduce((sum,f)=>sum+f.size,0)-imageItems.reduce((sum,it)=>sum+it.bytes,0);
      setUploadInfo(pdfs.length?'PDF se odešle přímo a přiložené obrázky slouží jako samostatné stránky nebo přesné vizuální podklady. Obrázky byly bezpečně optimalizovány; úspora přibližně '+humanBytes(Math.max(0,saved))+'.':'Obrázky byly automaticky zmenšeny pro bezpečné odeslání do API. Úspora přibližně '+humanBytes(Math.max(0,saved))+'.');
    } else {
      await handleSingleFile(files[0]);
    }
    $('#filechip').classList.add('show');
    $('#pasteText').value='';
  }catch(err){
    uploaded=previous.uploaded;sourceMediaAsset=cloneMediaSource(previous.mediaSource,true);sourceVisualAssets=previous.visualAssets.map(cloneSourceVisualAsset).filter(Boolean);sourceDocumentVisualNotes=previous.visualNotes.map(x=>({...x}));sourceScanReport=previous.scanReport?{...previous.scanReport}:null;sourceStructureReport=previous.structureReport?{...previous.structureReport,itemCounts:[...(previous.structureReport.itemCounts||[])]}:null;visualAssetSeq=previous.visualSeq;renderSourceVisualPanel();if(typeof fileInput!=='undefined'&&fileInput)fileInput.value='';$('#filename').textContent=previous.filename;$('#filechip').classList.toggle('show',previous.chip);$('#thumb').classList.toggle('show',previous.thumb);if(previous.thumbSrc)$('#thumbImg').src=previous.thumbSrc;if(previous.info)setUploadInfo(previous.info);else if(previous.uploaded)setUploadInfo('Původní soubor zůstal vybraný.');
    errBox($('#inputErr'),friendlyApiMessage(err)||err.message)
  }
}
async function handleSingleFile(file){
  const name=(file.name||'').toLowerCase();
  const isPdf=file.type==='application/pdf'||name.endsWith('.pdf');
  const isImg=(file.type||'').startsWith('image/');
  const isDocx=name.endsWith('.docx')||file.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isPptx=name.endsWith('.pptx')||file.type==='application/vnd.openxmlformats-officedocument.presentationml.presentation';
  const isXlsx=name.endsWith('.xlsx')||file.type==='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const isOldOffice=/\.(doc|ppt|xls)$/.test(name)&&!isDocx&&!isPptx&&!isXlsx;
  const isGeoJson=name.endsWith('.geojson')||file.type==='application/geo+json';
  const isTxt=name.endsWith('.txt')||name.endsWith('.md')||name.endsWith('.csv')||name.endsWith('.tsv')||name.endsWith('.json')||file.type==='text/plain'||/^text\/(csv|markdown)/.test(file.type||'');
  const isHtml=name.endsWith('.html')||name.endsWith('.htm')||file.type==='text/html';
  const isRtf=name.endsWith('.rtf');
  const mediaModule=await loadMultimediaModule();
  const mediaMeta=mediaModule.detectMultimediaFile(file);
  if(mediaMeta){
    const item=await mediaModule.prepareMultimediaFile(file,{maxBytes:MAX_MULTIMEDIA_SOURCE_BYTES,maxInlineBytes:MAX_INLINE_REQUEST_BYTES,makeAppError,humanBytes,fileToBase64});
    sourceMediaAsset=cloneMediaSource(item,true);uploaded={kind:'media',items:[item],mediaKind:item.kind};resetSourceVisualAssets();
    $('#filename').textContent=(item.kind==='audio'?'🎧 ':'🎬 ')+file.name;
    setUploadInfo((item.kind==='audio'?'Audio':'Video')+' se odešle přímo modelu jako zdrojový podklad. Při tvorbě poslechové/pozorovací úlohy se transkript nebo popis odpovědí nesmí objevit v žákovské části; zdroj zůstává pevný i pro paralelní varianty. V PDF bude uveden název přiloženého souboru.');
  } else if(isImg){
    const item=await resizeImage(file,false,1);
    uploaded={kind:'media',items:[item]};resetSourceMedia();setSourceVisualAssetsFromItems([item],'image');
    $('#thumbImg').src='data:'+item.mime_type+';base64,'+item.data;$('#thumb').classList.add('show');
    $('#filename').textContent='🖼️ '+file.name;
    setUploadInfo((item.compressed?'Obrázek byl automaticky zmenšen z '+humanBytes(item.originalBytes)+' na '+humanBytes(item.bytes)+' kvůli bezpečnému API limitu.':'Obrázek se odešle v původní kvalitě.')+' Před načtením můžeš v panelu obrazových podkladů upravit pořadí, otočení, čtecí kontrast nebo výřez.');
  } else if(isPdf){
    if(file.size>MAX_PDF_BYTES)throw makeAppError('PDF je příliš velké pro přímé odeslání ('+humanBytes(file.size)+'). Bezpečný limit pro PDF je '+humanBytes(MAX_PDF_BYTES)+'. Zkus PDF zmenšit, rozdělit nebo vložit text.','FILE_TOO_LARGE');
    const data=await fileToBase64(file);
    uploaded={kind:'media',items:[{mime_type:'application/pdf',data,name:file.name,bytes:file.size,originalBytes:file.size,compressed:false}]};resetSourceMedia();resetSourceVisualAssets();
    $('#filename').textContent='📑 '+file.name;
    setUploadInfo('PDF se odešle přímo a model vizuálně projde i stránky bez textové vrstvy. Pokud obsahuje mapu, graf nebo schéma, které chceš přesně zachovat v novém listu, po načtení přidej snímek příslušné stránky nebo výřez.');
  } else if(isDocx){
    const rich=await readDocxRich(file);if(rich.text)assertTextLength(rich.text,'Text z .docx');
    if(rich.items.length&&mediaBytes(rich.items)>MAX_INLINE_REQUEST_BYTES)throw makeAppError('Vložené obrázky v DOCX jsou po převodu příliš velké. Ulož dokument jako PDF nebo obrázky zmenši.','REQUEST_TOO_LARGE');
    uploaded=rich.items.length?{kind:'mixed',text:rich.text,items:rich.items}:{kind:'text',text:rich.text};resetSourceMedia();if(rich.items.length)setSourceVisualAssetsFromItems(rich.items,'docx');else resetSourceVisualAssets();$('#filename').textContent='📝 '+file.name;
    const docxNote=(rich.items.length?'DOCX byl načten včetně '+rich.items.length+' podporovaných vložených obrázků. Textová vrstva má '+String(rich.text||'').trim().split(/\s+/).filter(Boolean).length+' slov. Word Equation zlomky, exponenty, indexy a běžné odmocniny se převádějí do zachovatelného textového zápisu. Při načtení zadání se modelu pošle text i obrázky, takže cvičení vložená jako screenshoty nezmizí.':officeExtractNote('DOCX',rich.text))+(rich.chartCount?' Nativní grafy: '+rich.chartCount+'; datová cache byla převedena na renderovatelný EDU_CHART tam, kde ji lze bezpečně rekonstruovat.':'')+(rich.drawingCount?' Nativní DrawingML tvary: '+rich.drawingCount+'; geometrie a text byly převedeny na EDU_OFFICE.':'')+(rich.diagramCount?' Nativní diagramy/SmartArt: '+rich.diagramCount+'; jejich textová vrstva byla přidána do přepisu.':'')+(rich.unsupportedNativeCount?' Některé nativní objekty vyžadují vizuální kontrolu: '+rich.unsupportedNativeCount+'; pokud je vzhled podstatný, použij PDF/snímek.':'')+(rich.unsupportedImageCount?' Upozornění: '+rich.unsupportedImageCount+' obrazový prvek je ve formátu, který prohlížeč neumí bezpečně zachovat ('+rich.unsupportedImageNames.join(', ')+'). Pro tento prvek použij PDF nebo obrázek.':'');setUploadInfo(docxNote);
  } else if(isPptx){
    const rich=await readPptxRich(file);if(rich.text)assertTextLength(rich.text,'Text z .pptx');
    if(rich.items.length&&mediaBytes(rich.items)>MAX_INLINE_REQUEST_BYTES)throw makeAppError('Vložené obrázky v PPTX jsou po převodu příliš velké. Ulož prezentaci jako PDF nebo obrázky zmenši.','REQUEST_TOO_LARGE');
    uploaded=rich.items.length?{kind:'mixed',text:rich.text,items:rich.items}:{kind:'text',text:rich.text};resetSourceMedia();if(rich.items.length)setSourceVisualAssetsFromItems(rich.items,'pptx');else resetSourceVisualAssets();$('#filename').textContent='🖼️ '+file.name;
    setUploadInfo(officeExtractNote('PPTX',rich.text)+(rich.items.length?' Vložené obrázky: '+rich.items.length+'; po načtení je zkontroluj v panelu Obrazové podklady.':'')+(rich.chartCount?' Nativní grafy: '+rich.chartCount+'; čitelné datové cache byly převedeny na renderovatelný EDU_CHART.':'')+(rich.drawingCount?' DrawingML tvary/spojnice: '+rich.drawingCount+'; geometrie a text byly převedeny na deterministický EDU_OFFICE.':'')+(rich.diagramCount?' SmartArt/diagramy: '+rich.diagramCount+'; textová vrstva byla zachována.':'')+(rich.unsupportedNativeCount?' Nativní rámce vyžadující vizuální kontrolu: '+rich.unsupportedNativeCount+'. Pokud je přesný vzhled součástí úlohy, použij PDF nebo snímek; aplikace je nesmí tiše nahradit.':'')+(rich.unsupportedImageCount?' Nepodporované obrazové prvky: '+rich.unsupportedImageCount+' ('+rich.unsupportedImageNames.join(', ')+'). Pro ně použij PDF nebo samostatný obrázek.':''));
  } else if(isXlsx){
    const rich=await readXlsxRich(file);if(rich.text)assertTextLength(rich.text,'Text z .xlsx');
    if(rich.items.length&&mediaBytes(rich.items)>MAX_INLINE_REQUEST_BYTES)throw makeAppError('Vložené obrázky v XLSX jsou po převodu příliš velké. Ulož sešit jako PDF nebo obrázky zmenši.','REQUEST_TOO_LARGE');
    uploaded=rich.items.length?{kind:'mixed',text:rich.text,items:rich.items}:{kind:'text',text:rich.text};resetSourceMedia();if(rich.items.length)setSourceVisualAssetsFromItems(rich.items,'xlsx');else resetSourceVisualAssets();$('#filename').textContent='📊 '+file.name;
    setUploadInfo(officeExtractNote('XLSX',rich.text)+(rich.items.length?' Vložené obrázky: '+rich.items.length+'; po načtení je zkontroluj v panelu Obrazové podklady.':'')+(rich.chartCount?' Nativní grafy: '+rich.chartCount+'. Jejich datové oblasti a uložené hodnoty byly přidány do přepisu pro AI; pro pixelově shodný vzhled grafu použij PDF nebo snímek grafu.':'')+(rich.drawingCount?' Nativní DrawingML tvary: '+rich.drawingCount+'; geometrie a text byly převedeny na EDU_OFFICE.':'')+(rich.unsupportedNativeCount?' Nativní objekty vyžadující vizuální kontrolu: '+rich.unsupportedNativeCount+'.':'')+(rich.unsupportedImageCount?' Nepodporované obrazové prvky: '+rich.unsupportedImageCount+' ('+rich.unsupportedImageNames.join(', ')+').':''));
  } else if(isGeoJson){
    const map=await prepareGeoJsonMap(file);assertTextLength(map.text,'Mapová vrstva');uploaded={kind:'text',text:map.text};resetSourceMedia();resetSourceVisualAssets();$('#filename').textContent='🗺️ '+file.name;setUploadInfo('GeoJSON byl lokálně validován a zjednodušen se zachováním identifikátorů a pořadí výukových oblastí: '+map.featureCount+' prvků, '+map.pointCount+' bodů. Při generování zůstává geometrie zdrojovým datem a AI smí měnit jen otázky/popisky, ne hranice.');
  } else if(isTxt){
    const text=await fileToText(file);assertTextLength(text,'Text ze souboru');uploaded={kind:'text',text};resetSourceMedia();resetSourceVisualAssets();$('#filename').textContent='📝 '+file.name;setUploadInfo('Textový soubor byl načten lokálně. Před pokračováním zkontroluj jeho obsah.');
  } else if(isHtml){
    const text=htmlToPlainText(await fileToText(file));assertTextLength(text,'Text z HTML');uploaded={kind:'text',text};resetSourceMedia();resetSourceVisualAssets();$('#filename').textContent='🌐 '+file.name;setUploadInfo('HTML byl převeden lokálně na čistý text. Zkontroluj tabulky a pořadí prvků.');
  } else if(isRtf){
    const text=readRtf(await fileToText(file));assertTextLength(text,'Text z .rtf');uploaded={kind:'text',text};resetSourceMedia();resetSourceVisualAssets();$('#filename').textContent='📝 '+file.name;setUploadInfo('RTF byl převeden lokálně na čistý text. Zkontroluj formátování a speciální znaky.');
  } else if(isOldOffice){
    throw makeAppError('Starý binární formát '+name.split('.').pop().toUpperCase()+' appka přímo nepřečte. Otevři ho v Office/Google aplikaci a ulož jako .docx/.pptx/.xlsx, nebo vlož text ručně.','FILE_TOO_LARGE');
  } else {
    throw makeAppError('Nepodporovaný formát. Appka umí: fotky/obrázky, audio/video, PDF, .docx, .pptx, .xlsx, .txt, .rtf, .md, .csv, .tsv, .html, .json a .geojson.','FILE_TOO_LARGE');
  }
}
$('#filex').addEventListener('click',()=>{uploaded=null;resetSourceMedia();resetSourceVisualAssets();fileInput.value='';$('#filechip').classList.remove('show');$('#thumb').classList.remove('show');setUploadInfo('');setStatus('statusInput',$('#pasteText').value.trim()?'vložený text':'čeká na zadání',$('#pasteText').value.trim()?'ok':'warn')});

$('#extractBtn').addEventListener('click',async()=>{
  clearErr($('#inputErr'));
  const pasted=$('#pasteText').value.trim();
  try{assertTextLength(pasted,'Vložené zadání')}catch(err){errBox($('#inputErr'),friendlyApiMessage(err));return}
  if(!uploaded&&!pasted){errBox($('#inputErr'),'Nahraj soubor nebo vlož text zadání.');return}
  if(uploaded&&pasted){errBox($('#inputErr'),'Je vybraný soubor i vložený text. Jeden vstup odeber, aby bylo jasné, ze kterého zadání se má vycházet.');return}
  if(!uploaded&&pasted){
    $('#baseText').value=pasted;
    syncScoringModeFromSource(true);
    if($('#cefr')&&$('#cefr').checked&&subjectAllowsCefr()){
      applyCefrLevels(null);
      setCefrNote('Ručně vložený čistý text byl načten bez AI přepisu. CEFR odhad se kvůli úspoře dotazu nespouští automaticky; použij tlačítko „Odhadnout CEFR úroveň“.','warn');updateCefrRunButton();
    } else {
      if($('#cefr')&&$('#cefr').checked&&!subjectAllowsCefr()){$('#cefr').checked=false;saveCefrPreference(false);applyCefrLevels(null)}
      syncCefrHintFromSubject();
    }
    setStatus('statusFlow','zadání načteno lokálně','ok');
    hide($('#inputPanel'));show($('#configPanel'));
    safeScrollIntoView($('#configPanel'),{behavior:'smooth',block:'start'});
    return;
  }
  if(!requireApiKeyForAction('načtení souboru')){errBox($('#inputErr'),'Bez API klíče se soubor nezačne zpracovávat. Vlož klíč v kroku 1 pod tlačítkem „Nastavit / změnit API klíč“ a zvol „Použít jen pro relaci“.');return}
  const btn=$('#extractBtn'),extractLabel=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="mini"></span> Načítám zadání…';setStatus('statusFlow','načítám zadání','busy');
  const extractionCore="Toto je zadání školního testu, pracovního listu nebo učebního materiálu libovolného předmětu. Vstup může být digitální dokument, fotografie, sken, PDF bez textové vrstvy, zvuková nahrávka nebo video. Vizuálně projdi KAŽDOU stránku a všechny přiložené snímky v daném pořadí; nespoléhej jen na textovou vrstvu PDF. Přepiš jeho obsah do čistého, čitelného textu. Zachovej přesně původní jazyk nebo kombinaci jazyků u každé části; nic nepřekládej jen proto, že aplikace má české UI. Zachovej odbornou terminologii, matematický/chemický/fyzikální zápis, jednotky, značky, symboly, tabulkové údaje, číslování a také veškeré původní bodování: body za úlohy, celkové součty, váhy a případné bodové hranice. STEM přepis musí být znak po znaku věrný v číslech, desetinných čárkách/tečkách, znaménkách, indexech, exponentech, závorkách, zlomcích, odmocninách, chemických koeficientech a nábojích; nesmíš opravovat domnělou věcnou chybu tím, že změníš data zadání. Běžné matematické objekty můžeš zapsat čitelně pomocí standardních symbolů nebo podporovaného zápisu \\frac{a}{b}, \\sqrt{x}, x^{2}, a_{1}; chemické vzorce zapisuj např. H2SO4 a koeficienty odděluj mezerou (2 H2O), aby aplikace rozlišila index od koeficientu. U českých pasáží oprav jen zjevné OCR překlepy, ale výsledná čeština musí být gramaticky, stylisticky i lexikálně bezchybná. Na první řádek dej téma/nadpis, pak očíslované úlohy s plným zněním. Obsah zachovej věrně, nic nepřidávej a nevymýšlej nové úlohy. Pokud část kvůli rozmazání, stínu, ořezu, nízkému rozlišení nebo nesrozumitelnému zvuku skutečně nejde bezpečně přečíst či poslechnout, NEHÁDEJ čísla, značky ani slova; napiš [NEČITELNÉ], [ČÁSTEČNĚ NEČITELNÉ] nebo [NESROZUMITELNÉ]. Pokud jde o více fotek, zpracuj je v pořadí nahrání jako pokračování jednoho materiálu. Pokud úloha závisí na mapě, grafu, schématu, geometrickém nákresu, biologickém obrázku nebo jiném vizuálním podkladu, v textovém přepisu jasně zachovej instrukci, co s ním má žák dělat; samotný obraz ale nenahrazuj vymyšleným slovním popisem.";
  const hasPdf=!!(uploaded&&Array.isArray(uploaded.items)&&uploaded.items.some(it=>it&&it.mime_type==='application/pdf'));
  const mediaExtraction=sourceMediaAsset?('MULTIMEDIÁLNÍ VSTUP: '+(sourceMediaAsset.kind==='audio'?'poslechni celý zvukový soubor':'prohlédni a poslechni celý video soubor')+' v časovém pořadí. Přepiš mluvený obsah věrně pro interní učitelský pracovní základ; u videa stručně zachyť také vizuální dění, které je nutné pro řešení úloh. Nevymýšlej neslyšené repliky ani neviděné dění. Tento přepis je pouze zdroj pro následnou tvorbu — žákovská verze poslechové/pozorovací úlohy jej nesmí automaticky prozradit.') : visualManifestPrompt(sourceVisualAssets.length,hasPdf);
  const prompt=extractionCore+'\n\n'+mediaExtraction;
  let parts;
  try{
    if(uploaded&&uploaded.kind==='media'){
      parts=[{text:sourceMediaAsset?('Zpracuj následující '+(sourceMediaAsset.kind==='audio'?'audio':'video')+' jako pevný zdrojový podklad. Zachovej časovou posloupnost a nic nedoplňuj z domněnek.'):'Zpracuj následující mediální vstup nebo vstupy. PDF projdi stránku po stránce; samostatné obrázky VISUAL_n zpracuj v pořadí, v jakém jsou zde přiloženy. Pokud je přiloženo PDF i obrázky, obrázky mohou být přesné snímky/výřezy obrazových prvků z PDF.'},...extractionMediaParts(uploaded),{text:prompt}];
    } else if(uploaded&&uploaded.kind==='mixed'){
      parts=[{text:'Tento Office dokument obsahuje textovou vrstvu i vložené obrázky. Všechny části patří do jednoho materiálu. Přepiš obsah z textu i ze všech obrázků; nic nevynechávej a nedoplňuj úlohy, které ve zdroji nejsou. Každý vložený obrázek je označen VISUAL_n a stejný identifikátor použij v technickém manifestu.\n\nTEXTOVÁ VRSTVA DOKUMENTU:\n'+uploaded.text},...extractionMediaParts(uploaded),{text:prompt}];
    } else if(uploaded&&uploaded.kind==='text'){
      parts=[{text:prompt+"\n\nZADÁNÍ:\n"+uploaded.text}];
    } else {
      parts=[{text:prompt+"\n\nZADÁNÍ:\n"+pasted}];
    }
    const out=await callGemini(parts,{operation:'material-extraction'});
    const visualSplit=splitVisualManifest(String(out||pasted||(uploaded&&uploaded.text)||''));
    const extracted=String(visualSplit.text||pasted||(uploaded&&uploaded.text)||'').trim();
    if(!extracted)throw makeAppError('Ze vstupu se nepodařilo získat žádný čitelný text.','EMPTY_EXTRACT');
    applyVisualManifest(visualSplit.entries,visualSplit.documentEntries,visualSplit.scanReports,visualSplit.sourceStructures);
    $('#baseText').value=extracted;
    syncScoringModeFromSource(true);
    if($('#cefr').checked && subjectAllowsCefr()){
      await detectCefrForBase(extracted||pasted||'');
    } else {
      if($('#cefr').checked && !subjectAllowsCefr()){$('#cefr').checked=false;saveCefrPreference(false);applyCefrLevels(null)}
      syncCefrHintFromSubject();
      if(!looksLikeLanguageSubject(getSubjectValue()))setCefrNote('CEFR je vypnutý. U tohoto materiálu se použijí jen úrovně obtížnosti.');
    }
    hide($('#inputPanel'));show($('#configPanel'));
    safeScrollIntoView($('#configPanel'),{behavior:'smooth',block:'start'});
  }catch(err){setStatus('statusFlow','chyba načtení','warn');errBox($('#inputErr'),friendlyApiMessage(err))}
  finally{btn.disabled=false;btn.innerHTML=extractLabel}
});

syncTierCards();

function schoolLogoSrc(){const el=$('#schoolLogo');return el&&el.src?el.src:''}
function printHead(){
  const src=schoolLogoSrc();
  const logo=src?'<img class="pa-logo" src="'+src+'" alt="Logo školy" />':'';
  return '<div class="pa-head">'+logo+'<div class="pa-school">Gymnázium, Ostrava-Hrabůvka<small>pracovní list / test</small></div></div>';
}
function metaLine(isKey){
  const parts=[];
  const s=$('#mSubject').value.trim()||$('#subject').value.trim();
  const tp=$('#mTopic').value.trim();
  const c=$('#mClass').value.trim(), d=$('#mDate').value.trim();
  if(s)parts.push('<span><b>Předmět:</b> '+esc(s)+'</span>');
  if(tp)parts.push('<span><b>Téma:</b> '+esc(tp)+'</span>');
  if(c)parts.push('<span><b>Třída:</b> '+esc(c)+'</span>');
  if(d)parts.push('<span><b>Datum:</b> '+esc(d)+'</span>');
  if(!isKey)parts.push('<span><b>Jméno:</b> ……………………</span>');
  return '<div class="pa-meta">'+parts.join('')+'</div>';
}
function isMainTaskStartLine(line){
  const clean=String(line||'').trim().replace(/^\*{1,2}/,'').replace(/\*{1,2}$/,'').trim();
  return /^(?:(?:cvičení|úloha|exercise|task|part)\s*\d{1,2}[.):]?\s+\S|\d{1,2}[.):]\s+\S)/i.test(clean);
}
function isScoredMainTaskStartLine(line){
  const raw=String(line||'').trim(),bold=/^\*\*[^\n]+\*\*$/.test(raw),clean=raw.replace(/^\*{1,2}/,'').replace(/\*{1,2}$/,'').trim();
  if(/^(?:cvičení|úloha|exercise|task|part)\s*\d{1,2}[.):]?\s+\S/i.test(clean))return true;
  return bold&&/^\d{1,2}[.):]\s+\S/.test(clean);
}
function splitScoringBlocks(text){
  const lines=String(text||'').split(/\r?\n/),blocks=[];let cur=[];
  for(const ln of lines){if(isScoredMainTaskStartLine(ln)&&cur.length){blocks.push({text:cur.join('\n'),isTask:isScoredMainTaskStartLine(cur.find(x=>String(x).trim())||'')});cur=[ln]}else cur.push(ln)}
  if(cur.length)blocks.push({text:cur.join('\n'),isTask:isScoredMainTaskStartLine(cur.find(x=>String(x).trim())||'')});
  return blocks.filter(b=>String(b.text||'').trim());
}
function scoreValuesFromText(text){const rx=/(\d+(?:[.,]\d+)?)\s*(?:bod(?:ů|u|y)?|b\.?|points?|pts?)/gi;return [...String(text||'').matchAll(rx)].map(m=>Number(String(m[1]).replace(',','.'))).filter(Number.isFinite)}
function declaredScoreTotals(text){const src=String(text||''),out=[],strong=/(?:celkem(?:\s+bod(?:ů|u|y)?)?|total\s+(?:points?|pts?))\s*[:=]?\s*(\d+(?:[.,]\d+)?)/gi,line=/^(?:\s*\*{0,2})?(?:součet|soucet|maximum|max\.?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)(?:\s*(?:bod(?:ů|u|y)?|b\.?|points?|pts?))?\.?(?:\*{0,2})?\s*$/gim;for(const rx of [strong,line])for(const m of src.matchAll(rx)){const n=Number(String(m[1]).replace(',','.'));if(Number.isFinite(n))out.push(n)}return out}
function scoringIntegrityIssues(text){
  const src=String(text||''),blocks=splitScoringBlocks(src).filter(b=>b.isTask),issues=[],top=[];
  for(const block of blocks){const lines=String(block.text||'').split(/\r?\n/),first=lines.shift()||'',parent=scoreValuesFromText(first)[0];if(Number.isFinite(parent))top.push(parent);else top.push(null);const childValues=[];for(const line of lines){if(declaredScoreTotals(line).length)continue;childValues.push(...scoreValuesFromText(line))}if(Number.isFinite(parent)&&childValues.length){const childSum=childValues.reduce((a,b)=>a+b,0);if(Math.abs(childSum-parent)>1e-9)issues.push('Bodování hlavní úlohy „'+first.replace(/^\*{1,2}|\*{1,2}$/g,'').trim()+'“ uvádí '+formatScoreNumber(parent)+' b., ale její podbody dohromady '+formatScoreNumber(childSum)+' b.')}}
  const totals=declaredScoreTotals(src);if(totals.length>1&&new Set(totals.map(String)).size>1)issues.push('Pracovní list obsahuje více různých celkových bodových součtů.');
  if(totals.length&&blocks.length){const declared=totals[totals.length-1],known=top.filter(Number.isFinite);if(known.length===blocks.length){const sum=known.reduce((a,b)=>a+b,0);if(Math.abs(sum-declared)>1e-9)issues.push('Celkový součet je '+formatScoreNumber(declared)+' b., ale součet bodů hlavních úloh je '+formatScoreNumber(sum)+' b.')}else if(known.length)issues.push('Celkový součet nelze bezpečně ověřit, protože některé hlavní úlohy nemají vlastní bodovou hodnotu.')}
  return [...new Set(issues)];
}
function splitPrintBlocks(text){
  const lines=String(text||'').split(/\r?\n/),blocks=[];let cur=[];
  for(const ln of lines){
    if(isMainTaskStartLine(ln)&&cur.length){blocks.push({text:cur.join('\n'),isTask:isMainTaskStartLine(cur.find(x=>String(x).trim())||'')});cur=[ln]}
    else cur.push(ln);
  }
  if(cur.length)blocks.push({text:cur.join('\n'),isTask:isMainTaskStartLine(cur.find(x=>String(x).trim())||'')});
  return blocks.filter(b=>String(b.text||'').trim());
}
function manualScoreValue(scores,index){
  if(!scores||typeof scores!=='object')return null;const v=Number(scores[index]);return Number.isFinite(v)&&v>=0?v:null;
}
function formatScoreNumber(v){const n=Number(v);return Number.isInteger(n)?String(n):String(Math.round(n*10)/10).replace('.',',')}
function renderPrintBlock(block,index,scores,visualAssets,mediaSource){
  const score=block.isTask?manualScoreValue(scores,index):null;
  if(score==null)return renderTextWithVisuals(block.text,visualAssets||[],true,mediaSource);
  const lines=String(block.text||'').split(/\r?\n/),first=lines.shift()||'';
  return renderTextWithVisuals(first,visualAssets||[],true,mediaSource)+' <span class="pa-points">('+formatScoreNumber(score)+' b.)</span>'+(lines.length?'\n'+renderTextWithVisuals(lines.join('\n'),visualAssets||[],true,mediaSource):'');
}
function buildPrintBody(text,manualScores,visualAssets,mediaSource){
  const blocks=splitPrintBlocks(text);
  if(!blocks.length)return '<div class="pa-ex">'+renderTextWithVisuals(text,visualAssets||[],true,mediaSource)+'</div>';
  return blocks.map((b,i)=>'<div class="pa-ex" data-print-block="'+i+'">'+renderPrintBlock(b,i,manualScores,visualAssets||[],mediaSource)+'</div>').join('');
}
function stripGeneratedScoring(text){const point=String.raw`(?:bod(?:u|y|ů)?|b\.?|points?|pts?)`,num=String.raw`\d+(?:[.,]\d+)?`,totalCore=String.raw`(?:(?:celkem|součet|soucet|maximum|max\.?)\s*[:=]?\s*${num}\s*${point}|(?:total\s+(?:points?|pts?)|celkem\s+bod(?:u|y|ů)?|součet\s+bod(?:u|y|ů)?|soucet\s+bod(?:u|y|ů)?|maximum\s+(?:points?|pts?)|max\.?\s+(?:points?|pts?))\s*[:=]?\s*${num})`,total=new RegExp('^'+totalCore+String.raw`\s*[.!?]?\s*$`,'i'),suffix=new RegExp(String.raw`\s*(?:\(|\[)\s*${num}\s*${point}\s*(?:\)|\])\s*$`,'i');const scoreSentence=new RegExp(String.raw`(?:^|\s+)(?:hodnocení|bodování|scoring)\s*:\s*[^\n.!?]*(?:[.!?](?=\s|$)|$)`,'gi');const scoreParen=new RegExp(String.raw`\s*(?:\(|\[)(?=[^)\]\n]{0,180}${num}\s*${point})(?=[^)\]\n]{0,180}(?:každ(?:ý|á|é)|each|za|per|celkem|total|součet|soucet|maximum|max\.?|hodnocení|bodování|scoring))[^)\]\n]{0,180}(?:\)|\])`,'gi');const inlineTotal=new RegExp(String.raw`(?:^|\s+)${totalCore}\s*[.!?]?`,'gi');return String(text||'').split(/\r?\n/).map(line=>{const raw=String(line||''),lead=raw.match(/^\s*/)?.[0]||'',t=raw.trim(),open=t.startsWith('**')?'**':t.startsWith('*')?'*':'',close=t.endsWith('**')?'**':t.endsWith('*')?'*':'';let x=t.slice(open.length,t.length-close.length).trim();if(total.test(x))return '';x=x.replace(scoreSentence,' ').replace(scoreParen,' ').replace(inlineTotal,' ').replace(suffix,'').replace(/\s+([,.;:!?])/g,'$1').replace(/\s{2,}/g,' ').trim();return !x||/^[:;,.-]+$/.test(x)?'':lead+open+x+close}).join('\n').replace(/\n{3,}/g,'\n\n').trim()}
function openManualCopy(text){
  $('#copyManual').value=text||'';
  $('#copyOverlay').classList.add('show');
  setTimeout(()=>{$('#copyManual').focus();$('#copyManual').select()},0);
}
async function copyText(text,btn,doneLabel='Zkopírováno',resetLabel='Kopírovat'){
  let ok=false;
  if(navigator.clipboard&&window.isSecureContext){
    try{await navigator.clipboard.writeText(text||'');ok=true}catch(_){}
  }
  if(!ok){
    const ta=document.createElement('textarea');
    ta.value=text||'';ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';ta.style.top='0';
    document.body.appendChild(ta);ta.focus();ta.select();
    try{ok=document.execCommand('copy')}catch(_){ok=false}
    ta.remove();
  }
  const old=resetLabel||btn.textContent;
  if(ok){btn.textContent=doneLabel;setTimeout(()=>btn.textContent=old,1500)}
  else{btn.textContent='Zkopíruj ručně';openManualCopy(text);setTimeout(()=>btn.textContent=old,1800)}
}
function getMarkedSection(src,name){
  const names=['WORKSHEET_TITLE','STUDENT_INSTRUCTIONS','TASKS','ANSWER_KEY','TEACHER_NOTE','WORKSHEET'];
  const others=names.filter(n=>n!==name).join('|');
  const re=new RegExp('<<<\\s*'+name+'\\s*>>>([\\s\\S]*?)(?=<<<\\s*(?:'+others+')\\s*>>>|$)','i');
  const m=String(src||'').match(re);
  return m?(m[1]||'').trim():'';
}
function normalizeWorksheetTitleText(value){
  let title=String(value||'').trim().replace(/^\*{1,2}|\*{1,2}$/g,'').trim();
  title=title.replace(/\s*(?:\(|[-–—])\s*(?:parallel version|parallel variant|paralelní verze|paralelní varianta|normální verze|jednodušší verze|obtížnější verze)\s*\)?\s*$/i,'').trim();
  return title;
}
function normalizeJsonTextValue(v){
  if(Array.isArray(v))return v.map(normalizeJsonTextValue).filter(Boolean).join('\n');
  if(v&&typeof v==='object')return Object.entries(v).map(([k,val])=>String(k)+': '+normalizeJsonTextValue(val)).join('\n');
  return String(v||'').trim();
}
function stripJsonCodeFence(src){
  return String(src||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
}
function tryParseWorksheetJson(src){
  const raw=stripJsonCodeFence(src);
  const candidates=[raw];
  const first=raw.indexOf('{'), last=raw.lastIndexOf('}');
  if(first>=0&&last>first)candidates.push(raw.slice(first,last+1));
  for(const c of candidates){
    try{
      const obj=JSON.parse(c);
      if(!obj||typeof obj!=='object'||Array.isArray(obj))continue;
      const pick=(...keys)=>{
        for(const k of keys){if(Object.prototype.hasOwnProperty.call(obj,k))return normalizeJsonTextValue(obj[k])}
        return '';
      };
      const parts={
        title:normalizeWorksheetTitleText(pick('worksheet_title','worksheetTitle','title','nazev')),
        instructions:pick('student_instructions','studentInstructions','instructions','instrukce'),
        tasks:pick('tasks','ulohy','exercises','worksheet','pracovni_list'),
        answerKey:pick('answer_key','answerKey','key','reseni','solutions'),
        teacherNote:pick('teacher_note','teacherNote','note','poznamka')
      };
      if(parts.title||parts.instructions||parts.tasks||parts.answerKey)return parts;
    }catch(_){/* zkusí se další kandidát */}
  }
  return null;
}
