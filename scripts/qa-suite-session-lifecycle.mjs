#!/usr/bin/env node
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const lifecycle=fs.readFileSync(path.join(root,'src/js/21-suite-session-lifecycle.js'),'utf8');
const platform=fs.readFileSync(path.join(root,'vendor/ghrab-platform-1.1.2/ghrab-platform.js'),'utf8');
const report={schema:'ghrab-suite-session-qa-v1',appId:'differentiator',appVersion:'1.3.48',platformVersion:'1.1.2',syntheticOnly:true,mode:'deterministic-multi-context-simulation',cases:[]};
const add=(id,pass,detail={})=>report.cases.push({id,pass,...detail});
class Store{constructor(shared){this.map=shared||new Map();this.failRemoveKey='';this.failSetKey=''}getItem(k){k=String(k);return this.map.has(k)?this.map.get(k):null}setItem(k,v){k=String(k);if(k===this.failSetKey)throw new Error('synthetic-set-failure:'+k);this.map.set(k,String(v))}removeItem(k){k=String(k);if(k===this.failRemoveKey)throw new Error('synthetic-remove-failure:'+k);this.map.delete(k)}clear(){this.map.clear()}key(i){return [...this.map.keys()][i]??null}get length(){return this.map.size}}
const sharedMap=new Map();let contexts=[];
function makeContext({withHandler=true}={}){
 const local=new Store(sharedMap),session=new Store();const handlers=new Set(),events=new Map();let memory={paste:'',base:'',subject:'',working:false,keyMemory:''};
 const window={localStorage:local,sessionStorage:session,addEventListener(type,fn){if(!events.has(type))events.set(type,new Set());events.get(type).add(fn)},dispatchEvent(ev){for(const fn of events.get(ev.type)||[])fn(ev)}};
 const document={addEventListener(){},dispatchEvent(){}};
 const seenKey='ghrab.differentiator.suite-session-seen.v1',generationKey='ghrab.platform.suite-session-generation.v1';
 async function notify(detail){let ok=true;if(!handlers.size)return {ok:false,pending:true};for(const h of [...handlers]){try{const r=await h(detail);if(r===false||r?.ok===false)ok=false}catch{ok=false}}if(ok)local.setItem(seenKey,detail.generation);return {ok}}
 const sessionApi={contract:'ghrab-suite-session-v1',generationKey,generation:()=>local.getItem(generationKey)||'',seen:()=>local.getItem(seenKey)||'',pending:()=>Boolean((local.getItem(generationKey)||'')!==(local.getItem(seenKey)||'')),acknowledge(g){local.setItem(seenKey,String(g||local.getItem(generationKey)||''));return true},onEnd(handler,opts={}){handlers.add(handler);const g=local.getItem(generationKey)||'';if(opts.replay!==false&&g&&g!==(local.getItem(seenKey)||''))void notify({schema:'ghrab-suite-session-v1',generation:g,reason:'pending-suite-end',clearApplicationData:true,replay:true});return()=>handlers.delete(handler)},end(opts={}){const generation=String(opts.generation||`g-${Date.now()}-${Math.random().toString(36).slice(2)}`);local.setItem(generationKey,generation);const detail={schema:'ghrab-suite-session-v1',generation,reason:opts.reason||'end-work',clearApplicationData:true};void notify(detail);for(const c of contexts){if(c.local===local)continue;c.window.dispatchEvent({type:'storage',key:generationKey,newValue:generation})}return {ok:true,generation,detail}}};
 const sandbox={window,document,console,GHRAB_PLATFORM:{version:'1.1.2',session:sessionApi},setTimeout,clearTimeout,Promise,Object,String,Boolean,Error,JSON};window.GHRAB_PLATFORM=sandbox.GHRAB_PLATFORM;
 sandbox.clearWorkingData=()=>{memory={...memory,paste:'',base:'',subject:'',working:false}};sandbox.hasWorkingData=()=>memory.working||Boolean(memory.paste||memory.base);sandbox.setKey=(v)=>{memory.keyMemory=String(v||'')};
 vm.createContext(sandbox);if(withHandler)vm.runInContext(lifecycle,sandbox,{filename:'21-suite-session-lifecycle.js'});
 const ctx={sandbox,window,local,session,sessionApi,memory:()=>memory,setMemory(v){memory={...memory,...v}},pageshow(){window.dispatchEvent({type:'pageshow'})}};contexts.push(ctx);return ctx;
}
async function settle(){await new Promise(r=>setTimeout(r,20))}
function reset(){sharedMap.clear();contexts=[]}
function seed(c,label){c.setMemory({paste:label+'-paste',base:label+'-base',subject:label+'-subject',working:true,keyMemory:label+'-secret'});c.session.setItem('ghrab.differentiator.ai.key.session.v1',label+'-secret');c.local.setItem('ghrab.differentiator.ai.key.local.v1',label+'-local-secret');c.local.setItem('ghrab.platform.handoff.v2',JSON.stringify({schema:'ghrab-studio-handoff-v2',target:{appId:'differentiator'},payload:{value:{content:{sourceText:label}}}}))}
function state(c){return {memory:c.memory(),sessionKey:c.session.getItem('ghrab.differentiator.ai.key.session.v1'),localKey:c.local.getItem('ghrab.differentiator.ai.key.local.v1'),handoff:c.local.getItem('ghrab.platform.handoff.v2'),generation:c.local.getItem('ghrab.platform.suite-session-generation.v1'),observed:c.local.getItem('ghrab.differentiator.suite-session-observed.v1'),cleaned:c.local.getItem('ghrab.differentiator.suite-session-cleaned.v1'),ack:c.local.getItem('ghrab.differentiator.suite-session-ack.v1'),seen:c.local.getItem('ghrab.differentiator.suite-session-seen.v1')}}
// Regression guard: the app lifecycle must be safe when Platform has not created a global binding yet.
{
 const local=new Store(),session=new Store(),docEvents=new Map(),winEvents=new Map();let lateHandler=null,memory={working:true,paste:'LATE',base:'LATE'};
 const window={localStorage:local,sessionStorage:session,addEventListener(type,fn){if(!winEvents.has(type))winEvents.set(type,new Set());winEvents.get(type).add(fn)},dispatchEvent(ev){for(const fn of winEvents.get(ev.type)||[])fn(ev)}};
 const document={addEventListener(type,fn){if(!docEvents.has(type))docEvents.set(type,new Set());docEvents.get(type).add(fn)},dispatchEvent(ev){for(const fn of docEvents.get(ev.type)||[])fn(ev)}};
 const sandbox={window,document,console,setTimeout,clearTimeout,Promise,Object,String,Boolean,Error,JSON,clearWorkingData(){memory={working:false,paste:'',base:''}},hasWorkingData(){return memory.working||Boolean(memory.paste||memory.base)},setKey(){}};
 let initialSafe=true;try{vm.createContext(sandbox);vm.runInContext(lifecycle,sandbox,{filename:'21-suite-session-lifecycle.js'})}catch(e){initialSafe=false}
 const lateSession={contract:'ghrab-suite-session-v1',generation:()=>'',onEnd(fn){lateHandler=fn;return()=>{}},acknowledge(){return true}};
 window.GHRAB_PLATFORM={version:'1.1.2',session:lateSession};document.dispatchEvent({type:'ghrab:platform-ready'});
 session.setItem('ghrab.differentiator.ai.key.session.v1','LATE-secret');local.setItem('ghrab.differentiator.ai.key.local.v1','LATE-local');
 let cleanup=null;if(lateHandler)cleanup=await lateHandler({schema:'ghrab-suite-session-v1',generation:'late-g',reason:'late-platform',clearApplicationData:true});
 add('late-platform-init-no-reference-error',initialSafe&&typeof lateHandler==='function'&&cleanup?.ok===true&&session.getItem('ghrab.differentiator.ai.key.session.v1')===null&&local.getItem('ghrab.differentiator.ai.key.local.v1')===null,{initialSafe,handlerInstalled:typeof lateHandler==='function',cleanup});
}
// Platform source contract guard
add('platform-1.1.2-contract-source',platform.includes("const PLATFORM_VERSION = '1.1.2'")&&platform.includes("contract: 'ghrab-suite-session-v1'")&&platform.includes('onEnd: onSuiteSessionEnd')&&platform.includes('acknowledge:'),{});
// 1 open child
reset();{const c=makeContext();seed(c,'OPEN');const g=c.sessionApi.end({reason:'qa-open'}).generation;await settle();const s=state(c);add('open-child-suite-end',!s.memory.working&&!s.memory.paste&&!s.sessionKey&&!s.localKey&&!s.handoff&&s.cleaned===g&&s.ack===g&&s.seen===g,{generation:g,state:s})}
// 2 delayed-open replay + reload idempotence
reset();{const seedCtx=makeContext({withHandler:false});seedCtx.local.setItem('ghrab.differentiator.ai.key.local.v1','DELAY-local');seedCtx.local.setItem('ghrab.platform.handoff.v2',JSON.stringify({schema:'ghrab-studio-handoff-v2',target:{appId:'differentiator'}}));seedCtx.local.setItem('ghrab.platform.suite-session-generation.v1','delayed-g');contexts=[];const c=makeContext();await settle();let s=state(c);const first=!s.localKey&&!s.handoff&&s.ack==='delayed-g';c.session.setItem('ghrab.differentiator.ai.key.session.v1','NEW-AFTER');contexts=[];const reloaded=makeContext();reloaded.session.map=c.session.map;await settle();s=state(reloaded);add('delayed-open-replay',first&&s.sessionKey==='NEW-AFTER',{state:s})}
// 3 multi-tab
reset();{const a=makeContext(),b=makeContext();seed(a,'A');seed(b,'B');const g=a.sessionApi.end({reason:'qa-multitab'}).generation;for(const c of [b]){const gen=c.local.getItem('ghrab.platform.suite-session-generation.v1');for(const fn of c.window.__none||[])void fn; if(gen)c.pageshow()}await settle();const sa=state(a),sb=state(b);add('multi-tab',!sa.memory.working&&!sb.memory.working&&!sa.sessionKey&&!sb.sessionKey&&sa.ack===g&&sb.ack===g,{generation:g,tabA:sa,tabB:sb})}
// 4 browser Back/Forward semantic: restored stale document receives pageshow and must compare current generation even when another tab already acked
reset();{const stale=makeContext(),coord=makeContext();seed(stale,'HISTORY');const g=coord.sessionApi.end({reason:'qa-history'}).generation;await settle(); // stale would normally receive storage while active; restore stale canary to emulate frozen BFCache page that missed it
stale.setMemory({paste:'HISTORY-restored',base:'HISTORY-restored',working:true});stale.session.setItem('ghrab.differentiator.ai.key.session.v1','HISTORY-restored-secret');stale.pageshow();await settle();const s=state(stale);add('browser-back-forward',!s.memory.working&&!s.memory.paste&&!s.sessionKey&&s.ack===g,{generation:g,state:s})}
// 5 fail closed
reset();{const c=makeContext();seed(c,'FAIL');c.session.failRemoveKey='ghrab.differentiator.ai.key.session.v1';const g=c.sessionApi.end({reason:'qa-failclosed'}).generation;await settle();const s=state(c);add('fail-closed',s.sessionKey==='FAIL-secret'&&s.ack!==g&&s.cleaned!==g&&s.seen!==g,{generation:g,state:s})}
// 6 negative control
reset();{const c=makeContext({withHandler:false});seed(c,'NEG');const g=c.sessionApi.end({reason:'qa-negative'}).generation;await settle();const s=state(c);const securityWouldPass=!s.memory.working&&!s.sessionKey&&s.ack===g;add('negative-control-disabled-handler',securityWouldPass===false,{expectedSecurityOutcome:'FAIL',observedSecurityOutcome:securityWouldPass?'PASS':'FAIL',generation:g,state:s})}
report.summary={total:report.cases.length,passed:report.cases.filter(x=>x.pass).length,failed:report.cases.filter(x=>!x.pass).length};report.status=report.summary.failed?'failed':'passed';fs.mkdirSync(path.join(root,'test-results'),{recursive:true});fs.writeFileSync(path.join(root,'test-results/suite-session-lifecycle.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
