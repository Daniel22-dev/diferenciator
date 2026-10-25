import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { webcrypto, createHash } from 'node:crypto';
import { mapSelectedWorksheet } from '../src/modules/stage06-outbound-material.js';
import { saveMaterialToStudio } from './fixtures/studio-prod-021253-save-to-studio.mjs';
import { validateMaterialPackage } from './fixtures/studio-prod-021253-material-validator.mjs';

const platformSource=fs.readFileSync(new URL('../vendor/ghrab-platform-1.1.3/ghrab-platform.js',import.meta.url),'utf8');
// Byte-identical to AI Studio production main (0.21.253) at SHA 501d7086.
// Pin against its Git blob, not a guessed simulation of the old Bridge.
const studio112bytes=fs.readFileSync(new URL('../vendor/ghrab-platform-1.1.2/ghrab-platform.js',import.meta.url));
const studio112Source=studio112bytes.toString('utf8');
const studio112Sha=createHash('sha1').update('blob '+studio112bytes.length+'\0').update(studio112bytes).digest('hex');
assert.equal(studio112Sha,'d8a36f023e2930b0b3c0bb045e5ed6b2e464bd2a','Studio production Platform 1.1.2 fixture identity drift');

class Storage {
  map=new Map();
  get length(){return this.map.size;}
  key(i){return [...this.map.keys()][i]??null;}
  getItem(k){return this.map.get(String(k))??null;}
  setItem(k,v){this.map.set(String(k),String(v));}
  removeItem(k){this.map.delete(String(k));}
  clear(){this.map.clear();}
}
function node(){
  return {dataset:{},style:{},classList:{contains:()=>false,add:()=>{},toggle:()=>false},children:[],attributes:[],
    hasAttribute:()=>false,setAttribute:()=>{},getAttribute:()=>null,
    remove:()=>{},replaceWith:()=>{},replaceChildren:()=>{},
    append:()=>{},prepend:()=>{},addEventListener:()=>{},querySelectorAll:()=>[],querySelector:()=>null,click:()=>{}};
}
function instantiate(appId,appVersion,localStorage,platformRelease='1.1.3'){
  const document={
    currentScript:{src:'https://school.example/app/ghrab/ghrab-platform.js'},
    documentElement:node(),body:node(),readyState:'loading',
    getElementById:()=>null,addEventListener:()=>{},dispatchEvent:()=>{},
    querySelector:()=>null,querySelectorAll:()=>[],createElement:node,createTextNode:x=>({textContent:x})
  };
  document.documentElement.dataset.ghrabAppId=appId;
  document.documentElement.dataset.ghrabAppVersion=appVersion;
  const context={
    console,URL,URLSearchParams,TextEncoder,TextDecoder,Blob,setTimeout,clearTimeout,
    crypto:webcrypto,location:new URL('https://school.example/app/index.html'),
    navigator:{},document,localStorage,sessionStorage:new Storage(),Storage,
    MutationObserver:class{observe(){} disconnect(){}},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    matchMedia:()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}),
    GHRAB_PLATFORM_CONFIG:{
      schema:'ghrab-platform-app-config-v1',appId,appVersion,
      requiredPlatformRange:platformRelease==='1.1.2'?'>=1.1.2 <2.0.0':'>=1.1.3 <2.0.0',autoFooter:false,
      bridgeWriteLegacy:false,bridgeMaxBytes:500000,
      storageMigration:{id:'test',mappings:[]},theme:{default:'light',supported:['light']}
    },
  };
  context.window=context;context.globalThis=context;
  const releaseSource=platformRelease==='1.1.2'?studio112Source:platformSource;
  vm.runInNewContext(releaseSource,context,{filename:'ghrab-platform-'+platformRelease+'.js',timeout:2000});
  assert.equal(context.GHRAB_PLATFORM?.version,platformRelease);
  return context.GHRAB_PLATFORM;
}
const material=()=>({
  schema:'ghrab-material-v1',id:'cross-app-material',title:'Synthetic material',
  subject:'English',content:{sourceText:'Recycle paper.'}
});
const stored=new Storage();

