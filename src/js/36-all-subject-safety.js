/* ===================== ALL-SUBJECT SAFETY / RENDERING ===================== */
const SUBJECT_DOMAIN_ALIASES=Object.freeze({
  language:['anglictina','anglicky jazyk','aj','english','nemcina','nemecky jazyk','nj','deutsch','francouzstina','francouzsky jazyk','fj','spanelstina','spanelsky jazyk','sj','rustina','rusky jazyk','latina','cesky jazyk','cestina','cj','jazyk','language'],
  geography:['zemepis','geografie','geography','geo'],
  history:['dejepis','historie','history'],
  civics:['zsv','obcanska vychova','obcanka','obcansky zaklad','spolecenske vedy','zaklady spolecenskych ved','pravo','ekonomie','psychologie','sociologie','politologie','filozofie','filosofie','civics','social studies','economics'],
  informatics:['informatika','ict','it','programovani','programming','computer science','pocitace'],
  music:['hudebni vychova','hudebka','hv','hudba','music'],
  art:['vytvarna vychova','vytvarka','vv','vytvarne umeni','art','arts'],
  pe:['telesna vychova','telocvik','tv','physical education','pe'],
  humanities:['literatura','literarni vychova','religionistika','nabozenska vychova','etika','media studies','medialni vychova']
});
function normalizeSubjectDomain(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function subjectDomainKind(value){
  const s=normalizeSubjectDomain(value==null?(typeof getSubjectValue==='function'?getSubjectValue():''):value);if(!s)return 'general';
  if(typeof stemSubjectKind==='function'&&stemSubjectKind(value))return 'stem';
  for(const [kind,names] of Object.entries(SUBJECT_DOMAIN_ALIASES)){
    if(names.some(name=>{const n=normalizeSubjectDomain(name),short=/^[a-z0-9]{2,4}$/.test(n);return s===n||(short?new RegExp('(?:^| )'+n+'(?: |$)').test(s):s.includes(n))}))return kind;
  }
  return 'general';
}
function subjectGenerationPromptLines(subject){
  const kind=subjectDomainKind(subject),common='UNIVERZÁLNÍ PŘEDMĚTOVÁ PŘESNOST: nevymýšlej fakta, citace, data, názvy, hodnoty ani vlastnosti, které nejsou bezpečně určitelné ze zadání nebo běžného stabilního učiva. Pokud je něco ve zdroji nečitelné, sporné nebo závislé na aktuálním stavu, raději to označ v teacher_note pro kontrolu učitelem, než abys hádal.';
  if(kind==='stem')return [common];
  if(kind==='language')return [common,'JAZYKY: zachovej cílový jazyk každé úlohy, idiomatiku, pravopis, diakritiku a požadovanou gramatickou strukturu. U uzavřených úloh musí existovat jednoznačně obhajitelná odpověď; u otevřených úloh nepředstírej jedinou správnou formulaci a v klíči uváděj vzorové nebo přijatelné varianty. Překlad používej jen tehdy, když je součástí zadání.'];
  if(kind==='geography')return [common,'ZEMĚPIS: ověř místopis, světové strany, souřadnice, měřítko, jednotky, časová pásma a vazbu zadání na mapu/graf. Hranice, názvy států, politické uspořádání, počty obyvatel a jiné proměnlivé údaje nepřepisuj jako současný fakt bez časového kontextu ze zdroje. U slepé mapy zachovej původní mapový podklad; nepřekresluj hranice ani polohu prvků.'];
  if(kind==='history')return [common,'DĚJEPIS: hlídej chronologii, století, data, pořadí událostí, jména a geografický kontext. Nevymýšlej citace ani obsah historického pramene. Rozlišuj doložený údaj od interpretace a u sporných výkladů neprezentuj jednu interpretaci jako nesporný fakt.'];
  if(kind==='civics')return [common,'SPOLEČENSKÉ VĚDY: právní předpisy, funkce veřejných činitelů, sazby, ekonomické ukazatele a jiné proměnlivé údaje jsou časově citlivé. Pokud aktuální stav není bezpečně dán zdrojem včetně kontextu/data, nevymýšlej ho; vlož upozornění do teacher_note. Rozlišuj fakta, modelové příklady, názory a hodnotové soudy.'];
  if(kind==='informatics')return [common,'INFORMATIKA: kód, příkazy, datové struktury a očekávaný výstup musí být syntakticky i logicky konzistentní. U knihoven, jazyků a nástrojů závislých na verzi zachovej verzi ze zdroje; není-li uvedena a na verzi záleží, upozorni učitele v teacher_note. Kód nepoškozuj převodem znaků <, >, &, uvozovek nebo odsazení.'];
  if(kind==='music')return [common,'HUDEBNÍ VÝCHOVA: zachovej názvy tónů, předznamenání ♯ ♭ ♮, rytmické hodnoty, metrum, akordové značky a terminologii. Pokud úloha závisí na notovém zápisu jako obrazu, zachovej původní obrazový podklad a nevymýšlej noty, které nejsou čitelné.'];
  if(kind==='art')return [common,'VÝTVARNÁ VÝCHOVA: pokud úloha vychází z reprodukce nebo fotografie, pracuj pouze s tím, co je skutečně viditelné. Neidentifikuj autora, dílo, techniku nebo období jen odhadem z nejasného obrazu; nejistotu dej do teacher_note. Zachovej reprodukci jako obrazový podklad, pokud je pro úlohu nutná.'];
  if(kind==='pe')return [common,'TĚLESNÁ VÝCHOVA: zadání musí být věkově přiměřené a bezpečné. Nevytvářej zdravotní diagnózy ani individuální léčebná doporučení; u zdravotně podmíněných omezení odkaž v teacher_note na úsudek učitele a platná školní pravidla.'];
  if(kind==='humanities')return [common,'HUMANITNÍ PŘEDMĚTY: u literárních, mediálních, etických a pramenných úloh rozlišuj textově doložitelný údaj od interpretace. Nevymýšlej citace nebo pasáže, které ve zdroji nejsou, a u otevřených interpretačních úloh připusť více obhajitelných odpovědí.'];
  return [common];
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
function subjectAnswerKeyPromptLine(subject){const lines=subjectQualityPromptLines(subject);return lines.length?' Před odevzdáním klíče '+lines.join(' ').replace(/^[^:]+:\s*/,'').toLowerCase():''}
function numberedLineSet(text){const out=new Set();for(const line of String(text||'').split(/\r?\n/)){const m=line.match(/^\s*(\d{1,3})[.)]\s+/);if(m)out.add(Number(m[1]))}return out}
function subjectValidationIssues(parsed,subject){
  const issues=[],p=(parsed&&parsed.parts)||{},tasks=String(p.tasks||parsed&&parsed.worksheet||''),key=String(p.answerKey||parsed&&parsed.answerKey||''),combined=[tasks,key,String(p.teacherNote||'')].join('\n');
  if(/\[(?:ČÁSTEČNĚ\s+)?NEČITELNÉ\]/i.test(combined))issues.push('Ve výstupu zůstalo označení nečitelného zdroje; před použitím musí učitel tuto část doplnit nebo ověřit.');
  const taskNums=numberedLineSet(tasks),keyNums=numberedLineSet(key);if(taskNums.size>=3&&keyNums.size>=1){const missing=[...taskNums].filter(n=>!keyNums.has(n));if(missing.length)issues.push('Klíč zřejmě nepokrývá všechny očíslované úlohy; chybí čísla: '+missing.slice(0,12).join(', ')+'.')}
  if(subjectDomainKind(subject)==='informatics'&&/&lt;|&gt;|&amp;/.test(tasks)&&!/<[a-z][\s\S]*>/i.test(tasks))issues.push('Kód může obsahovat HTML entity místo původních znaků; zkontroluj zobrazení <, > a &.');
  return issues;
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
function appendEducationalRichText(parent,text,kind=typeof stemSubjectKind==='function'?stemSubjectKind():null){
  const lines=String(text||'').split(/\r?\n/);let i=0,plain=[];const flush=()=>{if(!plain.length)return;const s=plain.join('\n');if(typeof appendStemRichText==='function')appendStemRichText(parent,s,kind);else parent.appendChild(document.createTextNode(s));plain=[]};
  while(i<lines.length){let table=null,end=i;const pipe=[];for(let j=i;j<lines.length&&lines[j].includes('|')&&lines[j].trim();j++){pipe.push(lines[j]);const p=parsePipeTable(pipe);if(p){table=p;end=j+1;for(let k=j+1;k<lines.length&&lines[k].includes('|')&&lines[k].trim();k++){const n=parsePipeTable([...pipe,...lines.slice(j+1,k+1)]);if(n){table=n;end=k+1}}break}}if(!table&&lines[i].includes('\t')){const tab=[];let j=i;while(j<lines.length&&lines[j].includes('\t')&&lines[j].trim()){tab.push(lines[j]);j++}table=parseTabTable(tab);if(table)end=j}
    if(table){flush();parent.appendChild(makeEducationTable(table,kind));if(end<lines.length)parent.appendChild(document.createTextNode('\n'));i=end;continue}
    plain.push(lines[i]);i++;
  }flush();
}
function renderEducationalTextHtml(text,kind=typeof stemSubjectKind==='function'?stemSubjectKind():null){const div=document.createElement('div');appendEducationalRichText(div,text,kind);return div.innerHTML}
