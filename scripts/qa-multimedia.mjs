#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {detectMultimediaFile,prepareMultimediaFile} from '../src/modules/multimedia.js';
const checks=[];const check=(name,ok,detail='')=>checks.push({name,ok:!!ok,detail:String(detail||'')});
const appError=(message,code)=>Object.assign(new Error(message),{code});
const deps={maxBytes:12*1024*1024,maxInlineBytes:18*1024*1024,makeAppError:appError,humanBytes:n=>String(n)+' B',fileToBase64:async f=>f._b64||'AQID'};
for(const [name,type,kind] of [['listen.mp3','audio/mpeg','audio'],['listen.wav','','audio'],['clip.m4a','','audio'],['movie.mp4','video/mp4','video'],['movie.webm','video/webm','video'],['movie.mov','','video']])check('detect '+name,detectMultimediaFile({name,type})?.kind===kind);
check('reject unrelated',detectMultimediaFile({name:'paper.pdf',type:'application/pdf'})===null);
const prepared=await prepareMultimediaFile({name:'listen.mp3',type:'audio/mpeg',size:3,_b64:'AQID'},deps);check('prepare audio',prepared?.kind==='audio'&&prepared.mime_type==='audio/mpeg'&&prepared.data==='AQID'&&prepared.compressed===false);
let sourceTooLarge=false;try{await prepareMultimediaFile({name:'huge.mp4',type:'video/mp4',size:deps.maxBytes+1},deps)}catch(e){sourceTooLarge=e.code==='FILE_TOO_LARGE'}check('source size bound',sourceTooLarge);
let inlineTooLarge=false;try{await prepareMultimediaFile({name:'encoded.wav',type:'audio/wav',size:4,_b64:'x'.repeat(deps.maxInlineBytes+1)},deps)}catch(e){inlineTooLarge=e.code==='REQUEST_TOO_LARGE'}check('inline size bound',inlineTooLarge);
const api=readFileSync('src/js/30-api-gemini.js','utf8'),out=readFileSync('src/js/40-vystup-pdf-kvalita.js','utf8'),projects=readFileSync('src/js/20-zaklad-ui-projekty.js','utf8'),ops=JSON.parse(readFileSync('src/ai-operations.json','utf8'));
check('student marker protocol',api.includes('[[MEDIA_SOURCE]]')&&api.includes('ensureMediaSourceMarker'));
check('transcript leak guard',out.includes('MEDIA_TRANSCRIPT_LEAK')&&api.includes('mediaStudentSafetyIssues'));
check('teacher-side media parts',api.includes('sheetMediaAiParts')&&out.includes('...sheetMediaAiParts(sheet)'));
check('print/PDF media callout',api.includes('mediaSourceHtml')&&out.includes('mediaSource'));
check('project media persistence',projects.includes('sourceMedia:cloneMediaSource(sourceMediaAsset,true)')&&projects.includes('normalizeProjectMediaSource'));
check('rollback preserves prior media',api.includes('mediaSource:cloneMediaSource(sourceMediaAsset,true)')&&api.includes('sourceMediaAsset=cloneMediaSource(previous.mediaSource,true)'));
for(const name of ['answer-key-generation','worksheet-quality-audit','worksheet-quality-revision']){const op=ops.operations?.find?.(x=>x.operation===name)||ops.find?.(x=>x.operation===name);check(name+' accepts document',Array.isArray(op?.inputTypes)&&op.inputTypes.includes('document'))}
const failed=checks.filter(x=>!x.ok);console.log(JSON.stringify({schema:'ghrab-differentiator-multimedia-qa-v1',checks,total:checks.length,passed:checks.length-failed.length,failed:failed.length,status:failed.length?'failed':'passed'},null,2));if(failed.length)process.exitCode=1;
