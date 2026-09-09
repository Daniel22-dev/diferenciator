#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const outArg=process.argv[2]||`security/sbom/differentiator-${JSON.parse(fs.readFileSync('package.json','utf8')).version}.cdx.json`;
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
function nameFromPath(p,meta){
  if(meta?.name) return meta.name;
  const marker='node_modules/';
  const raw=String(p); const idx=raw.lastIndexOf(marker); if(idx<0) return pkg.name;
  const tail=raw.slice(idx+marker.length); const parts=tail.split('/').filter(Boolean);
  return parts[0]?.startsWith('@')?`${parts[0]}/${parts[1]}`:parts[0];
}
const pathParserSelftest=[
  ['node_modules/cssstyle/node_modules/rrweb-cssom',{},'rrweb-cssom'],
  ['node_modules/@scope/pkg',{},'@scope/pkg'],
  ['node_modules/a/node_modules/@scope/pkg',{},'@scope/pkg']
];
for(const [fixture,meta,expected] of pathParserSelftest){
  const actual=nameFromPath(fixture,meta); if(actual!==expected){
    console.error(JSON.stringify({status:'FAIL',error:'sbom-nameFromPath-selftest',fixture,expected,actual},null,2)); process.exit(1);
  }
}
function hashFromSri(sri){
  if(!sri) return [];
  const first=String(sri).split(/\s+/)[0]; const m=first.match(/^(sha(?:256|384|512))-(.+)$/i); if(!m)return [];
  try{return [{alg:m[1].toUpperCase().replace('SHA','SHA-'),content:Buffer.from(m[2],'base64').toString('hex')}]}catch{return []}
}
const components=[];
for(const [p,m] of Object.entries(lock.packages||{})){
  if(!p||!p.startsWith('node_modules/')||!m?.version) continue;
  const name=nameFromPath(p,m); const scope=pkg.devDependencies?.[name]?'optional':'required';
  const purl=`pkg:npm/${encodeURIComponent(name).replace('%40','@').replace('%2F','%2F')}@${m.version}`;
  components.push({type:'library',name,version:String(m.version),purl,scope,hashes:hashFromSri(m.integrity),properties:[{name:'ghrab:lockfilePath',value:p}]});
}
components.sort((a,b)=>a.purl.localeCompare(b.purl,'en'));
const uniquePurl=new Set(components.map(x=>x.purl));
if(uniquePurl.size!==components.length){
  const seen=new Set(),duplicates=[]; for(const c of components){if(seen.has(c.purl)) duplicates.push(c.purl); else seen.add(c.purl)}
  console.error(JSON.stringify({status:'FAIL',error:'duplicate-purl',duplicates},null,2)); process.exit(1);
}
const nestedRrweb=components.find(c=>c.properties?.some(p=>p.name==='ghrab:lockfilePath'&&p.value==='node_modules/cssstyle/node_modules/rrweb-cssom'));
if(lock.packages?.['node_modules/cssstyle/node_modules/rrweb-cssom']?.version && (!nestedRrweb || nestedRrweb.name!=='rrweb-cssom')){
  console.error(JSON.stringify({status:'FAIL',error:'nested-node_modules-name-mismatch',actual:nestedRrweb||null},null,2)); process.exit(1);
}
const bom={bomFormat:'CycloneDX',specVersion:'1.5',serialNumber:`urn:uuid:${crypto.randomUUID()}`,version:1,metadata:{timestamp:new Date().toISOString(),component:{type:'application',name:pkg.name,version:pkg.version}},components};
fs.mkdirSync(path.dirname(outArg),{recursive:true}); fs.writeFileSync(outArg,JSON.stringify(bom,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',output:outArg,components:components.length,uniquePurl:uniquePurl.size,withHashes:components.filter(x=>x.hashes.length).length},null,2));
