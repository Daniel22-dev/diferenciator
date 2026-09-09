#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=process.cwd(); const out='security/evidence/ai-assurance-fingerprint.json'; const inventoryPath='security/ai-boundary-files.json'; const check=process.argv.includes('--check');
const tokens=/GHRAB_AI|dplData\s*\(|callGemini|school-gateway|direct-gemini|systemInstruction|system_instruction|prompt|aiTransport|wrapUntrusted|AIR-/i;
function walk(dir){if(!fs.existsSync(dir))return[];let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else if(e.isFile())out.push(p)}return out}
function norm(p){return String(p).replaceAll('\\','/').replace(/^\.\//,'')}
function loadInventory(){
  if(!fs.existsSync(inventoryPath)) throw new Error('ai-boundary-inventory-missing');
  const parsed=JSON.parse(fs.readFileSync(inventoryPath,'utf8'));
  if(!Array.isArray(parsed)||!parsed.length||parsed.some(x=>typeof x!=='string'||!x.trim())) throw new Error('ai-boundary-inventory-invalid');
  const rows=[...new Set(parsed.map(norm))].sort();
  if(rows.length!==parsed.length) throw new Error('ai-boundary-inventory-duplicates');
  return rows;
}
const inventory=loadInventory();
const candidatePool=[...walk('src/js'),...walk('src/config'),'src/runtime-config.js','src/runtime-config.school-server.js','src/ai-operations.json','ghrab-ai-core.consumer.json',...walk('vendor/ghrab-ai-core-1.0.0')].filter(p=>fs.existsSync(p)).map(norm);
const detected=[...new Set(candidatePool.filter(p=>{try{return tokens.test(fs.readFileSync(p,'utf8'))}catch{return false}}))].sort();
const missing=inventory.filter(p=>!fs.existsSync(p));
const untracked=detected.filter(p=>!inventory.includes(p));
if(missing.length||untracked.length){
  console.error(JSON.stringify({status:'FAIL',error:'ai-boundary-inventory-drift',missing,untracked,inventoryFiles:inventory.length,detectedCandidates:detected.length},null,2));process.exit(1);
}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rows=inventory.map(p=>({path:p,sha256:sha(fs.readFileSync(p))}));
const aggregate=sha(Buffer.from(rows.map(r=>`${r.sha256}  ${r.path}`).join('\n')+'\n'));
const obj={schema:'ghrab-ai-assurance-fingerprint-v2',appId:'differentiator',appVersion:JSON.parse(fs.readFileSync('package.json','utf8')).version,algorithm:'SHA-256',inventory:inventoryPath,aggregate,files:rows};
if(check){if(!fs.existsSync(out)){console.error(JSON.stringify({status:'FAIL',error:'fingerprint-missing'}));process.exit(1)}const prev=JSON.parse(fs.readFileSync(out,'utf8'));const ok=prev.schema===obj.schema&&prev.inventory===inventoryPath&&prev.appVersion===obj.appVersion&&prev.aggregate===obj.aggregate&&JSON.stringify(prev.files)===JSON.stringify(obj.files);console[ok?'log':'error'](JSON.stringify({status:ok?'PASS':'FAIL',files:rows.length,detectedCandidates:detected.length,untracked,aggregate,expected:prev.aggregate,schema:obj.schema},null,2));process.exit(ok?0:1)}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(obj,null,2)+'\n');console.log(JSON.stringify({status:'PASS',output:out,files:rows.length,detectedCandidates:detected.length,untracked,aggregate,schema:obj.schema},null,2));
