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

const PACKAGE=JSON.parse(read('package.json'));
console.log('Regresní brána Diferenciátoru '+PACKAGE.version);

// Historical numbering note:
// T2 lives in qa-p3-browser.mjs (real shipped Platform + Core browser path).
// T6 lives in qa-ai-profiles.mjs / qa-ai-profiles-browser.mjs and the internal Core routing test.
// T7 lives in the browser/runtime runner readiness checks (Chromium discovery + actionable NOT_READY evidence).

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
  const allow=new Set(['advTargetGroupHelp','supportTypeSuggestions','advTeacherInstructionHelp','advScoringHelp']);
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

// T9: user-facing differentiation rules from the 1.3.17 usability pass stay explicit and enforced.
{
  const body=read('src/body.html'),ui=read('src/js/20-zaklad-ui-projekty.js'),flow=read('src/js/60-pwa-start.js');
  const problems=[];
  if(!body.includes('Osmileté gymnázium')||!body.includes('Čtyřleté gymnázium')||!ui.includes("'8g-tercie'")||!ui.includes("'4g-1'"))problems.push('chybí jednoznačný výběr ročníku gymnázia');
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


// T13: 1.3.17 keeps the title/printing/scoring/quality-cost fixes in place.
{
  const body=read('src/body.html'),ui=read('src/js/20-zaklad-ui-projekty.js'),api=read('src/js/30-api-gemini.js'),quality=read('src/js/40-vystup-pdf-kvalita.js'),css=read('src/styles.css');
  const problems=[];
  if(!body.includes('id="advScoringMode"')||!ui.includes('SCORING_MODES')||!ui.includes('PŘEVZÍT Z ORIGINÁLU')||!ui.includes('DOPLNÍ UČITEL')||!ui.includes('BEZ BODŮ'))problems.push('chybí čtyři režimy bodování');
  if(!api.includes('normalizeWorksheetTitleText')||!quality.includes('worksheet-title')||!css.includes('.sheet .worksheet-title')||!quality.includes('pa-title'))problems.push('hlavní nadpis není samostatně normalizovaný a zvýrazněný');
  if(!quality.includes("keyBody:isKey")||!css.includes('.pa-key-body .pa-ex{break-inside:auto'))problems.push('řešení může znovu tvořit jeden nedělitelný blok a prázdnou první stranu');
  if(!body.includes('id="qualityFinalRun"')||!quality.includes("sheet._qualityStage=wasFinal?'final-revised':'revised'")||!quality.includes('Další kontrola není povinná'))problems.push('kontrola po opravě znovu vytváří povinnou auditní smyčku');
  if(quality.includes('upraveno podle kontroly · znovu ověř'))problems.push('vrácen stav vynucující nekonečné znovu ověřování');
  if(!quality.includes('proveď interně dva průchody')||!quality.includes('thinking:THINKING_DEFAULT'))problems.push('hlavní audit není posílený na jeden souhrnný průchod');
  if(problems.length)bad('T13: nadpis/PDF/bodování/efektivní kontrola: '+problems.join('; ')); else ok('T13: výrazný nadpis, bodování, řešení PDF a omezený auditní tok jsou chráněné');
}


// T14: 1.3.19 keeps one workflow, clean browser print margins and title-based default filenames.
{
  const body=read('src/body.html'),quality=read('src/js/40-vystup-pdf-kvalita.js'),css=read('src/styles.css');
  const problems=[];
  if(body.includes('result-checklist result-flow')||body.includes('class="side-rail"'))problems.push('rozhraní stále duplikuje číslovaný postup');
  if(!quality.includes('printFileNameFromTitle')||!quality.includes('window.top.document.title')||!quality.includes("opts.isKey?' – řešení':''"))problems.push('výchozí název PDF se neodvozuje čitelně z nadpisu materiálu');
  if(!css.includes('@page{size:A4;margin:0}')||!css.includes('box-decoration-break:clone')||!body.includes('neměl prostor pro vlastní datum ani webovou adresu'))problems.push('tisková šablona neblokuje browserové URL/datum nulovým page marginem');
  if(problems.length)bad('T14: čistý výstup a název PDF: '+problems.join('; ')); else ok('T14: bez duplicitního postupu, bez prostoru pro browserové URL/datum a s názvem PDF podle testu');
}

// T15: explicit gymnasium year selection and four scoring modes including local manual scoring.
{
  const body=read('src/body.html'),ui=read('src/js/20-zaklad-ui-projekty.js'),quality=read('src/js/40-vystup-pdf-kvalita.js'),api=read('src/js/30-api-gemini.js'),bridge=read('src/js/25-ai-studio-bridge.js');
  const problems=[];
  if(!/<select id="advTargetGroup"/.test(body)||!body.includes('8g-prima')||!body.includes('4g-4')||!ui.includes("prvak:'4g-1'")||!ui.includes("ctvrtak:'4g-4'"))problems.push('ročník není výběr pro osmileté i čtyřleté gymnázium');
  if(!bridge.includes('setTargetGroup(m)')||bridge.includes("setValue('advTargetGroup'"))problems.push('AI Studio handoff stále zapisuje volný text do ročníkového selectu');
  for(const mode of ['ai','original','manual','none'])if(!body.includes('value="'+mode+'"'))problems.push('chybí scoring mode '+mode);
  if(!ui.includes('analyzeOriginalScoring')||!ui.includes("select.value=info.hasScoring?'original':'none'"))problems.push('původní body se nedetekují/nepředvolí');
  if(!body.includes('manualScoringOverlay')||!quality.includes('openManualScoring')||!quality.includes('manualScoreTotal')||!api.includes('pa-points'))problems.push('ruční body před PDF nejsou lokálně realizované');
  if(problems.length)bad('T15: ročník/bodování: '+problems.join('; ')); else ok('T15: gymnaziální ročník je jednoznačný a bodování má 4 režimy včetně lokálního editoru');
}

// T16: Phase 1 visual-critical assets must stay preserved end-to-end.
{
  const body=read('src/body.html'),api=read('src/js/30-api-gemini.js'),quality=read('src/js/40-vystup-pdf-kvalita.js'),projects=read('src/js/20-zaklad-ui-projekty.js'),core=read('src/js/31-ai-core-integration.js'),ops=JSON.parse(read('src/ai-operations.json')),pkg=JSON.parse(read('package.json'));
  const problems=[];
  if(!body.includes('id="visualSourcePanel"')||!body.includes('id="visualCropOverlay"')||!api.includes("[['preserve','Zachovat původní obraz ve výstupu'],['reference','Použít jen jako předlohu'],['ignore','Nevkládat / ignorovat']]"))problems.push('chybí učitelská volba zachovat/reference/ignorovat nebo lokální výřez');
  if(!api.includes('<<<VISUAL_MANIFEST>>>')||!api.includes('function splitVisualManifest')||!api.includes('function applyVisualManifest'))problems.push('chybí klasifikace obrazově klíčových podkladů');
  if(!api.includes('function generationVisualParts')||!api.includes("mode==='preserve'")||!api.includes('vlož do tasks marker [['))problems.push('generování nepřenáší obraz a marker zachování');
  if(!api.includes('function renderTextWithVisuals')||!api.includes('function ensureVisualMarkers')||!api.includes('print-visual'))problems.push('výstup/PDF neumí nahradit marker původním obrazem');
  if(!quality.includes('_visualAssets')||!quality.includes('generationVisualParts()')||!quality.includes('sheetVisualAiParts(sheet)')||!quality.includes('visualAssets'))problems.push('sheet/quality/answer/PDF tok nenese vizuální assety');
  if(!projects.includes('visualAssets')||!projects.includes('normalizeProjectVisualAsset'))problems.push('projektový export/import ztrácí obrazové assety');
  for(const name of ['answer-key-generation','worksheet-quality-audit','worksheet-quality-revision']){
    const op=ops.operations.find(x=>x.operation===name);if(!op||!op.inputTypes.includes('image'))problems.push(name+' nepovoluje image vstup v manifestu');
    if(!new RegExp("'"+name+"':[\\s\\S]{0,400}inputTypes:\\[[^\\]]*'image'[^\\]]*\\]").test(core))problems.push(name+' nepovoluje image vstup v Core konfiguraci');
  }
  if(pkg.scripts?.['qa:visuals']!=='node scripts/qa-visual-assets-browser.mjs')problems.push('chybí blokující klikací visual QA skript');
  if(problems.length)bad('T16: obrazově klíčové podklady: '+problems.join('; ')); else ok('T16: mapa/graf/schéma se zachovávají jako skutečné assety až do výsledku/PDF');
}

// T17: Phase 2 STEM notation and correctness safeguards must stay wired end-to-end.
{
  const stem=read('src/js/35-stem-safety.js'),api=read('src/js/30-api-gemini.js'),quality=read('src/js/40-vystup-pdf-kvalita.js'),css=read('src/styles.css'),pkg=JSON.parse(read('package.json'));
  const problems=[];
  for(const fn of ['officeDomBlockText','stemValidationIssues','chemReactionBalanced','stemUnitConversionIssues','renderStemTextHtml'])if(!stem.includes('function '+fn+'('))problems.push('chybí '+fn);
  if(!api.includes("typeof officeDomBlockText==='function'")||!api.includes('STEM přepis')||!api.includes('\\\\frac{a}{b}'))problems.push('DOCX/import není napojen na věrný STEM přepis a Word Equation');
  if(!quality.includes('stemGenerationPromptLines(subject)')||!quality.includes('stemQualityPromptLines(getSubjectValue())')||!quality.includes('stemValidationIssues(parsed'))problems.push('generování/kontrola nepoužívá STEM pravidla a lokální validaci');
  if(!quality.includes('node.dataset&&node.dataset.stemSource'))problems.push('editace ztrácí sémantický STEM zápis');
  if(!css.includes('.stem-frac')||!css.includes('.stem-radicand')||!css.includes('.stem-chem sub'))problems.push('chybí tisková typografie zlomků/odmocnin/chemických indexů');
  if(pkg.scripts?.['qa:stem']!=='node scripts/qa-stem-browser.mjs')problems.push('chybí blokující STEM browser gate');
  if(problems.length)bad('T17: STEM bezpečnost: '+problems.join('; ')); else ok('T17: Word Equation, STEM typografie, lokální výpočtové kontroly a browser/PDF gate jsou zapojené');
}


// T18: Phase 3 photos/scans/PDF must preserve originals while improving AI readability.
{
  const body=read('src/body.html'),api=read('src/js/30-api-gemini.js'),pkg=JSON.parse(read('package.json'));
  const problems=[];
  for(const id of ['visualSupplementFile','visualSupplementBtn','visualSourcePanel'])if(!body.includes('id="'+id+'"'))problems.push('chybí UI '+id);
  for(const fn of ['analyzeVisualQuality','rotateVisualAsset','enhanceVisualForAnalysis','appendSupplementalVisualFiles','extractionMediaParts','moveVisualAsset'])if(!api.includes('function '+fn+'('))problems.push('chybí '+fn);
  if(!api.includes('SCAN_REPORT')||!api.includes('[NEČITELNÉ]')||!api.includes('PDF projdi stránku po stránce'))problems.push('import nemá scan report / zákaz hádání / page-by-page PDF instrukci');
  if(!api.includes("pdfs.length>1")||!api.includes("'pdf-supplement'"))problems.push('chybí kombinace PDF + přesný snímek/výřez');
  if(!api.includes("asset.analysis_data?'")||!api.includes('visualAnalysisPayload(a)'))problems.push('AI čtecí kopie není oddělená od originálu pro výstup');
  if(pkg.scripts?.['qa:scan']!=='node scripts/qa-scan-browser.mjs')problems.push('chybí blokující scan browser gate');
  if(problems.length)bad('T18: fotografie/skeny/PDF: '+problems.join('; ')); else ok('T18: scan preflight, lokální úpravy, PDF+snímek a oddělená AI čtecí kopie jsou zapojené');
}


// T19: Phase 4 all-subject coverage must stay wired across generation, validation, rendering and CI gates.
{
  const all=read('src/js/36-all-subject-safety.js'),quality=read('src/js/40-vystup-pdf-kvalita.js'),api=read('src/js/30-api-gemini.js'),css=read('src/styles.css'),pkg=JSON.parse(read('package.json')),matrix=JSON.parse(read('src/config/all-subject-test-matrix.json'));
  const problems=[];
  for(const fn of ['subjectDomainKind','subjectGenerationPromptLines','subjectQualityPromptLines','subjectValidationIssues','renderEducationalTextHtml'])if(!all.includes('function '+fn+'('))problems.push('chybí '+fn);
  for(const id of ['language','math','physics','chemistry','biology','geography','history','civics','informatics','music','art','pe','humanities'])if(!matrix.domains.some(x=>x.id===id))problems.push('matice neobsahuje '+id);
  if(!quality.includes('subjectGenerationPromptLines(subject)')||!quality.includes('subjectQualityPromptLines(getSubjectValue())')||!quality.includes('subjectValidationIssues(parsed'))problems.push('předmětová pravidla nejsou zapojená do generování/kontroly/validace');
  if(!api.includes("typeof appendEducationalRichText==='function'"))problems.push('běžný render nevyužívá univerzální tabulkovou vrstvu');
  if(!css.includes('.edu-table')||!all.includes("className='edu-table'"))problems.push('chybí bezpečné tabulkové vykreslení');
  if(pkg.scripts?.['qa:all-subjects']!=='node scripts/qa-all-subjects.mjs'||pkg.scripts?.['qa:all-subjects:browser']!=='node scripts/qa-all-subjects-browser.mjs')problems.push('chybí all-subject release gates');
  if(problems.length)bad('T19: all-subject univerzálnost: '+problems.join('; ')); else ok('T19: 13 předmětových domén, univerzální validace, tabulky a browser/PDF gate jsou zapojené');
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


// T20: service-worker precache must not contain runtime deployment configs and both builds verify asset existence.
{
  const sw=read('src/sw.js'),build=read('scripts/build.mjs'),school=read('scripts/build-school-profile.mjs');
  const core=(sw.match(/const CORE_ASSETS\s*=\s*\[([\s\S]*?)\];/)||[])[1]||'';
  const bad=['deployment.json','deployment.school-server-p0.json','deployment.school-server.example.json'].filter(x=>core.includes(x));
  if(bad.length||!build.includes('verifySwCoreAssets')||!school.includes('verifySwCoreAssets'))bad('T20: SW precache/build guard: '+(bad.join(', ')||'chybí verifySwCoreAssets'));
  else ok('T20: runtime deployment konfigurace nejsou v CORE_ASSETS a oba buildy ověřují existenci precache assetů');
}

// T21: cosmetic scrolling must never be able to abort application transactions.
{
  const files=['src/js/30-api-gemini.js','src/js/60-pwa-start.js'];
  const direct=files.flatMap(file=>[...read(file).matchAll(/\.scrollIntoView\s*\(/g)].map(()=>file));
  const helper=read('src/js/20-zaklad-ui-projekty.js');
  if(direct.length||!helper.includes('function safeScrollIntoView'))bad('T21: přímé scrollIntoView mimo bezpečný helper: '+direct.join(', '));
  else ok('T21: kosmetické scrollování je izolováno přes safeScrollIntoView');
}

// T22: test mode hash must be exact, not a substring match.
{
  const ui=read('src/js/20-zaklad-ui-projekty.js');
  if(/location\.hash[\s\S]{0,100}includes\(['"]test/.test(ui)||!ui.includes("TEST_HASH==='test'"))bad('T22: testovací hash není přesná shoda');
  else ok('T22: pouze ?test nebo #test aktivuje interní testovací režim');
}

// T23: app code writes canonical ghrab.differentiator.* keys; dpl_* remain migration-only.
{
  const ui=read('src/js/20-zaklad-ui-projekty.js'),api=read('src/js/30-api-gemini.js');
  const primary=/const (?:CEFR_PREF_SK|KEY_SK|THEME_SK)=["']dpl_/.test(ui+api);
  if(primary||!ui.includes('ghrab.differentiator.theme.v1')||!ui.includes('LEGACY_STORAGE_KEYS'))bad('T23: storage namespace stále používá legacy dpl_* jako primární klíče');
  else ok('T23: kanonické storage klíče jsou primární, legacy dpl_* pouze migrační fallback');
}

// T24: print session must restore title/UI even when afterprint is missing.
{
  const pdf=read('src/js/40-vystup-pdf-kvalita.js');
  if(!pdf.includes('function finishPrintSession')||!pdf.includes('function schedulePrintCleanup')||!pdf.includes("window.addEventListener('afterprint',finishPrintSession)"))bad('T24: tisk nemá timeoutovou cleanup pojistku');
  else ok('T24: tisk má idempotentní afterprint + timeout cleanup');
}

// T25: four-year gymnasium selection text must not repeat the same grade phrase in label and detail.
{
  const ui=read('src/js/20-zaklad-ui-projekty.js');
  const rows=[...ui.matchAll(/'4g-[1-4]':\{label:'([^']+)',detail:'([^']+)'\}/g)];
  const repeated=rows.filter(([,label,detail])=>detail.toLocaleLowerCase('cs-CZ').startsWith(label.replace(/\s*\([^)]*\)\s*$/,'').toLocaleLowerCase('cs-CZ')));
  if(rows.length!==4||repeated.length)bad('T25: zdvojený text ročníku čtyřletého gymnázia');
  else ok('T25: ročník čtyřletého gymnázia nemá duplicitní label/detail');
}

// T26: visual pipeline keeps only helpers used by the live path.
{
  const api=read('src/js/30-api-gemini.js');
  const dead=['mediaParts','labelledMediaParts','referencedSourceVisualAssets','visualSummaryForPrompt'].filter(name=>api.includes('function '+name+'('));
  if(dead.length)bad('T26: vrácen potvrzený mrtvý kód obrazové vrstvy: '+dead.join(', '));
  else ok('T26: potvrzený mrtvý kód obrazové vrstvy zůstává odstraněný');
}

// T27: direct runtime declares thinking capabilities and the integration normalizes unsupported levels generically.
{
  const runtime=read('src/runtime-config.js'),integration=read('src/js/31-ai-core-integration.js');
  const qualityLevels=runtime.match(/quality:\s*\[([^\]]+)\]/)?.[1]||'';
  const guard=runtime.includes('profileThinkingLevels')&&!/minimal/.test(qualityLevels)&&/low/.test(qualityLevels)&&integration.includes('profileThinkingLevels')&&integration.includes("allowed.includes('low')?'low':allowed[0]");
  if(!guard)bad('T27: direct profil nemá provider-neutrální ochranu kompatibility thinking levelů');
  else ok('T27: direct runtime hlídá kompatibilní thinking level pro Důkladný profil');
}

// T28: every CI workflow that runs the full P5 gate must provision the PDF text extractor used by qa:stem.
{
  const workflows=['.github/workflows/p3-quality.yml','.github/workflows/p4-release.yml','.github/workflows/deploy.yml','.github/workflows/p5-release-gate.yml'];
  const missing=workflows.filter(file=>{const yml=read(file);return !yml.includes('poppler-utils')||!yml.includes('pdftotext -v')||!yml.includes('npm run qa:p5:ci');});
  const stem=read('scripts/qa-stem-browser.mjs');
  const explicitFailure=stem.includes('function pdfText(path)')&&stem.includes('qa:stem vyžaduje pdftotext')&&stem.includes('r.status!==0');
  if(missing.length||!explicitFailure)bad('T28: CI STEM PDF toolchain není explicitně zajištěn'+(missing.length?': '+missing.join(', '):''));
  else ok('T28: CI explicitně instaluje poppler-utils a qa:stem hlásí chybějící/selhaný pdftotext');
}

if(failures){console.error(`CELKEM: ${failures} regresních problémů — release stopka.`);process.exit(1);}
console.log('CELKEM: regresní brána zelená.');
