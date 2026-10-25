import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script, createContext} from 'node:vm';
const src=await readFile(new URL('../src/js/26-ai-studio-outbound.js',import.meta.url),'utf8');
const make=()=>{
 const created=[]; const notifications=[];
 function button(){return {dataset:{},disabled:false,textContent:'',type:'',className:'',title:'',aria:{},listeners:new Map(),setAttribute(k,v){this.aria[k]=v},addEventListener(e,fn){this.listeners.set(e,fn)}}}
 const window={__GHRAB_STUDIO_ACCESS__:null,alert:(...a)=>notifications.push(a),confirm:()=>{throw new Error('Should not show confirm while access denied')}};
 const document={createElement:()=>{const x=button();created.push(x);return x;}};
 const sandbox=createContext({window,document,console,showMessage:(...args)=>notifications.push(args)});
 new Script(src,{filename:'26-ai-studio-outbound.js'}).runInContext(sandbox);
 return {window,created,notifications};
};
test('per-sheet export button is created only for generated text, with accessible action',()=>{
 const {window,created}=make();const container={nodes:[],querySelector:()=>null,appendChild(n){this.nodes.push(n)}};
 window.__GHRAB_STAGE06_OUTBOUND__.attach({_text:'A real worksheet',_tierKey:'support'},container);
 assert.equal(container.nodes.length,1);assert.equal(created.length,1);
 assert.equal(container.nodes[0].dataset.act,'save-to-studio');
 assert.match(container.nodes[0].aria['aria-label'],/support/);
 assert.equal(container.nodes[0].type,'button');
 window.__GHRAB_STAGE06_OUTBOUND__.attach({_text:''},container);
 assert.equal(container.nodes.length,1);
});
test('missing legitimate school permit blocks action before requesting confirmation or importing',()=>{
 const {window,notifications}=make();const container={items:[],querySelector:()=>null,appendChild(x){this.items.push(x)}};
 const sheet={_text:'Valid worksheet',_tierKey:'core',querySelector:()=>({isContentEditable:false})};
 window.__GHRAB_STAGE06_OUTBOUND__.attach(sheet,container);
 container.items[0].listeners.get('click')();
 assert.equal(notifications.length,1);assert.match(notifications[0][0],/Neověřený/);
});
test('in-progress edit prevents transferring stale text',()=>{
 const {window,notifications}=make();window.__GHRAB_STUDIO_ACCESS__={appId:'differentiator',permit:{synthetic:true}};
 const container={items:[],querySelector:()=>null,appendChild(x){this.items.push(x)}};
 const sheet={_text:'Original before edit',_tierKey:'core',querySelector:()=>({isContentEditable:true})};
 window.__GHRAB_STAGE06_OUTBOUND__.attach(sheet,container);
 container.items[0].listeners.get('click')();
 assert.match(notifications[0][0],/Dokonči úpravy/);
});
test('actual producer contract is mounted only inside protected per-sheet UI',()=>{
 assert.match(src,/window\.__GHRAB_STAGE06_OUTBOUND__=Object\.freeze\(\{attach\}\)/);
 assert.match(src,/new URL\('integration\/save-to-studio\.js',base\)/);
 assert.match(src,/sourceAppId:'differentiator'/);
 assert.doesNotMatch(src,/generator-testu|\/Ludus\//i);
 assert.doesNotMatch(src,/localStorage\.(?:setItem|removeItem)\s*\(/);
});
