#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd(),read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const expected=['economy','balanced','quality'],checks=[];
const check=(id,ok,detail='')=>checks.push({id,ok:Boolean(ok),detail:String(detail||'')});
function runtimeConfig(rel){const sandbox={window:{}};vm.runInNewContext(read(rel),sandbox,{filename:rel});return sandbox.window.__GHRAB_RUNTIME_CONFIG__;}
const body=read('src/body.html'),api=read('src/js/30-api-gemini.js'),integration=read('src/js/31-ai-core-integration.js'),index=read('src/index.template.html');
const operations=JSON.parse(read('src/ai-operations.json')),direct=runtimeConfig('src/runtime-config.js'),school=runtimeConfig('src/runtime-config.school-server.js'),schoolBuild=read('scripts/build-school-profile.mjs');
const uiProfiles=[...body.matchAll(/data-model-profile="([^"]+)"/g)].map(m=>m[1]);
check('ui.exact-three-profiles',JSON.stringify(uiProfiles)===JSON.stringify(expected),uiProfiles.join(','));
check('ui.provider-neutral',!/gemini-[0-9]|modelOverride|id="modelInput"/i.test(body),'no provider model IDs/free model input');
check('ui.shared-school-direct',body.includes('id="directGeminiSettings"')&&body.indexOf('data-model-profile="economy"')>body.indexOf('id="directGeminiSettings"'),'shared profile controls follow provider-specific key block');
check('state.profile-only',api.includes('selectedModelProfile')&&api.includes('MODEL_PROFILE_DEFAULT="balanced"')&&!/const MODEL_DEFAULT=|FALLBACK_MODELS|geminiModel/.test(api),'provider-neutral state');
check('integration.no-model-override',!integration.includes('modelOverride')&&!/gemini-[0-9]/i.test(integration),'Core chooses provider model from runtime profile map');
check('api.request-uses-selected-profile',integration.includes('dplModelProfile(operation)')&&api.includes('setModelProfile'),'selected profile reaches request');
check('api.legacy-migration-only',api.includes('migrateStoredModelProfile')&&api.includes('flash-lite')&&api.includes('gemini-3.5-flash')&&api.includes('"economy"')&&api.includes('"quality"'),'legacy provider IDs migrate to profiles');
const badOps=(operations.operations||[]).filter(op=>JSON.stringify(op.allowedModelProfiles||[])!==JSON.stringify(expected)).map(op=>`${op.operation}:${(op.allowedModelProfiles||[]).join(',')}`);
check('operations.all-three-allowed',badOps.length===0,badOps.join(' | ')||`${operations.operations?.length||0} operations`);
const directAi=direct?.ai||{},map=directAi.directGemini?.profileModels||{};
check('direct.mode',directAi.defaultMode==='direct-gemini'&&JSON.stringify(directAi.allowedModes)===JSON.stringify(['direct-gemini']),directAi.defaultMode||'');
check('direct.profile-keys',JSON.stringify(Object.keys(map))===JSON.stringify(expected),Object.keys(map).join(','));
check('direct.profile-models-distinct',new Set(expected.map(k=>map[k]).filter(Boolean)).size===3,expected.map(k=>`${k}=${map[k]||''}`).join(' | '));
check('direct.provider-is-runtime-only',expected.every(k=>/^gemini-[a-z0-9.-]+$/i.test(String(map[k]||''))),'direct runtime owns Gemini IDs');
check('direct.fallback-economy',JSON.stringify(directAi.directGemini?.fallbackModels||[])===JSON.stringify([map.economy]),'fallback uses economy profile model');
const schoolAi=school?.ai||{};
check('school.mode',schoolAi.defaultMode==='school-gateway'&&schoolAi.selectedMode==='school-gateway'&&JSON.stringify(schoolAi.allowedModes)===JSON.stringify(['school-gateway']),schoolAi.defaultMode||'');
check('school.provider-neutral',!/gemini-|openai|anthropic|modelOverride/i.test(read('src/runtime-config.school-server.js')),'no provider/model in school runtime');
check('index.loads-runtime',index.includes('<script src="./runtime-config.js" data-ghrab-runtime-config></script>'),'runtime loaded before app');
check('school.build-swaps-runtime',schoolBuild.includes('runtime-config.school-server.js')&&schoolBuild.includes('School-server runtime není provider-neutrální'),'school build activates provider-neutral runtime');
const failed=checks.filter(x=>!x.ok);
console.log(JSON.stringify({schema:'ghrab-ai-profile-gate-v1',appId:'differentiator',appVersion:operations.appVersion,expectedProfiles:expected,checks,summary:{passed:checks.length-failed.length,failed:failed.length},status:failed.length?'failed':'passed'},null,2));
if(failed.length)process.exit(1);