test('Studio 0.21 -> Differentiator 1.3 uses receiver range, never source range',()=>{
  stored.clear();
  const from=instantiate('ai-studio','0.21.255',stored);
  const to=instantiate('differentiator','1.3.51',stored);
  const packet=from.bridge.create({
    target:'differentiator',sourceAppId:'ai-studio',sourceAppVersion:'0.21.255',
    targetVersionRange:'>=1.3.51 <2.0.0',material:material(),writeLegacy:false
  });
  assert.equal(packet?.schema,'ghrab-studio-handoff-v2');
  assert.equal(from.bridge.peek({allowAnyTarget:true})?.material?.id,'cross-app-material');
  assert.equal(to.bridge.take({target:'differentiator'})?.material?.id,'cross-app-material');
  assert.equal(to.bridge.take({target:'differentiator'}),null,'one-time consume');
});

test('Differentiator 1.3 -> Studio 0.21 validates Studio target version',()=>{
  stored.clear();
  const from=instantiate('differentiator','1.3.51',stored);
  const to=instantiate('ai-studio','0.21.255',stored);
  const handoff=from.bridge.create({
    target:'ai-studio',sourceAppId:'differentiator',sourceAppVersion:'1.3.51',
    targetVersionRange:'>=0.21.6 <1.0.0',material:material(),writeLegacy:false
  });
  assert.equal(handoff?.target,'ai-studio');
  assert.equal(to.bridge.take({target:'ai-studio'})?.sourceAppId,'differentiator');
});

test('incompatible receiver version is rejected, without dropping valid sender-side pending packet',()=>{
  stored.clear();
  const from=instantiate('ai-studio','0.21.255',stored);
  const toOld=instantiate('differentiator','1.3.50',stored);
  const toNew=instantiate('differentiator','1.3.51',stored);
  const handoff=from.bridge.create({
    target:'differentiator',sourceAppId:'ai-studio',sourceAppVersion:'0.21.255',
    targetVersionRange:'>=1.3.51 <2.0.0',material:material(),writeLegacy:false
  });
  assert.ok(handoff);
  const envelope=JSON.parse(stored.getItem('ghrab.platform.handoff.v2'));
  assert.equal(toOld.bridge.validate(envelope,{target:'differentiator'}).code,'version-range');
  assert.equal(from.bridge.create({target:'differentiator',material:material()}),null,'pending handoff cannot be overwritten');
  assert.ok(toNew.bridge.take({target:'differentiator'}),'compatible receiver must still consume pending');
});

test('target mismatch cannot consume handoff and checksum must remain valid',()=>{
  stored.clear();
  const from=instantiate('ai-studio','0.21.255',stored);
  const to=instantiate('differentiator','1.3.51',stored);
  from.bridge.create({target:'differentiator',targetVersionRange:'>=1.3.51 <2.0.0',material:material(),writeLegacy:false});
  const packet=JSON.parse(stored.getItem('ghrab.platform.handoff.v2'));
  assert.equal(to.bridge.validate(packet,{target:'ludus'}).code,'target');
  packet.payload.value.title='Modified without checksum update';
  assert.equal(to.bridge.validate(packet,{target:'differentiator'}).code,'checksum');
});

test('RELEASE: Differentiator 1.1.3 outbound is received by current production Studio 1.1.2 (0.21.253)',()=>{
  stored.clear();
  const sender=instantiate('differentiator','1.3.51',stored,'1.1.3');
  const productionStudio=instantiate('ai-studio','0.21.253',stored,'1.1.2');
  const packet=sender.bridge.create({
    target:'ai-studio',sourceAppId:'differentiator',sourceAppVersion:'1.3.51',
    targetVersionRange:'>=0.21.6 <1.0.0',studioUrl:'https://school.example/AI-Studio-GHRAB/',
    material:material(),writeLegacy:false
  });
  assert.equal(packet?.schema,'ghrab-studio-handoff-v2','sender must write actual Bridge v2');
  assert.equal(stored.getItem('ghrab.handoff.v1'),null,'must not need legacy fallback');
  const accepted=productionStudio.bridge.take({target:'ai-studio'});
  assert.equal(accepted?.material?.id,'cross-app-material');
  assert.equal(accepted?.sourceAppId,'differentiator');
  assert.equal(productionStudio.bridge.take({target:'ai-studio'}),null,'real one-time receive');
  assert.equal(stored.getItem('ghrab.platform.handoff.v2'),null,'consumed packet removed');
});

