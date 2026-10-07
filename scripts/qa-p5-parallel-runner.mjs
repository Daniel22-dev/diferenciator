#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT=path.resolve('.');
const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
const npmCommand=process.platform==='win32'?'npm.cmd':'npm';

const lanes=[
  {
    id:'browser-functional',
    scripts:[
      'qa:browser',
      'qa:visuals',
      'qa:scan',
      'qa:stem',
      'qa:all-subjects:browser',
      'qa:office-rich',
      'qa:multimedia',
      'qa:multimedia:browser',
      'qa:specialists',
      'qa:renderers'
    ]
  },
  {
    id:'runtime-a11y',
    scripts:['qa:runtime','qa:axe']
  },
  {
    id:'security-static',
    scripts:['qa:xss']
  }
];

function runScript(laneId,script){
  return new Promise(resolve=>{
    const startedAt=new Date().toISOString();
    const started=Date.now();
    console.log(`[P5:${laneId}] START npm run ${script}`);
    const child=spawn(npmCommand,['run',script],{cwd:ROOT,env:process.env,stdio:'inherit'});
    let settled=false;
    const finish=(data)=>{
      if(settled)return;
      settled=true;
      const durationMs=Date.now()-started;
      const pass=data.exitCode===0&&!data.error;
      console.log(`[P5:${laneId}] ${pass?'PASS':'FAIL'} npm run ${script} (${durationMs} ms)`);
      resolve({script,startedAt,durationMs,pass,...data});
    };
    child.once('error',error=>finish({exitCode:null,signal:null,error:String(error?.message||error)}));
    child.once('close',(code,signal)=>finish({exitCode:code,signal:signal||null,error:null}));
  });
}

async function runLane(lane){
  const started=Date.now();
  const steps=[];
  for(const script of lane.scripts){
    const result=await runScript(lane.id,script);
    steps.push(result);
    if(!result.pass)break;
  }
  return {
    id:lane.id,
    pass:steps.length===lane.scripts.length&&steps.every(step=>step.pass),
    durationMs:Date.now()-started,
    steps
  };
}

const startedAt=new Date().toISOString();
const started=Date.now();
const results=await Promise.all(lanes.map(runLane));
const failed=results.filter(lane=>!lane.pass);
const report={
  schema:'ghrab-p5-parallel-lanes-v1',
  appId:'differentiator',
  appVersion:String(pkg.version||''),
  sourceCommit:process.env.GITHUB_SHA||null,
  startedAt,
  durationMs:Date.now()-started,
  status:failed.length?'FAIL':'PASS',
  summary:{total:results.length,passed:results.length-failed.length,failed:failed.length},
  lanes:results
};
const evidenceDir=path.join(ROOT,'qa-results');
fs.mkdirSync(evidenceDir,{recursive:true});
fs.writeFileSync(path.join(evidenceDir,'p5-parallel-lanes.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({schema:report.schema,status:report.status,durationMs:report.durationMs,summary:report.summary,lanes:results.map(x=>({id:x.id,pass:x.pass,durationMs:x.durationMs}))},null,2));
if(failed.length)process.exit(1);
