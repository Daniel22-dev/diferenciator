#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
let failures=0;
const ok=m=>console.log('  ✓ '+m);
const bad=m=>{console.error('  ✗ '+m);failures++;};
const read=p=>readFileSync(join(ROOT,p),'utf8');

function walk(dir, out=[]){
  for(const name of readdirSync(dir)){
    if(name==='node_modules'||name==='dist'||name==='dist-school-server'||name==='.git')continue;
    const p=join(dir,name),st=statSync(p);
    if(st.isDirectory())walk(p,out);else out.push(p);
  }
  return out;
}

console.log('Regresní brána Diferenciátoru 1.3.16');

// T1: every direct top-level GHRAB_PLATFORM method call must exist in the shipped vendor API.
{
  const vendor=read('vendor/ghrab-platform-1.1.0/ghrab-platform.js');
  const block=vendor.match(/const api = Object\.freeze\(\{([\s\S]*?)\n\s*\}\);\n\s*\n\s*global\.GHRAB_PLATFORM = api;/)?.[1]||'';
  const exposed=new Set([...block.matchAll(/^\s{4}([A-Za-z_$][\w$]*)\s*(?=[:,])/gm)].map(m=>m[1]));
  const candidates=['src/index.template.html','src/manual/index.html',...readdirSync(join(ROOT,'src/js')).filter(x=>x.endsWith('.js')).map(x=>'src/js/'+x)];
  const calls=[];
  const rx=/(?:window\.)?GHRAB_PLATFORM\s*(?:\.|\?\.)\s*([A-Za-z_$][\w$]*)\s*(?:\?\.)?\s*\(/g;
  for(const f of candidates){for(const m of read(f).matchAll(rx))calls.push({file:f,name:m[1]});}
  const missing=calls.filter(x=>!exposed.has(x.name));
  if(missing.length)bad('T1: neexistující přímé metody platformy: '+missing.map(x=>`${x.name} (${x.file})`).join(', '));
  else ok(`T1: ${calls.length} přímých volání GHRAB_PLATFORM odpovídá vendor API`);
}

// T3: exactly one canonical consumer in the source repository.
{
  const found=walk(ROOT).filter(p=>p.endsWith('/ghrab-platform.consumer.json')||p===join(ROOT,'ghrab-platform.consumer.json'));
  if(found.length!==1||relative(ROOT,found[0])!=='ghrab-platform.consumer.json')bad('T3: consumer konfigurace: '+found.map(p=>relative(ROOT,p)).join(', '));
  else ok('T3: právě jedna kanonická ghrab-platform.consumer.json');
}

// T4: platform version/range stay aligned across the three contracts.
{
  const app=JSON.parse(read('src/config/platform-manifest.json'));
  const consumer=JSON.parse(read('ghrab-platform.consumer.json'));
  const vendor=JSON.parse(read('vendor/ghrab-platform-1.1.0/ghrab-platform-manifest-1.1.0.json'));
  const sameVersion=app.platformVersion===consumer.platform.version&&app.platformVersion===vendor.platformVersion;
  const sameRange=app.requiredPlatformRange===consumer.platform.requiredRange;
  if(!sameVersion||!sameRange)bad(`T4: rozpor platformy: app ${app.platformVersion} ${app.requiredPlatformRange}; consumer ${consumer.platform.version} ${consumer.platform.requiredRange}; vendor ${vendor.platformVersion}`);
  else ok(`T4: platforma ${app.platformVersion}, rozsah ${app.requiredPlatformRange}`);
}

// T5: HTML IDs are either wired in app code or intentionally static.
{
  const body=read('src/body.html');
  const ids=[...body.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  const code=['src/index.template.html',...readdirSync(join(ROOT,'src/js')).filter(x=>x.endsWith('.js')).map(x=>'src/js/'+x)].map(read).join('\n');
  const allow=new Set(['manualLaunch','advTargetGroupHelp','supportTypeSuggestions','advTeacherInstructionHelp']);
  const dataDrivenProfileIds=new Set(
    [...body.matchAll(/<[^>]+\bid=["']([^"']+)["'][^>]+\bdata-model-profile=["'][^"']+["'][^>]*>/g)].map(m=>m[1])
  );
  const profileDelegationWired=code.includes('[data-model-profile]');
  const unused=ids.filter(id=>!allow.has(id)&&!code.includes(id)&&!(profileDelegationWired&&dataDrivenProfileIds.has(id)));
  if(unused.length)bad('T5: nenapojená HTML ID: '+unused.join(', '));
  else ok(`T5: ${ids.length} HTML ID napojeno nebo výslovně statických`);
}

// T8: no holes within the visible 1.3.x release series.
{
  const release=read('src/js/10-release-changelog.js');
  const nums=[...release.matchAll(/["']1\.3\.(\d+):/g)].map(m=>Number(m[1]));
  const uniq=[...new Set(nums)].sort((a,b)=>b-a);
  const missing=[];
  if(uniq.length){for(let n=uniq[0];n>=uniq[uniq.length-1];n--)if(!uniq.includes(n))missing.push(n);}
  if(!uniq.length||missing.length)bad('T8: díra v RELEASE.changes 1.3.x'+(missing.length?': '+missing.map(n=>'1.3.'+n).join(', '):''));
  else ok(`T8: RELEASE.changes souvisle 1.3.${uniq[0]}–1.3.${uniq[uniq.length-1]}`);
}

// T9: user-facing differentiation rules from the 1.3.16 usability pass stay explicit and enforced.
{
  const body=read('src/body.html'),ui=read('src/js/20-zaklad-ui-projekty.js'),flow=read('src/js/60-pwa-start.js');
  const problems=[];
  if(!/prima[–-]oktáva/.test(body)||!ui.includes("tercie:{label:'tercie'"))problems.push('chybí převod prima–oktáva');
  if(!ui.includes('ZÁVAZNÝ VLASTNÍ POKYN UČITELE'))problems.push('vlastní pokyn není závazně předán');
  if(!ui.includes("core.disabled=diffOnly")||!ui.includes("if(diffOnly&&core.checked)core.checked=false"))problems.push('režim jiné obtížnosti nezneplatní Normální');
  if(body.includes('Automaticky podle vybrané úrovně'))problems.push('vrácen nejasný text automatické volby');
  if(!body.includes('Doporučeně podle cílové úrovně')||!body.includes('Řídit se režimem výše (doporučeno)'))problems.push('chybí srozumitelný název automatiky');
  if(!body.includes('supportTypeSuggestions')||!ui.includes('Preferovaný způsob podpory nebo výzvy'))problems.push('Typ podpory není vysvětlen/předán');
  if(!flow.includes('selectedSetTierKeys()'))problems.push('sada úrovní ignoruje režim jiné obtížnosti');
  if(problems.length)bad('T9: pedagogická UX pravidla: '+problems.join('; ')); else ok('T9: pedagogická UX pravidla a cílová úroveň jsou vynucené');
}

// T10: quality audit is opt-in per suggestion and obsolete secondary actions stay removed.
{
  const body=read('src/body.html'),quality=read('src/js/40-vystup-pdf-kvalita.js'),ops=JSON.parse(read('src/ai-operations.json'));
  const problems=[];
  if(!body.includes('id="qualityApply"')||!quality.includes('class="qa-choice"'))problems.push('chybí selektivní checkboxy kontroly');
  if(!quality.includes('applySelectedQualitySuggestions')||!ops.operations.some(x=>x.operation==='worksheet-quality-revision'))problems.push('chybí řízené zapracování vybraných bodů');
  const secondary=(quality.match(/secondary[\s\S]{0,1800}/)||[''])[0];
  if(/Export \.md|Regenerovat/i.test(secondary)||/function\s+regenerateSheet\b/.test(quality))problems.push('vrácen Export .md nebo Regenerovat');
  if(!quality.includes("'1. '+")||!quality.includes("'2. '+")||!quality.includes("'3. Stáhnout PDF'"))problems.push('výsledkovému postupu chybí 1./2./3.');
  if(problems.length)bad('T10: kontrola/výsledkové akce: '+problems.join('; ')); else ok('T10: kontrola je selektivní a výsledkové akce jsou zjednodušené');
}

// T11: DOCX reader must preserve embedded image exercises, not only the XML text layer.
{
  const api=read('src/js/30-api-gemini.js');
  const problems=[];
  if(!api.includes('function docxReferencedMediaPaths')||!api.includes('async function readDocxRich'))problems.push('chybí rich DOCX reader');
  if(!api.includes("kind:'mixed'")||!api.includes("uploaded&&uploaded.kind==='mixed'"))problems.push('text a obrázky se neposílají společně');
  if(!api.includes("if(rich.text)assertTextLength"))problems.push('image-only DOCX je stále blokován textovou validací');
  if(problems.length)bad('T11: DOCX import: '+problems.join('; ')); else ok('T11: DOCX import zachovává text i vložené obrázky');
}

// T12: custom checkboxes must be theme-aware rather than native black squares in light mode.
{
  const css=read('src/styles.css');
  const okCss=/\.qa-choice,\.teacher-confirm input\{[^}]*appearance:none[^}]*background:#fff/s.test(css)
    &&/\.teacher-confirm input:checked\{[^}]*background:var\(--core\)/s.test(css)
    &&/body\.dark \.qa-choice,body\.dark \.teacher-confirm input\{[^}]*background:#172030/s.test(css);
  if(!okCss)bad('T12: vlastní checkboxy nejsou explicitně stylované pro světlý i tmavý režim');
  else ok('T12: checkboxy kontroly/PDF mají vlastní light/dark vzhled');
}

// Guard the production integration against reintroducing the bypass/duplicate schema.
{
  const appJs=readdirSync(join(ROOT,'src/js')).filter(x=>x.endsWith('.js')).map(x=>read('src/js/'+x)).join('\n');
  const regressions=[];
  if(appJs.includes('__TEST_MOCK_GEMINI'))regressions.push('__TEST_MOCK_GEMINI');
  if(appJs.includes('WORKSHEET_RESPONSE_SCHEMA'))regressions.push('WORKSHEET_RESPONSE_SCHEMA');
  if(regressions.length)bad('integrační regresní pojistka: vrácen mrtvý/bypass kód '+regressions.join(', '));
  else ok('integrační regresní pojistka: bez starého bypassu a duplicitního schématu');
}

if(failures){console.error(`CELKEM: ${failures} regresních problémů — release stopka.`);process.exit(1);}
console.log('CELKEM: regresní brána zelená.');
