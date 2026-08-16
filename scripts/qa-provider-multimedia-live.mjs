#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const key=String(process.env.DPL_LIVE_GEMINI_API_KEY||process.env.GEMINI_API_KEY||'').trim();
const required=/^(1|true|yes)$/i.test(String(process.env.DPL_LIVE_REQUIRED||''));
const outDir=resolve('test-results');mkdirSync(outDir,{recursive:true});const reportPath=join(outDir,'provider-multimedia-live.json');
function models(){if(process.env.DPL_LIVE_MODELS)return process.env.DPL_LIVE_MODELS.split(',').map(x=>x.trim()).filter(Boolean);const src=readFileSync('src/runtime-config.js','utf8');const block=(src.match(/profileModels\s*:\s*\{([\s\S]*?)\}/)||[])[1]||'';return [...block.matchAll(/:\s*"([^"]+)"/g)].map(m=>m[1]).filter((x,i,a)=>a.indexOf(x)===i)}
if(!key){const r={schema:'ghrab-differentiator-provider-multimedia-live-v1',status:required?'failed':'skipped',reason:'missing-credentials',models:models(),required};writeFileSync(reportPath,JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));if(required)process.exitCode=1;process.exit();}
const tmp=resolve(`test-results/live-media-${process.pid}`);mkdirSync(tmp,{recursive:true});const wav=join(tmp,'tone.wav'),mp4=join(tmp,'clip.mp4');
try{
 execFileSync('ffmpeg',['-loglevel','error','-f','lavfi','-i','sine=frequency=880:duration=0.7','-ar','16000','-ac','1','-y',wav]);
 execFileSync('ffmpeg',['-loglevel','error','-f','lavfi','-i','color=c=blue:s=160x120:d=0.8','-vf',"drawtext=text='GHRAB 27':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=22:fontcolor=white",'-r','2','-pix_fmt','yuv420p','-y',mp4]);
 const assets=[{kind:'audio',mime:'audio/wav',path:wav,prompt:'This is a provider capability smoke test. Confirm in one short sentence that you can process the attached audio.'},{kind:'video',mime:'video/mp4',path:mp4,prompt:'This is a provider capability smoke test. Read any visible text in the short video and answer in one short sentence.'}];
 const results=[];
 for(const model of models())for(const a of assets){const data=readFileSync(a.path).toString('base64'),body={model,input:[{type:'text',text:a.prompt},{type:a.kind,data,mime_type:a.mime}]};let ok=false,status=0,reply='',error='';try{const res=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'x-goog-api-key':key,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});status=res.status;const txt=await res.text();if(res.ok){const parsed=JSON.parse(txt);reply=String(parsed.output_text||parsed.outputs?.map(x=>x.text||'').join(' ')||parsed.steps?.flatMap(x=>x.content||[]).map(x=>x.text||'').join(' ')||'').trim();ok=reply.length>0}else error=txt.slice(0,600)}catch(e){error=String(e?.message||e)}results.push({model,kind:a.kind,ok,status,reply:reply.slice(0,300),error})}
 const ok=results.length>0&&results.every(x=>x.ok),r={schema:'ghrab-differentiator-provider-multimedia-live-v1',status:ok?'passed':'failed',required,results};writeFileSync(reportPath,JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));if(!ok)process.exitCode=1;
}finally{rmSync(tmp,{recursive:true,force:true})}