test('RELEASE: old production Studio 1.1.2 is not a safe cross-version sender to Differentiator 1.1.3',()=>{
  stored.clear();
  const productionStudio=instantiate('ai-studio','0.21.253',stored,'1.1.2');
  const differentiator=instantiate('differentiator','1.3.51',stored,'1.1.3');
  assert.throws(()=>productionStudio.bridge.create({
    target:'differentiator',sourceAppId:'ai-studio',sourceAppVersion:'0.21.253',
    targetVersionRange:'>=1.3.51 <2.0.0',material:material(),writeLegacy:false,
  }),/version-range/,'old sender must remain blocked rather than silently misroute');
  assert.equal(stored.getItem('ghrab.platform.handoff.v2'),null);
  assert.equal(differentiator.bridge.take({target:'differentiator'}),null);
});


const studioProductionFixtures=[
  ['studio-prod-021253-save-to-studio.mjs','a494f8436e849aae7d4ad8f93f09b1594f7eef07'],
  ['studio-prod-021253-material-validator.mjs','8e38aaf5b02bf8a078d5ad074b4bbecf1ab317b8']
];
for(const [name,expected] of studioProductionFixtures){
  const bytes=fs.readFileSync(new URL('./fixtures/'+name,import.meta.url));
  const sha=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(sha,expected,'exact Studio 0.21.253 production fixture drift: '+name);
}
function selectedWorksheet(overrides={}){
  return {
    form:{subject:'English',meta:{topic:'Recycling',subject:'English',className:'2.B'},
      advanced:{learningGoal:'Explain the importance of recycling'}},
    sheet:{_tierKey:'core',_text:'Read the text. Why recycle paper?',_cefrLabel:'B1',
      _parts:{title:'Recycling',answerKey:'SECRET-ANSWER-123',teacherNote:'SECRET-TEACHER-NOTE'},
      _key:'SECRET-TEACHER-KEY',_visualAssets:[],_mediaSource:null},
    id:'dif-production-acceptance-1',now:'2026-10-25T14:00:00.000Z',
    appVersion:'1.3.51',privacyConfirmed:true,...overrides
  };
}
function withSourcePlatform(platform,run){
  const previous={platform:globalThis.GHRAB_PLATFORM,location:globalThis.location};
  globalThis.GHRAB_PLATFORM=platform;
  globalThis.location={href:'https://school.example/diferenciator/'};
  try{return run();}
  finally{
    if(previous.platform===undefined) delete globalThis.GHRAB_PLATFORM;
    else globalThis.GHRAB_PLATFORM=previous.platform;
    if(previous.location===undefined) delete globalThis.location;
    else globalThis.location=previous.location;
  }
}

test('REAL CONTRACT: Differentiator worksheet maps into byte-pinned production Studio Material v1 validator',()=>{
  const exported=mapSelectedWorksheet(selectedWorksheet());
  assert.equal(validateMaterialPackage(exported).valid,true);
  assert.equal(exported.title,'Recycling (Běžná)');
  assert.equal(exported.subject,'English');
  assert.equal(exported.level,'B1');
  assert.equal(exported.yearGroup,'2.B');
  assert.deepEqual(exported.objectives,['Explain the importance of recycling']);
  assert.equal(exported.content.sourceText,'Read the text. Why recycle paper?');
  assert.deepEqual(exported.content.tasks,[],'no invented structured questions');
  assert.equal(exported.provenance.containsPersonalData,false);
  assert.equal(exported.quality.status,'ai-draft');
  const raw=JSON.stringify(exported);
  for(const secret of ['SECRET-ANSWER-123','SECRET-TEACHER-NOTE','SECRET-TEACHER-KEY'])assert.ok(!raw.includes(secret),secret);
});

test('REAL CONTRACT: actual Studio published helper transfers validated worksheet to Studio 0.21.253 via v2 only',()=>{
  stored.clear();
  const differentiator=instantiate('differentiator','1.3.51',stored,'1.1.3');
  const oldStudio=instantiate('ai-studio','0.21.253',stored,'1.1.2');
  const exported=mapSelectedWorksheet(selectedWorksheet());
  const accepted=withSourcePlatform(differentiator,()=>
    saveMaterialToStudio({material:exported,studioUrl:'https://school.example/AI-Studio-GHRAB/',
      sourceAppId:'differentiator',sourceAppVersion:'1.3.51',navigate:false}));
  assert.equal(accepted.ok,true);
  assert.equal(accepted.targetUrl,'https://school.example/AI-Studio-GHRAB/library/?studioHandoff=1');
  assert.equal(accepted.packet?.material?.id,exported.id);
  assert.equal(accepted.packet?.packet?.schema,'ghrab-studio-handoff-v2');
  assert.equal(stored.getItem('ghrab.handoff.v1'),null,'legacy payload must not be required in runtime');
  const livePacket=oldStudio.bridge.take({target:'ai-studio'});
  assert.equal(livePacket?.sourceAppId,'differentiator');
  assert.equal(livePacket.material.id,exported.id);
  assert.equal(validateMaterialPackage(livePacket.material).valid,true,'exact production schema validates');
  const workspace=new Map();
  workspace.set(livePacket.material.id,livePacket.material);
  assert.equal(workspace.get(exported.id).content.sourceText,exported.content.sourceText);
  assert.equal(oldStudio.bridge.take({target:'ai-studio'}),null,'replay rejected');
  assert.equal(stored.getItem('ghrab.platform.handoff.v2'),null,'no pending packet remains');
});

