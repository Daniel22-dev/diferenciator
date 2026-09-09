#!/usr/bin/env node
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import {spawnSync} from 'node:child_process';
const root=process.cwd(), checker=path.join(root,'security/garp25/tools/check-sw-security-freeze.mjs'), list=path.join(root,'security/security-critical-assets.json');
const deploy=path.join(root,'dist-school-server'), sw=path.join(deploy,'sw.js');
function run(swPath){return spawnSync(process.execPath,[checker,swPath,deploy,list],{encoding:'utf8'})}
const base=run(sw); const cases=[{id:'baseline',pass:base.status===0,exit:base.status}];
const raw=fs.readFileSync(sw,'utf8'); const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dpl-garp25-sw-'));
try{
  const p1=path.join(tmp,'sw-precache-critical.js'); fs.writeFileSync(p1,raw.replace('const CORE_ASSETS = [','const CORE_ASSETS = [\n  "./ghrab/ghrab-platform.js",'));
  const r1=run(p1); cases.push({id:'GHNC-SW-PRECACHE-CRITICAL',pass:r1.status!==0,exit:r1.status});
  const p2=path.join(tmp,'sw-no-structural-guard.js'); fs.writeFileSync(p2,raw.replaceAll('isSecurityCriticalRequest','isSecurityCriticalRequest_MUTATED'));
  const r2=run(p2); cases.push({id:'GHNC-SW-GUARD-REMOVED',pass:r2.status!==0,exit:r2.status});
  const p3=path.join(tmp,'sw-guard-behavior-false.js');
  const mutated=raw
    .replaceAll("relative === 'runtime-config.js'", "relative === './runtime-config.js'")
    .replaceAll("relative === 'config/deployment.json'", "relative === './config/deployment.json'")
    .replaceAll("relative === 'config/deployment.school-server.json'", "relative === './config/deployment.school-server.json'")
    .replaceAll("relative === 'access/deployment-config.js'", "relative === './access/deployment-config.js'")
    .replaceAll("relative === 'ghrab/ghrab-platform.js'", "relative === './ghrab/ghrab-platform.js'")
    .replaceAll("relative === 'release-integrity.json'", "relative === './release-integrity.json'")
    .replaceAll("relative === 'release-integrity.sig'", "relative === './release-integrity.sig'")
    .replaceAll("relative === 'integrity-status.json'", "relative === './integrity-status.json'")
    .replaceAll("relative.endsWith('/app-guard.js')", "relative.endsWith('./app-guard.js')")
    .replaceAll("relative.endsWith('/access-control.js')", "relative.endsWith('./access-control.js')")
    .replaceAll("relative.endsWith('/revoked-access.json')", "relative.endsWith('./revoked-access.json')");
  fs.writeFileSync(p3,mutated);
  const r3=run(p3); cases.push({id:'GHNC-SW-GUARD-BEHAVIOR-FALSE',pass:r3.status!==0,exit:r3.status});
  const p4=path.join(tmp,'sw-guard-negated.js');
  const negated=raw.replace('if (isSecurityCriticalRequest(url, scopePath)) {','if (!isSecurityCriticalRequest(url, scopePath)) {');
  fs.writeFileSync(p4,negated);
  const r4=run(p4); cases.push({id:'GHNC-SW-GUARD-NEGATED',pass:r4.status!==0,exit:r4.status});
  const p5=path.join(tmp,'sw-guard-no-respond.js');
  const noRespond=raw.replace(
    "  if (isSecurityCriticalRequest(url, scopePath)) {\n    event.respondWith(networkOnlyNoStore(request));\n    return;\n  }",
    "  if (isSecurityCriticalRequest(url, scopePath)) {\n    networkOnlyNoStore(request);\n  }"
  );
  fs.writeFileSync(p5,noRespond);
  const r5=run(p5); cases.push({id:'GHNC-SW-GUARD-NO-RESPOND',pass:r5.status!==0,exit:r5.status});
  const p6=path.join(tmp,'sw-pre-guard-respond.js');
  const preGuardRespond=raw.replace(
    "  if (isSecurityCriticalRequest(url, scopePath)) {",
    "  if (request.destination === 'script') { event.respondWith(networkFirst(request)); return; }\n  if (isSecurityCriticalRequest(url, scopePath)) {"
  );
  fs.writeFileSync(p6,preGuardRespond);
  const r6=run(p6); cases.push({id:'GHNC-SW-PRE-GUARD-RESPOND',pass:r6.status!==0,exit:r6.status});
  const p7=path.join(tmp,'sw-sink-no-no-store.js');
  const sinkNoStore=raw.replace("return fetch(request, { cache: 'no-store' });","return fetch(request);");
  fs.writeFileSync(p7,sinkNoStore);
  const r7=run(p7); cases.push({id:'GHNC-SW-SINK-NO-STORE',pass:r7.status!==0,exit:r7.status});
  const p8=path.join(tmp,'sw-sink-caches.js');
  const sinkCaches=raw.replace(
    "async function networkOnlyNoStore(request) {\n  return fetch(request, { cache: 'no-store' });\n}",
    "async function networkOnlyNoStore(request) {\n  const cache = await caches.open(CACHE_NAME);\n  const response = await fetch(request, { cache: 'no-store' });\n  await cache.put(request, response.clone());\n  return response;\n}"
  );
  fs.writeFileSync(p8,sinkCaches);
  const r8=run(p8); cases.push({id:'GHNC-SW-SINK-CACHES',pass:r8.status!==0 && /CRITICAL/.test((r8.stdout||'')+(r8.stderr||'')),exit:r8.status});
  const p9=path.join(tmp,'sw-pre-guard-effect.js');
  const preGuardEffect=raw.replace(
    "  if (isSecurityCriticalRequest(url, scopePath)) {",
    `  networkFirst(request);\n  if (isSecurityCriticalRequest(url, scopePath)) {`
  );
  fs.writeFileSync(p9,preGuardEffect);
  const r9=run(p9); cases.push({id:'GHNC-SW-PRE-GUARD-EFFECT',pass:r9.status!==0,exit:r9.status});
  const p10=path.join(tmp,'sw-multiple-fetch-handlers.js');
  const multipleFetchHandlers=raw+`\nself['addEventListener']('fetch', event => { networkFirst(event.request); });\n`;
  fs.writeFileSync(p10,multipleFetchHandlers);
  const r10=run(p10); cases.push({id:'GHNC-SW-MULTIPLE-FETCH-HANDLERS',pass:r10.status!==0,exit:r10.status});
  const p11=path.join(tmp,'sw-pre-guard-async-effect.js');
  const asyncEffect=raw.replace(
    "  if (isSecurityCriticalRequest(url, scopePath)) {",
    "  Promise.resolve().then(() => networkFirst(request));\n  if (isSecurityCriticalRequest(url, scopePath)) {"
  );
  fs.writeFileSync(p11,asyncEffect);
  const r11=run(p11); cases.push({id:'GHNC-SW-PRE-GUARD-ASYNC-EFFECT',pass:r11.status!==0,exit:r11.status});
  const p12=path.join(tmp,'sw-critical-branch-side-effect.js');
  const criticalBranchEffect=raw.replace(
    "  if (isSecurityCriticalRequest(url, scopePath)) {\n    event.respondWith(networkOnlyNoStore(request));",
    "  if (isSecurityCriticalRequest(url, scopePath)) {\n    networkFirst(request);\n    event.respondWith(networkOnlyNoStore(request));"
  );
  fs.writeFileSync(p12,criticalBranchEffect);
  const r12=run(p12); cases.push({id:'GHNC-SW-CRITICAL-BRANCH-SIDE-EFFECT',pass:r12.status!==0,exit:r12.status});
  const p13=path.join(tmp,'sw-critical-branch-async-source.js');
  const criticalAsyncSource=raw.replace(
    "  if (isSecurityCriticalRequest(url, scopePath)) {\n    event.respondWith(networkOnlyNoStore(request));",
    "  if (isSecurityCriticalRequest(url, scopePath)) {\n    event.preloadResponse.then(() => networkFirst(request));\n    event.respondWith(networkOnlyNoStore(request));"
  );
  fs.writeFileSync(p13,criticalAsyncSource);
  const r13=run(p13); cases.push({id:'GHNC-SW-CRITICAL-BRANCH-ASYNC-SOURCE',pass:r13.status!==0,exit:r13.status});
} finally {fs.rmSync(tmp,{recursive:true,force:true})}
const ok=cases.every(c=>c.pass); console[ok?'log':'error'](JSON.stringify({status:ok?'PASS':'FAIL',cases},null,2));process.exit(ok?0:1);
