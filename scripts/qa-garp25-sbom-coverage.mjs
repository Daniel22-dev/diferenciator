#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const sbomPath=process.argv[2]||`security/sbom/differentiator-${pkg.version}.cdx.json`;
if(!fs.existsSync(sbomPath)){console.error(JSON.stringify({status:'FAIL',error:'sbom-missing',sbomPath},null,2));process.exit(1)}
const sbom=JSON.parse(fs.readFileSync(sbomPath,'utf8')); const components=sbom.components||[]; const errors=[];
function expectedName(lockPath,meta){if(meta?.name)return meta.name;const marker='node_modules/';const i=lockPath.lastIndexOf(marker);if(i<0)return pkg.name;const parts=lockPath.slice(i+marker.length).split('/').filter(Boolean);return parts[0]?.startsWith('@')?`${parts[0]}/${parts[1]}`:parts[0]}
const byPath=new Map(); for(const c of components){const rel=c.properties?.find(p=>p.name==='ghrab:lockfilePath')?.value;if(!rel){errors.push(`component-without-lockfilePath:${c.purl||c.name}`);continue;}if(byPath.has(rel))errors.push(`duplicate-lockfilePath:${rel}`);byPath.set(rel,c)}
let expected=0;
for(const [lockPath,meta] of Object.entries(lock.packages||{})){
  if(!lockPath||!lockPath.startsWith('node_modules/')||!meta?.version)continue; expected++;
  const c=byPath.get(lockPath); if(!c){errors.push(`missing:${lockPath}`);continue;}
  const name=expectedName(lockPath,meta); if(c.name!==name)errors.push(`name:${lockPath}:${c.name}:${name}`); if(c.version!==String(meta.version))errors.push(`version:${lockPath}:${c.version}:${meta.version}`);
  const purl=`pkg:npm/${encodeURIComponent(name).replace('%40','@').replace('%2F','%2F')}@${meta.version}`; if(c.purl!==purl)errors.push(`purl:${lockPath}:${c.purl}:${purl}`);
}
for(const rel of byPath.keys())if(!lock.packages?.[rel]?.version)errors.push(`unexpected:${rel}`);
const uniquePurl=new Set(components.map(c=>c.purl)); if(uniquePurl.size!==components.length)errors.push('duplicate-purl');
const rrweb08=components.find(c=>c.name==='rrweb-cssom'&&c.version==='0.8.0'); if(!rrweb08)errors.push('rrweb-cssom@0.8.0-missing');
const fakeCss=components.find(c=>c.name==='cssstyle'&&c.version==='0.8.0'); if(fakeCss)errors.push('phantom-cssstyle@0.8.0-present');
const out={status:errors.length?'FAIL':'PASS',sbomPath,expectedLockPackages:expected,components:components.length,uniquePurl:uniquePurl.size,rrwebCssom08:Boolean(rrweb08),phantomCssstyle08:Boolean(fakeCss),errors};
console[errors.length?'error':'log'](JSON.stringify(out,null,2));process.exit(errors.length?1:0);