test('REAL CONTRACT: Studio 1.1.3 -> Differentiator 1.1.3 -> Studio 1.1.3 real Platform roundtrip',()=>{
  stored.clear();
  const newStudio=instantiate('ai-studio','0.21.255',stored,'1.1.3');
  const differentiator=instantiate('differentiator','1.3.51',stored,'1.1.3');
  const original=mapSelectedWorksheet(selectedWorksheet({id:'dif-round-trip-source'}));
  const inbound=newStudio.bridge.create({target:'differentiator',sourceAppId:'ai-studio',
    sourceAppVersion:'0.21.255',targetVersionRange:'>=1.3.51 <2.0.0',
    material:original,writeLegacy:false});
  assert.equal(inbound?.target,'differentiator');
  const imported=differentiator.bridge.take({target:'differentiator'});
  assert.equal(imported?.material?.id,original.id);
  assert.equal(differentiator.bridge.take({target:'differentiator'}),null);
  const derived=mapSelectedWorksheet(selectedWorksheet({
    id:'dif-round-trip-result',
    sheet:{...selectedWorksheet().sheet,
      _text:imported.material.content.sourceText+' Extra practice with your partner.'}
  }));
  const returned=withSourcePlatform(differentiator,()=>
    saveMaterialToStudio({material:derived,studioUrl:'https://school.example/AI-Studio-GHRAB/',
      sourceAppId:'differentiator',sourceAppVersion:'1.3.51',navigate:false}));
  assert.equal(returned.ok,true);
  const reimported=newStudio.bridge.take({target:'ai-studio'});
  assert.equal(reimported?.material?.id,'dif-round-trip-result');
  assert.equal(reimported?.material?.content.sourceText,
    'Read the text. Why recycle paper? Extra practice with your partner.');
  assert.equal(validateMaterialPackage(reimported.material).valid,true);
  assert.equal(newStudio.bridge.take({target:'ai-studio'}),null);
});

test('REAL CONTRACT: pending handoff is not overwritten and unsafe sheets never become packets',()=>{
  stored.clear();
  const differentiator=instantiate('differentiator','1.3.51',stored,'1.1.3');
  const first=mapSelectedWorksheet(selectedWorksheet({id:'dif-first'}));
  const second=mapSelectedWorksheet(selectedWorksheet({id:'dif-second'}));
  const start=withSourcePlatform(differentiator,()=>saveMaterialToStudio({
    material:first,studioUrl:'https://school.example/AI-Studio-GHRAB/',
    sourceAppId:'differentiator',sourceAppVersion:'1.3.51',navigate:false}));
  assert.equal(start.ok,true);
  const pending=withSourcePlatform(differentiator,()=>saveMaterialToStudio({
    material:second,studioUrl:'https://school.example/AI-Studio-GHRAB/',
    sourceAppId:'differentiator',sourceAppVersion:'1.3.51',navigate:false}));
  assert.equal(pending.ok,false);
  assert.equal(pending.reason,'handoff-pending');
  assert.equal(JSON.parse(stored.getItem('ghrab.platform.handoff.v2')).payload.value.id,first.id);
  const before=stored.getItem('ghrab.platform.handoff.v2');
  for(const source of ['teacher@example.test','<img src=x onerror=alert(1)>','[[VISUAL_1]]']){
    const unsafe=selectedWorksheet({sheet:{...selectedWorksheet().sheet,_text:source}});
    assert.throws(()=>mapSelectedWorksheet(unsafe));
  }
  assert.equal(stored.getItem('ghrab.platform.handoff.v2'),before);
  assert.equal(instantiate('ai-studio','0.21.253',stored,'1.1.2').bridge.take({target:'ai-studio'})?.material.id,first.id);
});
