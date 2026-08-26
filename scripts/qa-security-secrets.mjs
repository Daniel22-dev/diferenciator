#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
const root=process.cwd();
const roots=['.github','src','scripts','config','dist','dist-school-server'];
const textExt=new Set(['.js','.mjs','.cjs','.json','.html','.md','.yml','.yaml','.txt','.env','.webmanifest','.gz']);
const MAX_GZIP_SCAN_BYTES=16*1024*1024;
const skipNames=new Set(['node_modules','.git']);
const findings=[];
const patterns=[
  ['provider-api-key',/(?:\bsk-[A-Za-z0-9_-]{20,}\b|\bAIza[0-9A-Za-z_-]{25,}\b|\bgh[pousr]_[A-Za-z0-9]{30,}\b)/],
  ['private-key-block',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['jwt-token',/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
  ['private-jwk-d',/["']d["']\s*:\s*["'][A-Za-z0-9_-]{20,}["']/]
];
function walk(dir){if(!fs.existsSync(dir))return;for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(skipNames.has(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile()&&textExt.has(path.extname(ent.name).toLowerCase()))scan(p)}}
function scan(file){let text;try{if(path.extname(file).toLowerCase()==='.gz'){const out=gunzipSync(fs.readFileSync(file),{maxOutputLength:MAX_GZIP_SCAN_BYTES});text=out.toString('utf8')}else{text=fs.readFileSync(file,'utf8')}}catch{findings.push({kind:'unscannable-artifact',file:path.relative(root,file)});return}for(const [kind,re] of patterns)if(re.test(text))findings.push({kind,file:path.relative(root,file)})}
for(const rel of roots)walk(path.join(root,rel));
for(const name of ['package.json','package-lock.json','README.md','CHANGELOG.md','ghrab-ai-core.consumer.json','ghrab-platform.consumer.json']){const p=path.join(root,name);if(fs.existsSync(p))scan(p)}
for(const ent of fs.readdirSync(root,{withFileTypes:true})){if(ent.isFile()&&(ent.name==='.env'||ent.name.startsWith('.env.')))scan(path.join(root,ent.name))}
if(findings.length){console.error(JSON.stringify({schema:'ghrab-secret-scan-v1',status:'failed',findings},null,2));process.exit(1)}
console.log(JSON.stringify({schema:'ghrab-secret-scan-v1',status:'passed',scannedRoots:roots},null,2));
