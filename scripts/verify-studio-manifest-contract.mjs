#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const consumer=JSON.parse(fs.readFileSync(path.join(root,'ghrab-platform.consumer.json'),'utf8'));
const file=path.join(root,'dist','studio-manifest.json');
if(!fs.existsSync(file)){console.error('MANIFEST CONTRACT FAIL: chybi dist/studio-manifest.json');process.exit(1)}
const m=JSON.parse(fs.readFileSync(file,'utf8')),p=m.platform||{};
const checks={
 schema:m.schema==='ai-studio-app-manifest-v1', appId:m.id===consumer.appId, version:m.version===pkg.version,
 repository:String(m.repository||'').toLowerCase()==='daniel22-dev/diferenciator',
 platformSchema:p.schema==='ghrab-platform-app-integration-v1', contract:p.contract==='ghrab-platform-v1',
 platformVersion:p.platformVersion===consumer.platform.version, requiredPlatformRange:p.requiredPlatformRange===consumer.platform.requiredRange,
 brandVersion:p.brandVersion===consumer.brand.version, themeContract:p.themeContract==='ghrab-theme-v1', swContract:p.swContract===1,
 studioBridge:p.studioBridge===2, artifactEnvelope:p.artifactEnvelope===1,
 storagePrefix:p.storagePrefix===`ghrab.${consumer.appId}.`, cacheName:p.cacheName===`ghrab-${consumer.appId}-v${pkg.version}`,
 compatibilityRange:m.compatibility?.platformRange===consumer.platform.requiredRange, compatibilityBridge:m.compatibility?.studioBridge==='2.0'
};
const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([id])=>id);
console[failed.length?'error':'log'](JSON.stringify({schema:'ghrab-studio-manifest-contract-regression-v1',status:failed.length?'FAIL':'PASS',appId:m.id,version:m.version,checks,failed},null,2));
if(failed.length)process.exit(1);
