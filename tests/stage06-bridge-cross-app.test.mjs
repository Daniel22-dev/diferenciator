import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { webcrypto, createHash } from 'node:crypto';

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
