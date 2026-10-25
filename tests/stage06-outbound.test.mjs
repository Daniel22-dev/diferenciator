import test from 'node:test';
import assert from 'node:assert/strict';
import {mapSelectedWorksheet,trustedStudioRoot,Stage06MaterialError} from '../src/modules/stage06-outbound-material.js';
const item=()=>({
 form:{subject:'English',meta:{topic:'Environment',subject:'English',className:'2.B'},advanced:{learningGoal:'Compare solutions'}},
 sheet:{_tierKey:'core',_text:'Read and answer: Why recycle?',_cefrLabel:'B1',_parts:{title:'Environment',tasks:'Why recycle?',answerKey:'Secret correct answer',teacherNote:'Private note'},_key:'Extra secret',_visualAssets:[],_mediaSource:null},
 id:'dif-a1b2c3',now:'2026-10-25T06:40:00Z',appVersion:'1.3.51',privacyConfirmed:true,
});
const expectCode=(mut,code)=>{const x=item();mut(x);assert.throws(()=>mapSelectedWorksheet(x),e=>e instanceof Stage06MaterialError&&e.code===code)};
test('minimal canonical Material v1 preserves student-facing worksheet only',()=>{
 const m=mapSelectedWorksheet(item());assert.equal(m.schema,'ghrab-material-v1');assert.equal(m.version,1);
 assert.equal(m.quality.status,'ai-draft');assert.equal(m.provenance.containsPersonalData,false);
 assert.equal(m.level,'B1');assert.equal(m.yearGroup,'2.B');assert.deepEqual(m.objectives,['Compare solutions']);
 assert.deepEqual(m.content.tasks,[]);assert.equal(m.content.sourceText,item().sheet._text);
 assert.ok(!JSON.stringify(m).includes('Secret correct answer'));assert.ok(!JSON.stringify(m).includes('Private note'));
});
test('source selection never serializes API keys, telemetry, grading and answer keys',()=>{
 const x=item();x.form.apiKey='INTERNAL_KEY';x.form.session={user:'teacher@example.com'};
 x.sheet._rawResponse='untrusted';x.sheet._key='SECRET ANSWER';x.sheet._quality='debug';
 const m=mapSelectedWorksheet(x),raw=JSON.stringify(m);for(const s of ['INTERNAL_KEY','teacher@example.com','SECRET ANSWER','untrusted','debug'])assert.ok(!raw.includes(s),s);
});
test('privacy confirmation is mandatory',()=>expectCode(x=>x.privacyConfirmed=false,'ANONYMITY_NOT_CONFIRMED'));
test('source text must be already generated and nonempty',()=>expectCode(x=>x.sheet._text='','NO_GENERATED_TEXT'));
test('no generated multiple-choice questions or answer indexes',()=>{const x=item();x.sheet._parts.tasks='1. question [A B C]';let m=mapSelectedWorksheet(x);assert.deepEqual(m.content.tasks,[]);});
test('each worksheet exported individually',()=>{const x=item();x.sheet._tierKey='support';let a=mapSelectedWorksheet(x);x.sheet._tierKey='extend';x.sheet._text='Harder work';let b=mapSelectedWorksheet(x);assert.notEqual(a.title,b.title);assert.equal(b.content.sourceText,'Harder work');});
test('media cannot be silently dropped',()=>{
 expectCode(x=>x.sheet._visualAssets=[{id:'VISUAL_1'}],'NONPORTABLE_MEDIA');
 expectCode(x=>x.sheet._mediaSource={kind:'audio'},'NONPORTABLE_MEDIA');
 expectCode(x=>x.sheet._text='Look at [[VISUAL_1]]','NONPORTABLE_MEDIA');
 expectCode(x=>x.sheet._text='Listen to [[MEDIA_SOURCE]]','NONPORTABLE_MEDIA');
 expectCode(x=>x.sheet._text='![map](https://x.test/map.png)','NONPORTABLE_MEDIA');
});
test('email and active markup fail closed',()=>{
 expectCode(x=>x.sheet._text='Email pupil@example.com','PRIVATE_OR_ACTIVE_CONTENT');
 expectCode(x=>x.sheet._text='<img src=x onerror=alert(1)>','PRIVATE_OR_ACTIVE_CONTENT');
 expectCode(x=>x.form.meta.topic='javascript:alert(1)','PRIVATE_OR_ACTIVE_CONTENT');
});
test('no oversize or invalid identity',()=>{
 expectCode(x=>x.sheet._text='X'.repeat(180001),'MATERIAL_OVERSIZED');
 expectCode(x=>x.form.meta.topic='X'.repeat(241),'MATERIAL_OVERSIZED');
 expectCode(x=>x.form.advanced.learningGoal='X'.repeat(801),'MATERIAL_OVERSIZED');
 expectCode(x=>x.id='Upper Case','MATERIAL_ID');
 expectCode(x=>x.appVersion='unknown','APP_VERSION');
});
test('missing pedagogy is rejected',()=>expectCode(x=>{x.form.meta.topic='';x.sheet._parts.title='';},'MISSING_METADATA'));
test('whitelisted trusted Studio roots only; no direct application routes',()=>{
 const here='https://daniel22-dev.github.io/diferenciator/';
 assert.equal(trustedStudioRoot('/AI-Studio-GHRAB/',here),'https://daniel22-dev.github.io/AI-Studio-GHRAB/');
 assert.equal(trustedStudioRoot('/ai-studio/',here),'https://daniel22-dev.github.io/ai-studio/');
 for(const u of ['https://bad.example/AI-Studio-GHRAB/','/Ludus/','/generator-testu/','/AI-Studio-GHRAB/?redirect=x','http://daniel22-dev.github.io/AI-Studio-GHRAB/'])
   assert.throws(()=>trustedStudioRoot(u,here),Stage06MaterialError);
});
test('localhost development transport can be tested, but never arbitrary http production',()=>{
 assert.equal(trustedStudioRoot('/AI-Studio-GHRAB/','http://localhost:3000/diferenciator/'),'http://localhost:3000/AI-Studio-GHRAB/');
 assert.throws(()=>trustedStudioRoot('/AI-Studio-GHRAB/','http://evil.example/diferenciator/'),Stage06MaterialError);
});
