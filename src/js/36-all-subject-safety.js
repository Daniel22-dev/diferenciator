const SUBJECT_DOMAIN_ALIASES=Object.freeze({
  language:['anglictina','anglicky jazyk','aj','english','nemcina','nemecky jazyk','nj','deutsch','francouzstina','francouzsky jazyk','fj','spanelstina','spanelsky jazyk','sj','rustina','rusky jazyk','latina','cesky jazyk','cestina','cj','jazyk','language'],
  geography:['zemepis','geografie','geography','geo'],
  history:['dejepis','historie','history'],
  civics:['zsv','obcanska vychova','obcanka','obcansky zaklad','spolecenske vedy','zaklady spolecenskych ved','pravo','ekonomie','psychologie','sociologie','politologie','filozofie','filosofie','civics','social studies','economics'],
  informatics:['informatika','ict','it','programovani','programming','computer science','pocitace'],
  music:['hudebni vychova','hudebni nauka','hudebka','hv','hudba','music'],
  art:['vytvarna vychova','vytvarka','vv','vytvarne umeni','art','arts'],
  pe:['telesna vychova','telocvik','tv','physical education','pe'],
  humanities:['literatura','literarni vychova','religionistika','nabozenska vychova','etika','media studies','medialni vychova']
});
function normalizeSubjectDomain(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function subjectDomainKind(value){
  const s=normalizeSubjectDomain(value==null?(typeof getSubjectValue==='function'?getSubjectValue():''):value);if(!s)return 'general';
  if(typeof stemSubjectKind==='function'&&stemSubjectKind(value))return 'stem';
  if(/cestin|anglict|nemeck|nemcin|spanel|francouz|rustin|latin|italstin|portugalstin|rectin|polstin|slovenstin|ukrajinst|cinstin|japonstin|konverzac/.test(s))return 'language';
  if(/financni gramotnost|spolecenskoved|obcansk|psycholog|sociolog|politolog|filozof|filosof|pravni|ekonom|clovek a svet prace|karierov|osobnostni a socialni|multikulturn|evropsk.*globaln/.test(s))return 'civics';
  if(/informat|program|databaz|robotik|datova veda|digitalni technolog|algoritmizac|webove technolog|kybernet/.test(s))return 'informatics';
  if(/hudebn/.test(s))return 'music';
  if(/vytvar|dejiny umeni|historie umeni|design|fotograf/.test(s))return 'art';
  if(/telocvik|telesn.*vychov|sportovni|vychova ke zdravi|zdravotni vychova/.test(s))return 'pe';
  if(/literar|dramatick|divadeln|filmov|audiovizual|retorik|etick|religio|medialn|estetik|tvurci psani|debatn|dejiny kultur/.test(s))return 'humanities';
  if(/zemepis|geograf/.test(s))return 'geography';
  if(/dejepis|histor/.test(s))return 'history';
  for(const [kind,names] of Object.entries(SUBJECT_DOMAIN_ALIASES)){
    if(names.some(name=>{const n=normalizeSubjectDomain(name),short=/^[a-z0-9]{2,4}$/.test(n);return s===n||(short?new RegExp('(?:^| )'+n+'(?: |$)').test(s):s.includes(n))}))return kind;
  }
  return 'general';
}
function subjectGenerationPromptLines(subject){
  const kind=subjectDomainKind(subject),common='PŘEDMĚTOVÁ PŘESNOST: nevymýšlej fakta, citace ani hodnoty. Nečitelný, sporný či časově proměnlivý údaj označ v teacher_note k ověření učitelem.';
  if(kind==='stem')return [common];
  if(kind==='language')return [common,'JAZYKY: zachovej cílový jazyk, idiomatiku, pravopis a požadovanou gramatiku. Uzavřená úloha musí mít obhajitelný klíč; u otevřené připusť přijatelné varianty.'];
  if(kind==='geography')return [common,'ZEMĚPIS: ověř místopis, světové strany, souřadnice, měřítko, jednotky a časová pásma. Proměnlivé údaje vyžadují časový kontext; původní mapu nepřekresluj.'];
  if(kind==='history')return [common,'DĚJEPIS: ověř chronologii, století, data, jména a kontext. Nevymýšlej obsah pramene ani citace; odděl doložený údaj od interpretace.'];
  if(kind==='civics')return [common,'SPOLEČENSKÉ VĚDY: právní, politické a ekonomické údaje jsou časově citlivé; bez data/zdroje je označ k ověření. Rozlišuj fakta, modely a názory.'];
  if(kind==='informatics')return [common,'INFORMATIKA: kód a očekávaný výstup musí být syntakticky i logicky konzistentní. Zachovej relevantní verzi a znaky <, >, &, uvozovky i odsazení.'];
  if(kind==='music')return [common,'HUDEBNÍ VÝCHOVA: zachovej tóny, ♯ ♭ ♮, rytmus, metrum a akordy. Nečitelnou notaci nevymýšlej; zachovej původní obraz.'];
  if(kind==='art')return [common,'VÝTVARNÁ VÝCHOVA: u reprodukce pracuj jen s viditelným obsahem. Autora, dílo, techniku ani období z nejasného obrazu nehádej; originál zachovej.'];
  if(kind==='pe')return [common,'TĚLESNÁ VÝCHOVA: zadání musí být věkově přiměřené a bezpečné. Nevytvářej diagnózy ani individuální léčebná doporučení.'];
  if(kind==='humanities')return [common,'HUMANITNÍ PŘEDMĚTY: odděl textově doložitelný údaj od interpretace, nevymýšlej citace a u otevřené interpretace připusť více obhajitelných odpovědí.'];
  return [common];
}
function educationalVisualPromptLines(subject){
  const kind=subjectDomainKind(subject),stem=typeof stemSubjectKind==='function'?stemSubjectKind(subject):'',base='ODBORNÉ VIZUÁLY 1.3.31: nový přesný vizuál zapisuj jako samostatný [[EDU_TYP|{JSON}]]. Data markeru musí souhlasit se zadáním i klíčem. Zachovaný [[VISUAL_n]] nenahrazuj aproximací.';
  const chart='EDU_CHART: {"type":"bar|line|scatter|pie","title":"...","labels":["A","B"],"series":[{"name":"řada","values":[1,2]}]}.';
  const flow='EDU_FLOW: {"title":"...","direction":"lr|tb","nodes":[{"id":"a","label":"...","shape":"process|decision|start|end|entity|note"}],"edges":[{"from":"a","to":"b","label":"..."}]}. Vazby musí být odborně skutečné.';
  const timeline='EDU_TIMELINE: {"title":"...","events":[{"year":1918,"label":"..."},{"startYear":1939,"endYear":1945,"label":"..."},{"year":-500,"uncertainty":50,"approximate":true,"label":"..."}]}. Záporný rok = př. n. l.; dataci nevymýšlej.';
  const map='EDU_MAP: preset {"preset":"world|europe|czechia","title":"...","highlight":["ISO3"]}, nebo polygonová GeoJSON FeatureCollection ze zdroje.';
  const math='EDU_MATH: {"title":"...","tex":"\\\\frac{x^2-1}{x-1}","display":true,"verify":{"operation":"equivalent","left":"(x^2-1)/(x-1)","right":"x+1"}}.';
  const coord='EDU_COORD: {"title":"...","xmin":-5,"xmax":5,"ymin":-5,"ymax":5,"points":[[1,2,"A"]],"segments":[[0,0,2,3]],"polygons":[[[0,0],[2,0],[1,2]]],"circles":[{"x":0,"y":0,"r":2}]}.';
  const chem='EDU_CHEM: preferuj ověřitelný {"title":"ethanol","smiles":"CCO"}, případně explicitní atomový graf. Lokální engine kontroluje strukturu a valence.';
  const circuit='EDU_CIRCUIT: {"title":"...","nodes":[{"id":"a","x":0.1,"y":0.5},{"id":"b","x":0.9,"y":0.5}],"components":[{"type":"resistor|capacitor|inductor|battery|cell|switch|lamp|diode|led|ammeter|voltmeter|motor|fuse|ground|ldr|thermistor|potentiometer","a":"a","b":"b","label":"R1"}]}. NPN/PNP, op-amp, transformátor a SPDT: terminals.';
  const genetics='EDU_GENETICS: Punnett {"mode":"punnett","parents":["AaBb","AaBb"],"expectedGenotypes":{"AABB":0.0625}}, nebo rodokmen {"mode":"pedigree","individuals":[{"id":"p1","sex":"m|f|u","affected":false,"carrier":false,"parents":[],"generation":0}]}. Lokálně se validuje.';
  const phys='EDU_PHYS: vektory {"mode":"vectors","vectors":[{"label":"v1","magnitude":10,"angleDeg":0}]}, free-body diagram {"mode":"fbd","body":"těleso","mass":2,"acceleration":{"dx":1,"dy":0},"forces":[{"label":"F","dx":2,"dy":0}]}, nebo spojná čočka s reálným obrazem {"mode":"lens","focalLength":10,"objectDistance":30,"objectHeight":2}. ΣF, F=m·a i čočka se ověřují lokálně; jinak fail-closed.';
  const trace='EDU_TRACE: {"title":"...","indexBase":0,"program":["a = [2,4,6]","s = 0","FOR i = 0 TO 2","s = s + a[i]","NEXT i","PRINT s"],"watch":["i","s"],"expectedVariables":{"s":12},"expectedOutput":["12"],"maxSteps":600,"maxRenderedSteps":250}. Podporuje přiřazení, pole, blokové IF/ELSE ... END IF, FOR, WHILE, PRINT, // celočíselné dělení a MOD/%; maxSteps lze zvýšit nejvýše na 2000 a tabulka zobrazuje nejvýše 40–300 řádků se zkrácením středu. Komentáře //, # a REM používej jen jako samostatné řádky. Nepoužívej ELSE IF ani jednořádkové IF; nespouští JS/Python.';
  const reaction='EDU_REACTION: {"title":"...","equation":"Fe + O2 -> Fe2O3","expectedCoefficients":[4,3,2]}, volitelně "stoichiometry":{"given":{"species":"Fe","amount":2,"unit":"mol"},"find":{"species":"Fe2O3","unit":"mol"}}. Lokálně ověřuje platné symboly prvků H–Og, atomovou/nábojovou bilanci, koeficienty a stechiometrii. Pokud má rovnice více nezávislých bilančních řešení, bez expectedCoefficients se odmítne místo výběru arbitrární varianty.';
  const annotate='EDU_ANNOTATE: {"source":"VISUAL_1","title":"...","annotations":[{"type":"arrow","x":0.42,"y":0.31,"lx":0.62,"ly":0.18,"label":"1","text":"..."}]}. Jen nad zachovaným VISUAL_n; souřadnice 0–1. Originál se nepřekresluje.';
  if(kind==='geography')return [base,chart,map,annotate,flow];
  if(kind==='history')return [base,timeline,annotate,flow,chart];
  if(kind==='informatics')return [base,trace,flow,chart];
  if(kind==='language')return [base,flow];
  if(kind==='civics'||kind==='humanities')return [base,flow,timeline,annotate,chart];
  if(kind==='art')return [base,annotate,timeline,flow];
  if(kind==='music')return [base,'EDU_MUSIC: plná školní partitura používá staves/voices/notes; zachovej přesně rytmus, výšky tónů, předznamenání, takty, hlasy a klíče.'];
  if(kind==='stem'){
    if(stem==='math')return [base,chart,math,coord,flow];
    if(stem==='physics')return [base,chart,math,coord,circuit,phys,annotate,flow];
    if(stem==='chemistry')return [base,chart,math,chem,reaction,annotate,flow];
    if(stem==='biology')return [base,chart,genetics,annotate,flow];
    if(stem==='earthscience')return [base,chart,coord,map,timeline,annotate,flow];
  }
  return [base,chart,flow];
}
function educationalMarkerInfo(line){const m=String(line||'').match(/^\s*\[\[(EDU_(?:CHART|COORD|MUSIC|CHEM|MAP|CIRCUIT|MATH|OFFICE|FLOW|TIMELINE|GENETICS|PHYS|TRACE|REACTION|ANNOTATE))\|(\{.*\})\]\]\s*$/);if(!m)return null;try{const spec=JSON.parse(m[2]);return {type:m[1],kind:m[1].slice(4).toLowerCase(),raw:m[2],spec}}catch(error){return {type:m[1],kind:m[1].slice(4).toLowerCase(),raw:m[2],error}}}
function educationalVisualIssues(text,assetIds=null){
  const issues=[],allowedAssets=Array.isArray(assetIds)?new Set(assetIds.map(x=>String(x).toUpperCase())):null;for(const line of String(text||'').split(/\r?\n/)){if(!/\[\[EDU_/.test(line))continue;const info=educationalMarkerInfo(line);if(!info){issues.push('Odborný vizuální marker má neplatný formát, typ nebo není na samostatném řádku.');continue}if(info.error){issues.push('Odborný vizuální marker '+info.type+' neobsahuje platný JSON.');continue}const spec=info.spec||{};
    if(info.kind==='chart'&&(!Array.isArray(spec.series)||!spec.series.length))issues.push('EDU_CHART nemá žádnou datovou řadu.');
    if(info.kind==='coord'&&!(Number(spec.xmax)>Number(spec.xmin)&&Number(spec.ymax)>Number(spec.ymin)))issues.push('EDU_COORD má neplatný souřadnicový rozsah.');
    if(info.kind==='music'){const old=Array.isArray(spec.notes)&&spec.notes.length,rich=Array.isArray(spec.staves)&&spec.staves.some(st=>(st?.voices||[]).some(v=>Array.isArray(v?.notes)&&v.notes.length)||Array.isArray(st?.notes)&&st.notes.length);if(!old&&!rich)issues.push('EDU_MUSIC nemá žádné notové události.');}
    if(info.kind==='chem'&&!(String(spec.smiles||'').trim()||(Array.isArray(spec.atoms)&&spec.atoms.length)))issues.push('EDU_CHEM nemá SMILES ani atomový graf.');
    if(info.kind==='map'){const preset=['world','europe','czechia'].includes(spec.preset),geo=spec.geojson?.type==='FeatureCollection'&&Array.isArray(spec.geojson?.features);if(!preset&&!geo)issues.push('EDU_MAP nemá známý preset ani platnou GeoJSON FeatureCollection.');}
    if(info.kind==='circuit'){const ids=new Set((Array.isArray(spec.nodes)?spec.nodes:[]).map(n=>String(n?.id??''))),multi={npn:['b','c','e'],pnp:['b','c','e'],opamp:['plus','minus','out'],transformer:['p1','p2','s1','s2'],spdt:['common','throw1','throw2']};if(ids.size<2||!Array.isArray(spec.components)||!spec.components.length)issues.push('EDU_CIRCUIT potřebuje alespoň dva uzly a součástku.');else if(spec.components.some(c=>{const req=multi[String(c?.type||'').toLowerCase()];return req?req.some(k=>!ids.has(String(c?.terminals?.[k]??''))):(!ids.has(String(c?.a??''))||!ids.has(String(c?.b??'')))}))issues.push('EDU_CIRCUIT obsahuje součástku napojenou na neexistující nebo chybějící uzel.');}
    if(info.kind==='math'&&!String(spec.tex||'').trim())issues.push('EDU_MATH nemá TeX zápis.');
    if(info.kind==='flow'){const nodes=Array.isArray(spec.nodes)?spec.nodes:[],ids=new Set(nodes.map(n=>String(n?.id??'')));if(nodes.length<2||!Array.isArray(spec.edges)||!spec.edges.length)issues.push('EDU_FLOW potřebuje alespoň dva uzly a vazbu.');else if(spec.edges.some(e=>!ids.has(String(e?.from??''))||!ids.has(String(e?.to??''))))issues.push('EDU_FLOW obsahuje vazbu na neexistující uzel.');}
    if(info.kind==='timeline'&&(!Array.isArray(spec.events)||spec.events.length<2||spec.events.some(e=>{const y=Number.isFinite(Number(e?.year)),a=Number.isFinite(Number(e?.startYear)),b=Number.isFinite(Number(e?.endYear)),u=e?.uncertainty==null||Number.isFinite(Number(e.uncertainty))&&Number(e.uncertainty)>=0;return !(y||(a&&b))||a&&b&&Number(e.startYear)>Number(e.endYear)||!u})))issues.push('EDU_TIMELINE potřebuje alespoň dvě platné události/intervaly; nejistota musí být nezáporná.');
    if(info.kind==='genetics'){const pedigree=String(spec.mode||'punnett').toLowerCase()==='pedigree';if(pedigree?(!Array.isArray(spec.individuals)||!spec.individuals.length):(!Array.isArray(spec.parents)||spec.parents.length!==2))issues.push('EDU_GENETICS má neúplný Punnettův čtverec nebo rodokmen.');}
    if(info.kind==='phys'){const mode=String(spec.mode||'vectors').toLowerCase(),bad=mode==='lens'?(!Number.isFinite(Number(spec.focalLength))||Number(spec.focalLength)<=0||!Number.isFinite(Number(spec.objectDistance))||Number(spec.objectDistance)<=Number(spec.focalLength)):mode==='fbd'?(!Array.isArray(spec.forces)||!spec.forces.length):(!Array.isArray(spec.vectors)||!spec.vectors.length);if(bad)issues.push('EDU_PHYS nemá platná data pro vektory, free-body diagram nebo podporovaný případ spojné čočky.');}
    if(info.kind==='trace'&&!(Array.isArray(spec.program)?spec.program.length:String(spec.program||'').trim()))issues.push('EDU_TRACE nemá program k bezpečnému trasování.');
    if(info.kind==='reaction'&&!/(?:->|→|=)/.test(String(spec.equation||'')))issues.push('EDU_REACTION nemá chemickou rovnici se šipkou.');
    if(info.kind==='annotate'){const src=String(spec.source||'').toUpperCase();if(!/^VISUAL_\d+$/.test(src)||!Array.isArray(spec.annotations)||!spec.annotations.length)issues.push('EDU_ANNOTATE potřebuje zdroj VISUAL_n a alespoň jednu anotaci.');else if(allowedAssets&&!allowedAssets.has(src))issues.push('EDU_ANNOTATE odkazuje na nedostupný obraz '+src+'.');}
    if(info.kind==='office'&&(!Array.isArray(spec.shapes)||!spec.shapes.length))issues.push('EDU_OFFICE nemá rekonstruovatelné tvary.');
  }return [...new Set(issues)]
}
function subjectQualityPromptLines(subject){
  const kind=subjectDomainKind(subject);if(kind==='stem')return [];
  const base='MEZIPŘEDMĚTOVÁ KONTROLA: ověř, že klíč skutečně odpovídá zadání, žádná úloha není kvůli chybějícímu podkladu neřešitelná a model nevymyslel údaj, který zdroj ani stabilní učivo bezpečně nepodporují.';
  if(kind==='language')return [base,'JAZYKOVÁ KONTROLA: ověř gramatiku, pravopis, idiomatiku, zachování cílového jazyka a jednoznačnost uzavřených úloh; u otevřených úloh neoznačuj rozumné alternativní formulace za chybné.'];
  if(kind==='geography')return [base,'ZEMĚPISNÁ KONTROLA: ověř názvy, polohu, souřadnice, světové strany, měřítko, časová pásma, jednotky a soulad mapy/grafu se zadáním. Aktuální politické či statistické údaje bez časového kontextu označ k ověření učitelem.'];
  if(kind==='history')return [base,'DĚJEPISNÁ KONTROLA: ověř chronologii, data, století, jména a práci s pramenem; vymyšlená citace nebo anachronismus je vždy Opravit.'];
  if(kind==='civics')return [base,'KONTROLA SPOLEČENSKÝCH VĚD: označ časově citlivé právní, politické a ekonomické údaje bez data/zdroje k ověření a hlídej rozdíl mezi faktem, názorem a modelovým příkladem.'];
  if(kind==='informatics')return [base,'INFORMATICKÁ KONTROLA: ověř syntaxi a očekávaný výstup kódu, názvy příkazů a verze, pokud jsou relevantní; neplatný kód nebo falešný výstup je Opravit.'];
  if(kind==='music')return [base,'HUDEBNÍ KONTROLA: ověř názvy tónů, předznamenání, rytmus, metrum a vazbu na případný notový podklad.'];
  if(kind==='art')return [base,'VÝTVARNÁ KONTROLA: ověř, že tvrzení o reprodukci vychází z podkladu a že se nehádá autor/dílo/technika z nejasného obrazu.'];
  if(kind==='pe')return [base,'KONTROLA TĚLESNÉ VÝCHOVY: ověř věkovou přiměřenost, srozumitelnost a bezpečnost zadání.'];
  if(kind==='humanities')return [base,'HUMANITNÍ KONTROLA: ověř práci s textem/pramenem, nevymyšlené citace a to, že otevřená interpretace nepředstírá jedinou správnou odpověď.'];
  return [base];
}
function subjectAnswerKeyPromptLine(subject){const lines=subjectQualityPromptLines(subject);return (lines.length?' Před odevzdáním klíče '+lines.join(' ').replace(/^[^:]+:\s*/,'').toLowerCase():'')+' Pokud úloha obsahuje [[EDU_...|{...}]], ověř shodu dat markeru s řešením.'}
function numberedLineSet(text){const out=new Set();for(const line of String(text||'').split(/\r?\n/)){const m=line.match(/^\s*(\d{1,3})[.)]\s+/);if(m)out.add(Number(m[1]))}return out}
function subjectValidationIssues(parsed,subject){
  const issues=[],p=(parsed&&parsed.parts)||{},tasks=String(p.tasks||parsed&&parsed.worksheet||''),key=String(p.answerKey||parsed&&parsed.answerKey||''),combined=[tasks,key,String(p.teacherNote||'')].join('\n');
  if(/\[(?:ČÁSTEČNĚ\s+)?(?:NEČITELNÉ|NESROZUMITELNÉ)\]/i.test(combined))issues.push('Ve výstupu zůstalo označení nečitelného nebo nesrozumitelného zdroje; před použitím musí učitel tuto část doplnit nebo ověřit.');
  const taskNums=numberedLineSet(tasks),keyNums=numberedLineSet(key);if(taskNums.size>=3&&keyNums.size>=1){const missing=[...taskNums].filter(n=>!keyNums.has(n));if(missing.length)issues.push('Klíč zřejmě nepokrývá všechny očíslované úlohy; chybí čísla: '+missing.slice(0,12).join(', ')+'.')}
  if(subjectDomainKind(subject)==='informatics'&&/&lt;|&gt;|&amp;/.test(tasks)&&!/<[a-z][\s\S]*>/i.test(tasks))issues.push('Kód může obsahovat HTML entity místo původních znaků; zkontroluj zobrazení <, > a &.');
  issues.push(...educationalVisualIssues(combined,parsed&&parsed._visualAssetIds));
  return [...new Set(issues)];
}
function parsePipeTable(lines){
  if(lines.length<2)return null;const split=line=>String(line).trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());const header=split(lines[0]),sep=split(lines[1]);if(header.length<2||sep.length!==header.length||!sep.every(x=>/^:?-{3,}:?$/.test(x)))return null;const rows=lines.slice(2).map(split).filter(r=>r.length===header.length);return rows.length?{header,rows}:null;
}
function parseTabTable(lines){
  if(lines.length<2)return null;const rows=lines.map(line=>String(line).split('\t').map(x=>x.trim()));const cols=rows[0].length;if(cols<2||!rows.every(r=>r.length===cols))return null;return {header:null,rows};
}
function makeEducationTable(table,kind){
  const el=document.createElement('table');el.className='edu-table';const appendRow=(cells,head=false)=>{const tr=document.createElement('tr');for(const cell of cells){const td=document.createElement(head?'th':'td');if(typeof appendStemRichText==='function')appendStemRichText(td,cell,kind);else td.textContent=cell;tr.appendChild(td)}(head?(el.tHead||el.createTHead()):el.tBodies[0]||el.createTBody()).appendChild(tr)};if(table.header)appendRow(table.header,true);for(const r of table.rows)appendRow(r,false);return el;
}
let educationalRendererPromise=null;
function hydrateEducationalVisualsLazy(root){if(!educationalRendererPromise)educationalRendererPromise=import('./modules/educational-renderers.js').catch(error=>{educationalRendererPromise=null;throw error});educationalRendererPromise.then(m=>m.hydrateEducationalVisuals(root||document)).catch(()=>{})}
function makeEducationalVisualPlaceholder(info,assets=[]){const fig=document.createElement('figure');fig.className='edu-visual';fig.dataset.eduKind=info.kind;fig.dataset.eduSpec=JSON.stringify(info.spec).slice(0,350000);if(info.kind==='annotate'){const id=String(info.spec&&info.spec.source||'').toUpperCase(),a=(assets||[]).find(x=>String(x&&x.id||'').toUpperCase()===id),url=typeof visualDataUrl==='function'?visualDataUrl(a):'';if(url)fig.dataset.eduAssetSrc=url;}const cap=document.createElement('figcaption');cap.textContent=String(info.spec&&info.spec.caption||info.spec&&info.spec.title||'Odborný vizuál');fig.appendChild(cap);return fig}
function initEducationalVisualObserver(){const start=()=>{if(!document.body)return;const observer=new MutationObserver(records=>{for(const rec of records)for(const node of rec.addedNodes){if(node.nodeType!==1)continue;if(node.matches?.('figure.edu-visual')||node.querySelector?.('figure.edu-visual')){hydrateEducationalVisualsLazy(node);break}}});observer.observe(document.body,{childList:true,subtree:true});if(document.querySelector('figure.edu-visual'))hydrateEducationalVisualsLazy(document)};if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true})}
initEducationalVisualObserver();
function appendEducationalRichText(parent,text,kind=typeof stemSubjectKind==='function'?stemSubjectKind():null,assets=[]){
  const lines=String(text||'').split(/\r?\n/);let i=0,plain=[];const flush=()=>{if(!plain.length)return;const s=plain.join('\n');if(typeof appendStemRichText==='function')appendStemRichText(parent,s,kind);else parent.appendChild(document.createTextNode(s));plain=[]};
  while(i<lines.length){
    const marker=educationalMarkerInfo(lines[i]);if(marker&&!marker.error){flush();const fig=makeEducationalVisualPlaceholder(marker,assets);parent.appendChild(fig);hydrateEducationalVisualsLazy(fig);if(i+1<lines.length)parent.appendChild(document.createTextNode('\n'));i++;continue}
    let table=null,end=i;const pipe=[];for(let j=i;j<lines.length&&lines[j].includes('|')&&lines[j].trim();j++){pipe.push(lines[j]);const p=parsePipeTable(pipe);if(p){table=p;end=j+1;for(let k=j+1;k<lines.length&&lines[k].includes('|')&&lines[k].trim();k++){const n=parsePipeTable([...pipe,...lines.slice(j+1,k+1)]);if(n){table=n;end=k+1}}break}}if(!table&&lines[i].includes('\t')){const tab=[];let j=i;while(j<lines.length&&lines[j].includes('\t')&&lines[j].trim()){tab.push(lines[j]);j++}table=parseTabTable(tab);if(table)end=j}
    if(table){flush();parent.appendChild(makeEducationTable(table,kind));if(end<lines.length)parent.appendChild(document.createTextNode('\n'));i=end;continue}
    plain.push(lines[i]);i++;
  }flush();
}
function renderEducationalTextHtml(text,kind=typeof stemSubjectKind==='function'?stemSubjectKind():null,assets=[]){const div=document.createElement('div');appendEducationalRichText(div,text,kind,assets);return div.innerHTML}
