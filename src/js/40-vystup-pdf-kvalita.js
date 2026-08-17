const OutputParser={
  parse(raw){
    const src=String(raw||'').trim();
    const jsonParts=tryParseWorksheetJson(src);
    if(jsonParts){
      const worksheet=[jsonParts.title,jsonParts.instructions,jsonParts.tasks].map(x=>String(x||'').trim()).filter(Boolean).join('\n\n');
      return {worksheet:worksheet||jsonParts.tasks||src,answerKey:jsonParts.answerKey||'',parts:jsonParts,structured:true,structureType:'json',raw:src};
    }
    const hasStructured=/<<<\s*(?:WORKSHEET_TITLE|STUDENT_INSTRUCTIONS|TASKS|ANSWER_KEY|TEACHER_NOTE)\s*>>>/i.test(src);
    if(hasStructured){
      const parts={
        title:normalizeWorksheetTitleText(getMarkedSection(src,'WORKSHEET_TITLE')),
        instructions:getMarkedSection(src,'STUDENT_INSTRUCTIONS'),
        tasks:getMarkedSection(src,'TASKS'),
        answerKey:getMarkedSection(src,'ANSWER_KEY'),
        teacherNote:getMarkedSection(src,'TEACHER_NOTE')
      };
      const worksheet=[parts.title,parts.instructions,parts.tasks].map(x=>String(x||'').trim()).filter(Boolean).join('\n\n');
      return {worksheet:worksheet||parts.tasks||src,answerKey:parts.answerKey||'',parts,structured:true,structureType:'markers',raw:src};
    }
    const m=src.match(/<<<\s*WORKSHEET\s*>>>([\s\S]*?)(?:<<<\s*ANSWER_KEY\s*>>>([\s\S]*))?$/i);
    const worksheet=m?((m[1]||'').trim()):src;
    const answerKey=m?((m[2]||'').trim()):'';
    return {worksheet,answerKey,parts:{title:'',instructions:'',tasks:worksheet,answerKey,teacherNote:''},structured:false,structureType:'fallback',raw:src};
  }
};
const OutputValidator={
  validate(parsed){
    const issues=[];
    const p=(parsed&&parsed.parts)||{};
    if(!parsed||!String(parsed.worksheet||'').trim())issues.push('Model nevrátil použitelný text pracovního listu.');
    if(!parsed||!parsed.structured)issues.push('Model nedodržel JSON strukturu výstupu; aplikace použila záložní zpracování.');
    if(parsed&&parsed.structured&&parsed.structureType!=='json')issues.push('Model použil starší značkovací strukturu místo nového JSON schématu; výstup zkontroluj.');
    if(parsed&&parsed.structured&&!String(p.tasks||'').trim())issues.push('Chybí samostatná položka tasks; zkontroluj, zda jsou úlohy v listu úplné.');
    if(parsed&&parsed.structured&&!String(p.answerKey||'').trim())issues.push('Chybí samostatný klíč answer_key; tlačítko Řešení ho může dogenerovat.');
    if(parsed&&/<<<\s*(?:WORKSHEET_TITLE|STUDENT_INSTRUCTIONS|TASKS|ANSWER_KEY|TEACHER_NOTE|WORKSHEET)\s*>>>/i.test(String(parsed.worksheet||'')))issues.push('Technické značky se dostaly do viditelného pracovního listu.');
    if(typeof stemValidationIssues==='function')issues.push(...stemValidationIssues(parsed,typeof getSubjectValue==='function'?getSubjectValue():''));
    if(typeof subjectValidationIssues==='function')issues.push(...subjectValidationIssues(parsed,typeof getSubjectValue==='function'?getSubjectValue():''));
    return {ok:issues.length===0,issues:[...new Set(issues)]};
  },
  render(validation){
    if(!validation||validation.ok)return '';
    return '<div class="kh"><span class="teacher-kicker">Učitelská část</span> Upozornění k výstupu</div><div>Materiál byl vytvořen, ale před použitím zkontroluj tyto body:</div><ul>'+validation.issues.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
  }
};
function parseWorksheetResponse(raw){return OutputParser.parse(raw)}
function validateWorksheetResponse(parsed){return OutputValidator.validate(parsed)}
function renderStructureWarning(validation){return OutputValidator.render(validation)}
function showStructureWarning(sheet,validation){
  const box=sheet.querySelector('.structurebox'); if(!box)return;
  const html=renderStructureWarning(validation);
  box.innerHTML=html; box.classList.toggle('show',!!html);
}

function editableToText(el){
  const walk=node=>{
    if(node.nodeType===3)return node.nodeValue;
    if(node.nodeType!==1)return '';
    if(node.dataset&&node.dataset.stemSource)return node.dataset.stemSource;
    const inner=[...node.childNodes].map(walk).join('');
    const tag=node.tagName;
    if(tag==='FIGURE'&&node.dataset&&node.dataset.visualId)return '[['+String(node.dataset.visualId).toUpperCase()+']]\n';
    if(tag==='B'||tag==='STRONG')return inner.trim()?'**'+inner.trim()+'**':inner;
    if(tag==='TABLE'){return [...node.rows].map(r=>[...r.cells].map(c=>[...c.childNodes].map(walk).join('').trim()).join('\t')).join('\n')+'\n'}
    if(tag==='BR')return '\n';
    if(tag==='DIV'||tag==='P')return inner+'\n';
    return inner;
  };
  return [...el.childNodes].map(walk).join('').replace(/\n{3,}/g,'\n\n').replace(/[ \t]+\n/g,'\n').trim();
}
function toggleEdit(sheet,btn){
  const body=sheet.querySelector('.body');
  const editing=body.isContentEditable||body.getAttribute('contenteditable')==='true';
  if(editing){
    const original=String(sheet._text||'').trim(),txt=editableToText(body);
    body.contentEditable='false';body.removeAttribute('contenteditable');
    if(txt===original){renderSheetBody(sheet);attachSheetTools(sheet);return}
    sheet._text=txt;
    sheet._key='';
    sheet._quality='';sheet._qualityStage='none';sheet._qualityApplied=[];sheet._finalAuditUsed=false;sheet._manualScores={};
    sheet._parts={...(sheet._parts||{}),tasks:txt,answerKey:'',teacherNote:''};
    sheet._validation={ok:true,issues:[]};sheet._pdfWarningSkipped=false;
    const sbox=sheet.querySelector('.structurebox');if(sbox){sbox.innerHTML='';sbox.classList.remove('show')}
    const box=sheet.querySelector('.keybox');box.innerHTML='';box.classList.remove('show');delete box.dataset.filled;
    const qbox=sheet.querySelector('.qualitybox');if(qbox){qbox.innerHTML='';qbox.classList.remove('show')}
    renderSheetBody(sheet);renderTeacherNote(sheet);attachSheetTools(sheet);
    setSheetStatus(sheet,'upraveno · zkontroluj','needcheck');
  }else{
    setRichTextWithVisuals(body,sheet._text||'',sheet._visualAssets||[]);body.contentEditable='true';body.setAttribute('contenteditable','true');btn.textContent='Hotovo';body.focus();
  }
}

function normalizeParsedScoring(parsed,mode){
  if(!parsed||!['manual','none'].includes(mode))return parsed;
  const parts={...(parsed.parts||{})};
  parts.tasks=stripGeneratedScoring(parts.tasks||parsed.worksheet||'');
  const worksheet=[parts.title,parts.instructions,parts.tasks].map(x=>String(x||'').trim()).filter(Boolean).join('\n\n');
  return {...parsed,parts,worksheet:worksheet||parts.tasks||stripGeneratedScoring(parsed.worksheet||'')};
}
function normalizeParsedVisuals(parsed,assets){
  if(!parsed)return parsed;const keep=(assets||[]).map(cloneVisualAsset).filter(Boolean),parts={...(parsed.parts||{})};
  parts.instructions=sanitizeVisualMarkers(parts.instructions||'',keep);
  parts.tasks=keep.length?ensureVisualMarkers(parts.tasks||parsed.worksheet||'',keep):sanitizeVisualMarkers(parts.tasks||parsed.worksheet||'',[]);
  parts.answerKey=sanitizeVisualMarkers(parts.answerKey||parsed.answerKey||'',keep);
  const worksheet=[parts.title,parts.instructions,parts.tasks].map(x=>String(x||'').trim()).filter(Boolean).join('\n\n');
  return {...parsed,parts,worksheet:worksheet||parts.tasks||'',answerKey:parts.answerKey||parsed.answerKey||'',_visualAssetIds:keep.map(a=>String(a.id||'').toUpperCase()).filter(Boolean)};
}
function sheetScoringMode(sheet){return sheet&&SCORING_MODES.includes(sheet._scoringMode)?sheet._scoringMode:scoringMode()}
function withDeterministicOutputValidation(validation,parsed){const base=validation||{ok:true,issues:[]},tasks=String(parsed&&parsed.parts&&parsed.parts.tasks||parsed&&parsed.worksheet||''),extra=typeof scoringIntegrityIssues==='function'?scoringIntegrityIssues(tasks).map(x=>'BODOVÁNÍ: '+x):[];const issues=[...new Set([...(base.issues||[]),...extra])];return {ok:issues.length===0,issues}}
let pendingManualScoring=null;
function manualScoringItems(text){
  const blocks=splitPrintBlocks(text),items=[];
  blocks.forEach((block,index)=>{if(!block.isTask)return;const first=String(block.text||'').split(/\r?\n/).find(x=>String(x).trim())||('Úloha '+(items.length+1));if(typeof isScoredMainTaskStartLine==='function'&&!isScoredMainTaskStartLine(first))return;items.push({index,label:first.replace(/^\*{1,2}|\*{1,2}$/g,'').trim()})});
  return {blocks,items};
}
function manualScoreTotal(scores){return Object.values(scores||{}).reduce((sum,v)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?sum+n:sum},0)}
function updateManualScoringTotal(){
  const total=$('#manualScoringTotal');if(!total)return;const values=[...document.querySelectorAll('#manualScoringList input[data-score-index]')].map(i=>i.value).filter(v=>String(v).trim()!=='').map(Number).filter(Number.isFinite);total.textContent=formatScoreNumber(values.reduce((a,b)=>a+b,0));
}
function closeManualScoring(){const ov=$('#manualScoringOverlay');if(ov)ov.classList.remove('show');pendingManualScoring=null}
function openManualScoring(sheet,data){
  const list=$('#manualScoringList'),error=$('#manualScoringError');if(!list)return downloadPdf(data.title,data.text,data.opts||{});
  list.replaceChildren();if(error){error.textContent='';error.classList.remove('show')}
  const source=String(sheet&&sheet._parts&&sheet._parts.tasks||sheet&&sheet._text||data.text||''),{items}=manualScoringItems(source),stored=sheet&&sheet._manualScores||{};
  if(!items.length){
    const p=document.createElement('p');p.className='muted';p.textContent='Hlavní úlohy se nepodařilo bezpečně rozdělit. Vrať se přes „Upravit“ a označ hlavní úlohy číslováním 1., 2., 3. …, nebo zvol režim Bez bodování.';list.appendChild(p);
  } else items.forEach((item,pos)=>{
    const row=document.createElement('label');row.className='manual-score-row';
    const name=document.createElement('span');name.className='manual-score-label';name.textContent=item.label||('Úloha '+(pos+1));
    const wrap=document.createElement('span');wrap.className='manual-score-input';
    const input=document.createElement('input');input.type='number';input.min='0';input.step='0.5';input.inputMode='decimal';input.dataset.scoreIndex=String(item.index);input.setAttribute('aria-label','Body pro '+(item.label||('úlohu '+(pos+1))));if(stored[item.index]!=null)input.value=String(stored[item.index]);
    const suffix=document.createElement('span');suffix.textContent='b.';wrap.append(input,suffix);row.append(name,wrap);list.appendChild(row);input.addEventListener('input',updateManualScoringTotal);
  });
  pendingManualScoring={sheet,data,items};updateManualScoringTotal();const ov=$('#manualScoringOverlay');if(ov)ov.classList.add('show');
}
function continuePdfForSheet(sheet,data){
  if(sheet&&sheetScoringMode(sheet)==='manual'&&!data.opts?.isKey){openManualScoring(sheet,data);return}
  downloadPdf(data.title,data.text,data.opts||{});
}
let pendingPdfSheet=null;
let pendingPdfData=null;
function closePdfCheck(){
  const ov=$('#pdfCheckOverlay'); if(ov)ov.classList.remove('show');
}
function pdfDataForSheet(sheet,title,text,isKey=false){
  const parts=sheet&&sheet._parts||{},tier=sheet?(TIERS[sheet._tierKey]||{name:'Verze'}):{name:'Verze'};
  const structured=!!(sheet&&sheet._structured);
  const worksheetTitle=structured?String(parts.title||'').trim():'';
  const instructions=!isKey&&structured?String(parts.instructions||'').trim():'';
  const bodyText=isKey?String(sheet&&sheet._key||text||''):(structured&&String(parts.tasks||'').trim()?String(parts.tasks):String(text||sheet&&sheet._text||''));
  return {title:title||tier.name+' verze',text:bodyText,opts:{isKey,worksheetTitle,instructions,subtitle:isKey?tier.name+' verze — řešení':tier.name+' verze',keyBody:isKey,visualAssets:(sheet&&sheet._visualAssets||[]).map(cloneVisualAsset).filter(Boolean),mediaSource:cloneMediaSource(sheet&&sheet._mediaSource,true),manualScores:!isKey&&sheetScoringMode(sheet)==='manual'?(sheet&&sheet._manualScores||{}):null}};
}
const PrintPdf={
  request(sheet,title,text){
    const scoreSource=String(sheet&&sheet._parts&&sheet._parts.tasks||sheet&&sheet._text||text||''),scoreIssues=typeof scoringIntegrityIssues==='function'?scoringIntegrityIssues(scoreSource):[];
    if(scoreIssues.length){setSheetStatus(sheet,'PDF zablokováno · oprav bodování','warn');showMessage('PDF zablokováno kvůli nekonzistentnímu bodování',scoreIssues.join(' ')+' Uprav body v pracovním listu, zvol „Bez bodování“, nebo použij ruční bodování hlavních úloh.');return}
    const hasStructureIssues=!!(sheet&&sheet._validation&&!sheet._validation.ok&&!sheet._pdfWarningSkipped);
    const needsQuality=!!(sheet&&!sheet._quality&&(!sheet._qualityStage||sheet._qualityStage==='none'));
    const data=pdfDataForSheet(sheet,title,text,false);
    if(sheet && (needsQuality||hasStructureIssues)){
      pendingPdfSheet=sheet; pendingPdfData=data;
      const tier=TIERS[sheet._tierKey]||{name:'Verze'};
      const msg=$('#pdfCheckText');
      const extra=hasStructureIssues?' Navíc je u výstupu upozornění ke struktuře: '+sheet._validation.issues[0]:' ';
      if(msg)msg.textContent=tier.name+' verze ještě '+(needsQuality?'neprošla první kontrolou kvality.':'má strukturální upozornění.')+' Před stažením PDF je vhodné zkontrolovat věcnou správnost, jazyk, zadání i řešení.'+extra;
      const ov=$('#pdfCheckOverlay'); if(ov)ov.classList.add('show');
      return;
    }
    continuePdfForSheet(sheet,data);
  }
};
function requestPdfForSheet(sheet,title,text){PrintPdf.request(sheet,title,text)}

let pendingPrintHtml='';
let pendingPrintFileName='';
let previousDocumentTitle='';
let previousTopDocumentTitle='';
let printCleanupTimer=0;
let pendingPrintVisualErrors=[];

function updatePrintConfirmState(){
  const button=$('#printConfirm'),teacher=$('#printTeacherConfirmed'),override=$('#printVisualOverride');
  if(button)button.disabled=!(teacher&&teacher.checked)||(pendingPrintVisualErrors.length>0&&!(override&&override.checked));
}
function clearPrintVisualErrors(){
  pendingPrintVisualErrors=[];
  const box=$('#printVisualErrors'),row=$('#printVisualOverrideRow'),override=$('#printVisualOverride');
  if(box){box.textContent='';box.classList.add('hide')}
  if(row)row.classList.add('hide');
  if(override)override.checked=false;
  updatePrintConfirmState();
}
function showPrintVisualErrors(errors){
  const list=(Array.isArray(errors)?errors:[]).map(x=>String(x||'Neznámá chyba odborného vizuálu.')).filter(Boolean);
  const same=JSON.stringify(list)===JSON.stringify(pendingPrintVisualErrors);
  pendingPrintVisualErrors=list;
  const box=$('#printVisualErrors'),row=$('#printVisualOverrideRow'),override=$('#printVisualOverride');
  if(box){box.replaceChildren();const strong=document.createElement('strong');strong.textContent=list.length+' odborných vizuálů se nepodařilo bezpečně připravit pro tisk.';box.appendChild(strong);const ul=document.createElement('ul');for(const message of list){const li=document.createElement('li');li.textContent=message;ul.appendChild(li)}box.appendChild(ul);box.classList.remove('hide')}
  if(row)row.classList.remove('hide');
  if(override&&!same)override.checked=false;
  updatePrintConfirmState();
}
async function hydratePrintVisualsAndCollectErrors(){
  const root=$('#printArea');
  if(!root)return ['Tisková oblast není dostupná.'];
  try{
    const module=await import('./modules/educational-renderers.js');
    await module.hydrateEducationalVisuals(root);
  }catch(error){return ['Renderer odborných vizuálů se nepodařilo načíst: '+String(error&&error.message||error||'neznámá chyba')];}
  return [...root.querySelectorAll('figure.edu-visual[data-edu-ready="error"]')].map((fig,i)=>{
    const caption=fig.querySelector('figcaption')?.textContent?.trim();
    const detail=fig.textContent?.trim()||'Odborný vizuál nelze vykreslit.';
    return (caption?caption+': ':'Vizuál '+(i+1)+': ')+detail;
  });
}

function downloadPdf(title,rawText,opts){
  opts=opts||{};
  const splitBody = opts.split===false
    ? '<div class="pa-ex">'+renderTextWithVisuals(rawText,opts.visualAssets||[],true,opts.mediaSource)+'</div>'
    : buildPrintBody(rawText,opts.manualScores,opts.visualAssets||[],opts.mediaSource);
  const keyTag = opts.isKey ? '<div class="pa-keytag">Řešení / klíč — nedávat studentům</div>' : '';
  const visibleTitle=String(opts.worksheetTitle||title||'Pracovní list').trim();
  const subtitle=String(opts.subtitle||'').trim();
  const titleBlock='<div class="pa-title-block"><h1 class="pa-title">'+render(visibleTitle)+'</h1>'+(subtitle&&subtitle!==visibleTitle?'<div class="pa-subtitle">'+render(subtitle)+'</div>':'')+'</div>';
  const instructions=opts.instructions?'<div class="pa-instructions">'+renderTextWithVisuals(opts.instructions,opts.visualAssets||[],true,opts.mediaSource)+'</div>':'';
  const head=printHead()+metaLine(opts.isKey)+keyTag+titleBlock+instructions;
  const scoreTotal=opts.manualScores?manualScoreTotal(opts.manualScores):0;
  const scoreTotalHtml=opts.manualScores&&scoreTotal>0?'<div class="pa-score-total">Celkem: '+formatScoreNumber(scoreTotal)+' b.</div>':'';
  const body='<div class="pa-body'+(opts.keyBody?' pa-key-body':'')+'">'+splitBody+scoreTotalHtml+'</div>';
  pendingPrintHtml=head+body;
  pendingPrintFileName=printFileNameFromTitle(opts.worksheetTitle||title)+(opts.isKey?' – řešení':'');
  $('#printArea').innerHTML=pendingPrintHtml;
  $('#printPreview').innerHTML=head+body;
  const pf=$('#printFileName'); if(pf){pf.textContent='Doporučený název souboru: '+pendingPrintFileName+'.pdf';pf.classList.add('show')}
  const teacherConfirm=$('#printTeacherConfirmed'); if(teacherConfirm)teacherConfirm.checked=false;
  clearPrintVisualErrors();
  updatePrintConfirmState();
  $('#printOverlay').classList.add('show');
}
$('#printCancel').addEventListener('click',()=>$('#printOverlay').classList.remove('show'));
$('#printOverlay').addEventListener('click',e=>{if(e.target.id==='printOverlay')$('#printOverlay').classList.remove('show')});
$('#pdfCheckOverlay').addEventListener('click',e=>{if(e.target.id==='pdfCheckOverlay')closePdfCheck()});
const printTeacherConfirmed=$('#printTeacherConfirmed');
if(printTeacherConfirmed)printTeacherConfirmed.addEventListener('change',updatePrintConfirmState);
const printVisualOverride=$('#printVisualOverride');
if(printVisualOverride)printVisualOverride.addEventListener('change',updatePrintConfirmState);
$('#pdfCheckContinue').addEventListener('click',()=>{
  const data=pendingPdfData,sheet=pendingPdfSheet;
  if(sheet)sheet._pdfWarningSkipped=true;
  closePdfCheck(); pendingPdfSheet=null; pendingPdfData=null;
  if(data)continuePdfForSheet(sheet,data);
});
$('#pdfCheckRun').addEventListener('click',()=>{
  const sheet=pendingPdfSheet;
  closePdfCheck();
  if(sheet){
    const btn=sheet.querySelector('[data-act="quality"]');
    checkQuality(sheet,btn||{disabled:false,innerHTML:''});
  }
});
const manualScoringCancel=$('#manualScoringCancel');if(manualScoringCancel)manualScoringCancel.addEventListener('click',closeManualScoring);
const manualScoringOverlay=$('#manualScoringOverlay');if(manualScoringOverlay)manualScoringOverlay.addEventListener('click',e=>{if(e.target.id==='manualScoringOverlay')closeManualScoring()});
const manualScoringContinue=$('#manualScoringContinue');if(manualScoringContinue)manualScoringContinue.addEventListener('click',()=>{
  if(!pendingManualScoring)return;const {sheet,data,items}=pendingManualScoring,error=$('#manualScoringError'),scores={};
  for(const input of document.querySelectorAll('#manualScoringList input[data-score-index]')){const raw=String(input.value||'').trim();if(!raw)continue;const n=Number(raw);if(!Number.isFinite(n)||n<0){if(error){error.textContent='Body musí být nezáporné číslo.';error.classList.add('show')}input.focus();return}scores[input.dataset.scoreIndex]=n;}
  if(items.length&&!Object.keys(scores).length){if(error){error.textContent='Doplň alespoň jednu bodovou hodnotu, nebo v Pedagogickém zpřesnění zvol „Bez bodování“.';error.classList.add('show')}return}
  sheet._manualScores=scores;data.opts={...(data.opts||{}),manualScores:scores};closeManualScoring();downloadPdf(data.title,data.text,data.opts);
});
function setPrintDocumentTitle(name){
  const value=String(name||'Pracovní list').trim()||'Pracovní list';
  if(!previousDocumentTitle)previousDocumentTitle=document.title;
  document.title=value;
  try{
    if(window.top&&window.top!==window&&window.top.document){
      if(!previousTopDocumentTitle)previousTopDocumentTitle=window.top.document.title;
      window.top.document.title=value;
    }
  }catch(_){}
}
function restorePrintDocumentTitle(){
  if(previousDocumentTitle){document.title=previousDocumentTitle;previousDocumentTitle=''}
  try{
    if(previousTopDocumentTitle&&window.top&&window.top!==window&&window.top.document)window.top.document.title=previousTopDocumentTitle;
  }catch(_){}
  previousTopDocumentTitle='';
}
function finishPrintSession(){
  if(printCleanupTimer){clearTimeout(printCleanupTimer);printCleanupTimer=0}
  document.body.classList.remove('do-print');
  restorePrintDocumentTitle();
}
function schedulePrintCleanup(){
  if(printCleanupTimer)clearTimeout(printCleanupTimer);
  printCleanupTimer=setTimeout(finishPrintSession,2500);
}
$('#printConfirm').addEventListener('click',async()=>{
  if(printTeacherConfirmed&&!printTeacherConfirmed.checked)return;
  const button=$('#printConfirm'),originalLabel=button?button.textContent:'';
  if(button){button.disabled=true;button.textContent='Připravuji odborné vizuály…'}
  if(pendingPrintHtml)$('#printArea').innerHTML=pendingPrintHtml;
  const errors=await hydratePrintVisualsAndCollectErrors();
  const override=$('#printVisualOverride');
  if(errors.length){showPrintVisualErrors(errors);if(!(override&&override.checked)){if(button)button.textContent=originalLabel;$('#printOverlay').classList.add('show');return}}else clearPrintVisualErrors();
  $('#printOverlay').classList.remove('show');
  setPrintDocumentTitle(pendingPrintFileName);
  document.body.classList.add('do-print');
  schedulePrintCleanup();
  if(button)button.textContent=originalLabel;
  requestAnimationFrame(()=>{try{window.print()}catch(err){finishPrintSession();throw err}});
});
window.addEventListener('afterprint',finishPrintSession);
document.addEventListener('click',e=>{
  const b=e.target.closest('.key-pdf-btn');
  if(!b)return;
  const sheet=b.closest('.sheet');
  if(sheet&&sheet._key)downloadKeyPdf(sheet);
});

function keyHeaderHtml(){
  return '<div class="kh kh-row"><span>Řešení</span>'
    +'<span><span class="teacher-kicker">Učitelská část</span></span><button class="btn tiny soft key-pdf-btn" title="Stáhne samostatné PDF s klíčem (bez řádku Jméno, s upozorněním „nedávat studentům").">Stáhnout řešení (PDF)</button></div>';
}
function downloadKeyPdf(sheet){
  const tier=TIERS[sheet._tierKey]||{name:'Verze'},data=pdfDataForSheet(sheet,tier.name+' verze — řešení',sheet._key||'',true);
  downloadPdf(data.title,data.text,data.opts);
}
async function toggleKey(sheet,btn){
  const box=sheet.querySelector('.keybox');
  if(sheet._key){
    if(!box.dataset.filled){box.innerHTML=keyHeaderHtml()+render(sheet._key);box.dataset.filled='1'}
    box.classList.toggle('show');
    return;
  }
  if(!requireApiKeyForAction('vytvoření řešení'))return;
  btn.disabled=true;const old=btn.innerHTML;btn.innerHTML='<span class="mini"></span>';
  try{
    const out=await callGemini([{text:"Ke každé úloze v tomto pracovním listu napiš stručné správné řešení / klíč. Vycházej výhradně z pracovního listu níže a zachovej jazyk úloh. Pokud úloha závisí na přiloženém obrazovém podkladu, pracuj s tím, co je na něm skutečně vidět; nic si nedomýšlej."+(typeof stemAnswerKeyPromptLine==='function'?stemAnswerKeyPromptLine(getSubjectValue()):'')+(typeof subjectAnswerKeyPromptLine==='function'?subjectAnswerKeyPromptLine(getSubjectValue()):'')+" Pouze klíč, očíslovaně podle úloh, bez úvodu.\n\nPRACOVNÍ LIST:\n"+sheet._text},...sheetVisualAiParts(sheet),...sheetMediaAiParts(sheet)],{thinking:THINKING_CHEAP,operation:'answer-key-generation'});
    sheet._key=out;if(sheet._parts)sheet._parts.answerKey=out;
    sheet._validation=validateWorksheetResponse({worksheet:sheet._text,answerKey:out,parts:{...(sheet._parts||{}),answerKey:out},structured:!!sheet._structured,structureType:sheet._structured?'json':'fallback'});showStructureWarning(sheet,sheet._validation);
    box.innerHTML=keyHeaderHtml()+render(out);box.dataset.filled='1';
    box.classList.add('show');attachSheetTools(sheet);
  }catch(err){box.innerHTML='<div class="err">'+esc(friendlyApiMessage(err))+'</div>';box.classList.add('show')}
  finally{btn.disabled=false;btn.innerHTML=old}
}


function getOptionState(){return {
  useCefr:!!($('#cefr')&&$('#cefr').checked&&subjectAllowsCefr())
}}
function filenameSafe(s){return String(s||'pracovni-list').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase()||'pracovni-list'}
function printFileNameFromTitle(s){
  let v=String(s||'Pracovní list').normalize('NFC').replace(/[\u0000-\u001f<>:\"/\\|?*]+/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/g,'');
  if(!v)v='Pracovní list';
  if(/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(v))v='Pracovní list - '+v;
  return v.slice(0,120).trim()||'Pracovní list';
}
const UiState={
  setSheetStatus(sheet,text,state){const el=sheet.querySelector('.sheet-status');if(!el)return;el.textContent=text||'';el.className='sheet-status '+(state||'')}
};
function setSheetStatus(sheet,text,state){UiState.setSheetStatus(sheet,text,state)}
const PromptBuilder={
  makeTierPrompt(key,base,batch=1){
    const t=TIERS[key], opt=getOptionState();
    const tierInstruction=(key==='core'&&batch>1)?'Vytvoř NORMÁLNÍ referenční verzi celé sady: zachovej původní obsah, příklady, data, počet položek, pořadí, formát odpovědí, strukturu i obtížnost. Nepřidávej ani neubírej oporu; měň jen to, co je nezbytné pro čisté a použitelné zpracování.':t.instr;
    const subject=getSubjectValue()||"daný předmět / obor";
    const add=[
      variantModePromptLine(key,batch),
      'U otevřených úloh ponech přiměřené místo na odpověď žáka.',
      opt.useCefr?'CEFR použij pouze jako jazykovou obtížnost; u nejazykových předmětů CEFR nepoužívej.':'CEFR nepoužívej; pracuj jen s obecnou úrovní obtížnosti.',
      ...advancedPromptLines(key),
      ...(typeof stemGenerationPromptLines==='function'?stemGenerationPromptLines(subject):[]),
      ...(typeof subjectGenerationPromptLines==='function'?subjectGenerationPromptLines(subject):[]),
      ...(typeof educationalVisualPromptLines==='function'?educationalVisualPromptLines(subject):[]),
      ...sourceVisualPromptLines(),
      ...sourceMediaPromptLines()
    ];
    const jsonSchema=[
      'VNITŘNÍ STRUKTURA VÝSTUPU: Odpověz pouze platným JSON objektem bez Markdownu, bez komentáře před/po a bez code fence. Použij přesně tyto klíče. Hodnoty piš jako textové řetězce; pokud poznámka pro učitele není nutná, nech teacher_note prázdné.',
      '{',
      '  "worksheet_title": "výrazný, přirozený hlavní nadpis pro žáky; preferuj skutečné téma před technickým označením varianty",',
      '  "student_instructions": "instrukce pro žáky, které mají být vidět v pracovním listu",',
      '  "tasks": "samotné očíslované úlohy / cvičení v čisté podobě pro žáky",',
      '  "answer_key": "stručný klíč/řešení podle úloh, ve stejném pořadí",',
      '  "teacher_note": "volitelná krátká poznámka pro učitele; nevkládej sem nic, co má být v žákovské verzi"',
      '}'
    ].join('\n');
    return [
      'Jsi zkušený učitel ('+subject+'). Z následujícího zadání vytvoř jeho odstupňovanou verzi.',
      tierInstruction+(opt.useCefr?' '+t.cefr:''),
      add.length?'DOPLŇUJÍCÍ NASTAVENÍ:\n- '+add.join('\n- '):'',
      'JAZYK A ODBORNOST: Zachovej přesně jazyk nebo kombinaci jazyků původního zadání u každé úlohy. Nepřekládej žádný cizojazyčný ani odborný text do češtiny. Diferencuj obtížnost, oporu a formulaci, ne předmětovou pravdivost. Zachovej odbornou terminologii, symboly, vzorce, jednotky, značky, data, tabulky a standardní zápis daného předmětu. Pokud je některá část česky nebo přidáváš českou instrukci, čeština musí být bezchybná: gramaticky, stylisticky i lexikálně, bez hovorových neobratností, bez kalků, bez pravopisných a interpunkčních chyb. Tučně (**takto**) zvýrazni jen názvy jednotlivých úloh; hlavní nadpis patří samostatně do worksheet_title.',
      'HLAVNÍ NADPIS: pokud originál obsahuje skutečný název tématu/testu, zachovej jej nebo ho jen lehce zpřesni. Nadpis má být krátký, výrazný a přirozený pro žáky. Nepřidávej technické dodatky typu „Parallel Version“, „Parallel Variant“, „Normální verze“, „Jednodušší verze“ nebo „Obtížnější verze“ — úroveň zobrazuje aplikace zvlášť.',
      'PŘED ODEVZDÁNÍM: bez dalšího komentáře si interně ověř, že všechny úlohy jsou řešitelné, answer_key odpovídá každé úloze, případné bodování je konzistentní a žádná část původní struktury omylem nechybí. U STEM materiálu přepočítej všechny výpočty ještě jednou nezávislou cestou; chybný výsledek se nesmí dostat do klíče.',
      jsonSchema,
      'PŮVODNÍ ZADÁNÍ:',
      base
    ].filter(Boolean).join('\n\n');
  }
};
function makePromptForTier(key,base,batch=1){return PromptBuilder.makeTierPrompt(key,base,batch)}

const ZAP='<span class="zap-cost">⚡ 1</span>';
function setRichText(el,text){setRichTextWithVisuals(el,text,[])}
function renderSheetBody(sheet){
  const body=sheet&&sheet.querySelector('.body');if(!body)return;
  const parts=sheet._parts||{},title=String(parts.title||'').trim(),instructions=String(parts.instructions||'').trim(),tasks=String(parts.tasks||'').trim();
  if(sheet._structured&&(title||instructions||tasks)){
    const nodes=[];
    if(title){const h=document.createElement('div');h.className='worksheet-title';h.textContent=title;nodes.push(h);}
    if(instructions){const i=document.createElement('div');i.className='worksheet-instructions';setRichTextWithVisuals(i,instructions,sheet._visualAssets||[],sheet._mediaSource);nodes.push(i);}
    if(tasks){const t=document.createElement('div');t.className='worksheet-tasks';setRichTextWithVisuals(t,tasks,sheet._visualAssets||[],sheet._mediaSource);nodes.push(t);}
    body.replaceChildren(...nodes);return;
  }
  setRichTextWithVisuals(body,sheet._text||'',sheet._visualAssets||[],sheet._mediaSource);
}
function renderTeacherNote(sheet){
  const box=sheet&&sheet.querySelector('.teacherbox');if(!box)return;
  const note=sheet._parts&&String(sheet._parts.teacherNote||'').trim();
  box.innerHTML=note?'<div class="kh"><span class="teacher-kicker">Učitelská část</span> Poznámka pro učitele</div>'+render(note):'';
  box.classList.toggle('show',!!note);
}
function snapshotSheet(sheet){return {tierKey:sheet._tierKey,text:sheet._text,key:sheet._key,quality:sheet._quality,qualityStage:sheet._qualityStage||'none',qualityApplied:[...(sheet._qualityApplied||[])],finalAuditUsed:!!sheet._finalAuditUsed,scoringMode:sheet._scoringMode||'none',manualScores:{...(sheet._manualScores||{})},visualAssets:(sheet._visualAssets||[]).map(cloneVisualAsset).filter(Boolean),mediaSource:cloneMediaSource(sheet._mediaSource,true),parts:JSON.parse(JSON.stringify(sheet._parts||{})),structured:sheet._structured,validation:JSON.parse(JSON.stringify(sheet._validation||{ok:true,issues:[]})),html:sheet.innerHTML,statusClass:sheet.className,pdfWarningSkipped:sheet._pdfWarningSkipped}}
function restoreSheetSnapshot(sheet,snap){sheet._tierKey=snap.tierKey;sheet._text=snap.text;sheet._key=snap.key;sheet._quality=snap.quality;sheet._qualityStage=snap.qualityStage||'none';sheet._qualityApplied=[...(snap.qualityApplied||[])];sheet._finalAuditUsed=!!snap.finalAuditUsed;sheet._scoringMode=snap.scoringMode||'none';sheet._manualScores={...(snap.manualScores||{})};sheet._visualAssets=(snap.visualAssets||[]).map(cloneVisualAsset).filter(Boolean);sheet._mediaSource=cloneMediaSource(snap.mediaSource,true);sheet._parts=snap.parts;sheet._structured=snap.structured;sheet._validation=snap.validation;sheet._pdfWarningSkipped=snap.pdfWarningSkipped;sheet.className=snap.statusClass;sheet.innerHTML=snap.html;attachSheetTools(sheet)}
function makeSheet(key,loading){
  const t=TIERS[key];
  const sheet=document.createElement('div');
  sheet.className='sheet';sheet.dataset.t=t.color;sheet._tierKey=key;sheet._text='';sheet._key='';sheet._quality='';sheet._qualityStage='none';sheet._qualityApplied=[];sheet._finalAuditUsed=false;sheet._scoringMode='none';sheet._manualScores={};sheet._visualAssets=[];sheet._mediaSource=null;sheet._parts={title:'',instructions:'',tasks:'',answerKey:'',teacherNote:''};sheet._structured=false;sheet._validation={ok:true,issues:[]};sheet._pdfWarningSkipped=false;
  sheet.innerHTML='<div class="hd"><div class="tier-head"><span class="tier-icon">'+(t.icon||'📄')+'</span><span class="tier-text"><span class="nm">'+t.name+'</span>'+(t.cefrLbl?'<span class="level-badge">'+t.cefrLbl+'</span>':'')+'</span></div><span class="sheet-status '+(loading?'busy':'')+'">'+(loading?'generuji…':'připraveno')+'</span><span class="tools"></span></div><div class="student-section-head">Žákovská verze</div><div class="body">'+(loading?'<span class="muted"><span class="mini"></span> generuji…</span>':'')+'</div><div class="teacherbox"></div><div class="structurebox"></div><div class="keybox"></div><div class="qualitybox"></div>';
  attachSheetTools(sheet);
  return sheet;
}
function attachSheetTools(sheet){
  const tools=sheet.querySelector('.tools'); if(!tools)return; tools.innerHTML='';
  const tier=TIERS[sheet._tierKey]||{name:'Verze'};
  const mk=(label,fn,kind='',tip='',act='')=>{const b=document.createElement('button');b.className='btn tiny '+kind;b.innerHTML=label;if(tip)b.title=tip;if(act)b.dataset.act=act;b.onclick=()=>fn(b);return b};
  const main=document.createElement('span');main.className='tool-group primary';main.dataset.label='Doporučený postup';
  const more=document.createElement('span');more.className='tool-group secondary';more.dataset.label='Další úpravy';
  const qualityReady=!!sheet._quality,keyReady=!!sheet._key,qualityStage=sheet._qualityStage||'none';
  const qualityLabel=qualityReady?(qualityStage==='final'||qualityStage==='final-revised'?'Zobrazit finální kontrolu':'Zobrazit kontrolu'):'Kontrola '+ZAP;
  const qualityTip=qualityReady?(qualityStage==='revised'?'Zobrazí původní audit a nabídne jeden volitelný finální audit. PDF už další kontrolu nevynucuje.':'Zobrazí již hotový audit bez dalšího API dotazu.'):'Provede jeden souhrnný audit věcné a jazykové správnosti, řešení i bodování. Stojí 1 dotaz.';
  main.append(
    mk('1. '+qualityLabel,b=>checkQuality(sheet,b),'soft',qualityTip,'quality'),
    mk('2. '+(keyReady?'Zobrazit řešení':'Vytvořit řešení '+ZAP),b=>toggleKey(sheet,b),'soft',keyReady?'Zobrazí nebo skryje již vytvořený klíč bez dalšího API dotazu.':'Vytvoří klíč správných odpovědí. Stojí 1 dotaz.'),
    mk('3. Stáhnout PDF',()=>requestPdfForSheet(sheet,tier.name+' verze',sheet._text||''),'primary','Před PDF připomene kontrolu kvality. Potom otevře náhled a systémový dialog pro uložení nebo tisk.')
  );
  more.append(
    mk('Upravit',b=>toggleEdit(sheet,b),'soft','Umožní ručně přepsat text listu. Po skutečné změně se zahodí řešení, kontrola kvality i poznámka pro učitele.'),
    mk('Kopírovat',b=>copyText(sheet._text,b,'Zkopírováno','Kopírovat'),'soft','Zkopíruje celý text listu do schránky.')
  );
  tools.append(main,more);
}

async function repairWorksheetJson(raw,validation,base,key){
  const t=TIERS[key]||TIERS.core;
  const issues=(validation&&validation.issues||[]).join('\n- ');
  const prompt=[
    'Převeď následující odpověď modelu na čistý platný JSON podle přesného schématu. Neměň věcný obsah, jen oprav strukturu. Pokud chybí answer_key, vytvoř stručný klíč podle úloh. Odpověz pouze JSONem, bez Markdownu a bez komentáře.',
    'Schéma: worksheet_title, student_instructions, tasks, answer_key, teacher_note. Všechny hodnoty musí být textové řetězce.',
    'Cílová verze: '+(t.name||'Normální')+'.',
    issues?'Zjištěné problémy:\n- '+issues:'',
    'PŮVODNÍ ZADÁNÍ:\n'+String(base||'').slice(0,8000),
    'ODPOVĚĎ K OPRAVĚ:\n'+String(raw||'')
  ].filter(Boolean).join('\n\n');
  return callGemini([{text:prompt}],{json:true,operation:'worksheet-structure-repair'});
}

async function generateIntoSheet(sheet,key,base,idx,total){
  const t=TIERS[key];
  setSheetStatus(sheet,'generuji…','busy');
  sheet.querySelector('.body').innerHTML='<span class="muted"><span class="mini"></span> generuji…</span>';
  sheet.querySelector('.keybox').innerHTML='';sheet.querySelector('.keybox').classList.remove('show');delete sheet.querySelector('.keybox').dataset.filled;
  sheet.querySelector('.qualitybox').innerHTML='';sheet.querySelector('.qualitybox').classList.remove('show');
  const structureBox=sheet.querySelector('.structurebox');if(structureBox){structureBox.innerHTML='';structureBox.classList.remove('show')}
  setProgress((total>1?'Verze '+(idx+1)+' z '+total+': ':'Generuji ')+t.name.toLowerCase()+' verzi…',true);
  const sourceAssets=preservedSourceVisualAssets(),generationParts=[{text:makePromptForTier(key,base,total)},...generationVisualParts()];
  const out=await callGemini(generationParts,{json:true,operation:'worksheet-generation'});
  let parsed=ensureMediaSourceMarker(normalizeParsedVisuals(parseWorksheetResponse(out),sourceAssets));
  let validation=validateWorksheetResponse(parsed);
  if(!validation.ok){
    try{
      setProgress('Opravuji strukturu výstupu…',true);
      const fixed=await repairWorksheetJson(out,validation,base,key);
      const fixedParsed=ensureMediaSourceMarker(normalizeParsedVisuals(parseWorksheetResponse(fixed),sourceAssets));
      const fixedValidation=validateWorksheetResponse(fixedParsed);
      if(fixedParsed&&String(fixedParsed.worksheet||'').trim()&&(fixedValidation.ok||fixedValidation.issues.length<validation.issues.length)){
        parsed=fixedParsed;validation=fixedValidation;
      }
    }catch(_){/* původní výstup zůstane zachovaný a zobrazí se varování */}
  }
  if(!String(parsed&&parsed.worksheet||'').trim())throw makeAppError('Model nevrátil použitelný pracovní list. Původní výstup zůstává zachovaný.','INCOMPLETE_RESPONSE');
  const generatedScoringMode=scoringMode();parsed=normalizeParsedScoring(parsed,generatedScoringMode);parsed=ensureMediaSourceMarker(normalizeParsedVisuals(parsed,sourceAssets));validation=withDeterministicOutputValidation(validateWorksheetResponse(parsed),parsed);const mediaSafety=mediaStudentSafetyIssues(parsed,base);if(mediaSafety.length)throw makeAppError('Multimediální bezpečnost výstupu selhala: '+mediaSafety.join(' '),'MEDIA_TRANSCRIPT_LEAK');
  sheet._tierKey=key;sheet._scoringMode=generatedScoringMode;sheet._manualScores={};sheet._visualAssets=sourceAssets.map(cloneVisualAsset).filter(Boolean);sheet._mediaSource=cloneMediaSource(sourceMediaAsset,true);sheet._text=parsed.worksheet;sheet._key=parsed.answerKey;sheet._quality='';sheet._qualityStage='none';sheet._qualityApplied=[];sheet._finalAuditUsed=false;sheet._parts=parsed.parts||{title:'',instructions:'',tasks:parsed.worksheet,answerKey:parsed.answerKey,teacherNote:''};sheet._structured=!!parsed.structured;sheet._validation=validation;sheet._pdfWarningSkipped=false;
  renderSheetBody(sheet);
  renderTeacherNote(sheet);
  showStructureWarning(sheet,validation);
  attachSheetTools(sheet);
  setSheetStatus(sheet,validation.ok?'hotovo · zkontroluj':'hotovo · ověř strukturu',validation.ok?'needcheck':'warn');
}
function recordDifferentiatorTelemetry(attempted,successful,failed,cancelled=0){
  if(IS_TEST_MODE)return;
  if(!window.GHRABTelemetry){try{console.info('Telemetrie není dostupná mimo AI Studio.')}catch(_){}return}
  try{
    window.GHRABTelemetry?.recordOutput({
      outputKind:'worksheet-variant',
      attemptedQuantity:attempted,
      successfulQuantity:successful,
      failedQuantity:failed,
      cancelledQuantity:cancelled,
      outcome:failed&&successful?'partial':failed?'error':successful?'success':'cancelled'
    });
  }catch(error){console.warn('Telemetrie Diferenciátoru se nezapsala.',error);}
}
function parseQualityAudit(text){
  const lines=String(text||'').split(/\r?\n/).map(l=>l.replace(/^\s*[-*•]\s*/,'').trim()).filter(Boolean);
  const cls=l=>{const x=l.toLowerCase();if(/^ok\b|^v pořádku|^✓/.test(x))return 'qa-ok';if(/^oprav|^chyb|^opravit/.test(x))return 'qa-fix';if(/^doporuč|^zváž|^zvaž/.test(x))return 'qa-rec';return 'qa-plain'};
  const tag=k=>k==='qa-ok'?'OK':k==='qa-fix'?'Opravit':k==='qa-rec'?'Doporučení':'';
  return lines.map((line,index)=>{const kind=cls(line),label=tag(kind),labelled=/^(?:ok|oprav\w*|doporuč\w*|zváž|zvaž)\s*[:：]\s*/i.test(line),body=labelled?line.replace(/^[^:：]{1,14}[:：]\s*/,''):line;return {index,kind,label,body:body||line,raw:line,selectable:kind==='qa-fix'||kind==='qa-rec'};});
}
function renderQualityAudit(text,interactive=false,appliedIndexes=[]){
  const applied=new Set((appliedIndexes||[]).map(Number));
  return parseQualityAudit(text).map(item=>{
    const isApplied=applied.has(item.index);
    const choice=interactive&&item.selectable?'<input class="qa-choice" type="checkbox" data-qa-index="'+item.index+'" aria-label="Vybrat návrh k zapracování"'+(isApplied?' checked disabled':'')+'>':'';
    const appliedTag=isApplied?'<span class="qa-applied">zapracováno</span>':'';
    const content=(item.label?'<span class="qa-tag">'+item.label+'</span>':'')+esc(item.body)+appliedTag;
    return '<label class="qa-item '+item.kind+(item.selectable?' selectable':'')+(isApplied?' applied':'')+'">'+choice+'<span class="qa-copy">'+content+'</span></label>';
  }).join('');
}
const QualityCheck={
  makePrompt(sheet,finalPass=false){
    const parts=sheet._parts||{};
    const structuredContext=sheet._structured?([
      '',
      'VNITŘNÍ ČÁSTI PRO KONTROLU:',
      'NÁZEV:', parts.title||'',
      '',
      'INSTRUKCE PRO ŽÁKY:', parts.instructions||'',
      '',
      'ÚLOHY:', parts.tasks||'',
      '',
      'POZNÁMKA PRO UČITELE:', parts.teacherNote||''
    ].join('\n')):'';
    const validationContext=(sheet._validation&&!sheet._validation.ok)?([
      '',
      'STRUKTURNÍ UPOZORNĚNÍ APLIKACE:',
      '- '+sheet._validation.issues.join('\n- '),
      'Při kontrole výslovně ověř, zda tento problém neohrožuje použitelnost materiálu.'
    ].join('\n')):'';
    return [
      finalPass?'Toto je VOLITELNÁ FINÁLNÍ kontrola po zapracování předchozích oprav. Hledej jen skutečné zbývající chyby a rozpory, ne nové stylistické preference.':'Zkontroluj tento pracovní list nebo test před použitím ve škole. Jde o HLAVNÍ kontrolu a cílem je zachytit všechny konkrétní problémy už v tomto jediném průchodu.',
      'V rámci tohoto jednoho požadavku proveď interně dva průchody: nejprve systematicky projdi každou úlohu, instrukci, bodování a odpověď v klíči; potom znovu projdi celý materiál jako celek a sluč duplicitní nálezy. Neodkládej další skutečné chyby na budoucí kontrolu a nevracej jen náhodný vzorek problémů.',
      ...(typeof stemQualityPromptLines==='function'?stemQualityPromptLines(getSubjectValue()):[]),
      ...(typeof subjectQualityPromptLines==='function'?subjectQualityPromptLines(getSubjectValue()):[]),
      'Zaměř se na: 1) věcnou správnost a zachování odborného zápisu, 2) soulad s požadovanou diferenciací a zvolenou variantou, 3) jazykovou správnost, 4) úplnost a použitelnost řešení, 5) rizika nejasného zadání, 6) přiměřenost rozsahu a času, 7) zachování formátu, počtu úloh a bodování tam, kde bylo v originálu, a konzistenci nově navržených bodů, 8) přítomnost hlavního pedagogického cíle a ověřovaných dovedností, 9) možná citlivá data, jména žáků nebo údaje, které je vhodné anonymizovat, 10) pokud jsou přiložené mapy, grafy, schémata nebo jiné obrazy, zda zadání skutečně odpovídá tomu, co je na nich vidět, a zda je materiál bez nich řešitelný tak, jak má být.',
      'ODBORNÉ RENDERERY: pokud text obsahuje [[EDU_...|{...}]], ověř, že JSON marker je platný a jeho data přesně souhlasí se zadáním i answer_key; vizuál nesmí zobrazovat jiné hodnoty, body, vazby, noty nebo zvýraznění než text.',
      'Každé tvrzení Opravit musí být konkrétní a skutečně opravitelné. Doporučení používej jen pro užitečné nepovinné zlepšení; nevytvářej další práci jen kvůli stylu. Pokud je vše správně, napiš to jako OK a nevymýšlej problém.',
      'Pokud jsou v textu české pasáže, uplatni nulovou toleranci ke gramatickým, stylistickým a lexikálním chybám.',
      'Vrať krátký audit v češtině, každý bod na samostatném řádku, každý řádek začni jedním ze štítků OK: / Opravit: / Doporučení: podle závažnosti. Bez úvodu a bez závěru.',
      structuredContext,
      validationContext,
      'PRACOVNÍ LIST:',
      sheet._text||'',
      'ŘEŠENÍ:',
      sheet._key||''
    ].filter(x=>x!==null&&x!==undefined&&String(x).length).join('\n\n');
  }
};
const QualityRevision={
  makePrompt(sheet,suggestions){
    const t=TIERS[sheet._tierKey]||TIERS.core,parts=sheet._parts||{};
    return [
      'Jsi zkušený učitel. Uprav již vytvořený pracovní list POUZE podle níže vybraných bodů kontroly kvality.',
      'Cílová úroveň zůstává: '+t.name+'. Neměň výukový cíl, téma, jazyk ani jiné části jen proto, že bys je sám formuloval jinak. Nevybrané návrhy auditu nejsou pokyn k úpravě.',
      'VYBRANÉ BODY K ZAPRACOVÁNÍ:\n- '+suggestions.map(x=>x.body).join('\n- '),
      'Po zapracování proveď ještě v rámci TÉHOŽ požadavku interní závěrečné ověření: zkontroluj, že oprava nezavedla nový rozpor, že všechny odpovědi v answer_key stále sedí k úlohám a že případné bodování je konzistentní. U STEM materiálu znovu přepočítej změněné výsledky, jednotky a rovnice. Výstup už dál nerozebírej; vrať rovnou čistou opravenou verzi.',
      ...(typeof stemQualityPromptLines==='function'?stemQualityPromptLines(getSubjectValue()):[]),
      ...(typeof subjectQualityPromptLines==='function'?subjectQualityPromptLines(getSubjectValue()):[]),
      (sheet._visualAssets&&sheet._visualAssets.length)?'OBRAZOVÉ PODKLADY: zachovej všechny existující markery [[VISUAL_n]] na smysluplném místě. Původní obrazy se nesmí překreslit ani nahradit textovou imitací; aplikace je vloží sama.':'',
      sheet._mediaSource?'MULTIMÉDIA: zachovej marker [[MEDIA_SOURCE]]. Do student_instructions ani tasks nepřenášej transkript, titulky ani popis odpovědí ze zdrojového audia/videa; ty patří nanejvýš do answer_key nebo teacher_note.':'',
      'ODBORNÉ RENDERERY: existující [[EDU_...|{...}]] marker zachovej jako jeden samostatný řádek s platným JSON. Pokud oprava mění data úlohy, aktualizuj marker i answer_key konzistentně; pokud data nemění, marker svévolně neupravuj.',
      'Vrať pouze platný JSON objekt bez Markdownu se stejnými klíči: worksheet_title, student_instructions, tasks, answer_key, teacher_note. Všechny hodnoty jsou textové řetězce. Pokud úprava změní správnou odpověď, aktualizuj answer_key.',
      'AKTUÁLNÍ NÁZEV:\n'+(parts.title||''),
      'AKTUÁLNÍ INSTRUKCE:\n'+(parts.instructions||''),
      'AKTUÁLNÍ ÚLOHY / PRACOVNÍ LIST:\n'+(parts.tasks||sheet._text||''),
      'AKTUÁLNÍ ŘEŠENÍ:\n'+(sheet._key||parts.answerKey||''),
      'AKTUÁLNÍ POZNÁMKA PRO UČITELE:\n'+(parts.teacherNote||'')
    ].join('\n\n');
  }
};
let qualityActiveSheet=null;
function updateQualitySelectionState(){
  const selected=[...document.querySelectorAll('#qualityBody .qa-choice:checked:not(:disabled)')];const btn=$('#qualityApply');if(btn)btn.disabled=!selected.length;
  const hint=$('#qualitySelectionHint');if(hint)hint.textContent=selected.length?'Vybráno k zapracování: '+selected.length+'. Zaškrtni ideálně všechny požadované opravy najednou — vznikne jeden opravný request.':'Zaškrtni pouze návrhy, které chceš zapracovat. Již zapracované položky jsou uzamčené; položky „OK“ se nemění.';
}
function openQuality(sheet){
  qualityActiveSheet=sheet;
  const tier=TIERS[sheet._tierKey]||{name:'Verze'},stage=sheet._qualityStage||'initial';
  const lbl=stage==='final'||stage==='final-revised'?'finální audit':stage==='revised'?'původní audit · opravy už byly zapracovány':'hlavní audit před použitím ve škole';
  $('#qualityTierLbl').textContent=tier.name+' verze · '+lbl+'.';
  $('#qualityBody').innerHTML=renderQualityAudit(sheet._quality,true,sheet._qualityApplied||[]);
  document.querySelectorAll('#qualityBody .qa-choice').forEach(cb=>cb.addEventListener('change',updateQualitySelectionState));
  const finalBtn=$('#qualityFinalRun');if(finalBtn)finalBtn.classList.toggle('hide',!(stage==='revised'&&!sheet._finalAuditUsed));
  updateQualitySelectionState();
  $('#qualityOverlay').classList.add('show');
}
async function runQualityAudit(sheet,btn,finalPass=false){
  if(!requireApiKeyForAction(finalPass?'finální kontrolu kvality':'kontrolu kvality'))return false;
  btn.disabled=true;const old=btn.innerHTML;btn.innerHTML='<span class="mini"></span>';
  try{
    const prompt=QualityCheck.makePrompt(sheet,finalPass);
    const out=await callGemini([{text:prompt},...sheetVisualAiParts(sheet),...sheetMediaAiParts(sheet)],{thinking:THINKING_DEFAULT,operation:'worksheet-quality-audit'});
    sheet._quality=out;sheet._qualityApplied=[];
    if(finalPass){sheet._qualityStage='final';sheet._finalAuditUsed=true;setSheetStatus(sheet,'finálně zkontrolováno','ok');}
    else{sheet._qualityStage='initial';setSheetStatus(sheet,'zkontrolováno','ok');}
    attachSheetTools(sheet);openQuality(sheet);return true;
  }catch(err){showMessage('Kontrola se nepodařila',friendlyApiMessage(err));return false}
  finally{btn.disabled=false;btn.innerHTML=old}
}
async function checkQuality(sheet,btn){
  if(sheet._quality){openQuality(sheet);return}
  await runQualityAudit(sheet,btn,false);
}
async function runFinalQualityCheck(){
  const sheet=qualityActiveSheet,btn=$('#qualityFinalRun');if(!sheet||!btn||sheet._finalAuditUsed)return;
  await runQualityAudit(sheet,btn,true);
}
async function applySelectedQualitySuggestions(){
  if(!qualityActiveSheet)return;
  const parsedAudit=parseQualityAudit(qualityActiveSheet._quality),already=new Set((qualityActiveSheet._qualityApplied||[]).map(Number)),indexes=[...document.querySelectorAll('#qualityBody .qa-choice:checked:not(:disabled)')].map(cb=>Number(cb.dataset.qaIndex)).filter(i=>Number.isInteger(i)&&!already.has(i)),selected=indexes.map(i=>parsedAudit.find(x=>x.index===i)).filter(Boolean);
  if(!selected.length)return;
  if(!requireApiKeyForAction('zapracování vybraných bodů kontroly'))return;
  const btn=$('#qualityApply'),oldNodes=[...btn.childNodes].map(n=>n.cloneNode(true)),sheet=qualityActiveSheet,snapshot=snapshotSheet(sheet),wasFinal=sheet._qualityStage==='final'||sheet._qualityStage==='final-revised';btn.disabled=true;const spin=document.createElement('span');spin.className='mini';btn.replaceChildren(spin,document.createTextNode(' Zapracovávám…'));
  try{
    const raw=await callGemini([{text:QualityRevision.makePrompt(sheet,selected)},...sheetVisualAiParts(sheet),...sheetMediaAiParts(sheet)],{json:true,operation:'worksheet-quality-revision'});
    let parsed=normalizeParsedVisuals(parseWorksheetResponse(raw),sheet._visualAssets||[]),validation=validateWorksheetResponse(parsed);
    if(!validation.ok){
      try{const fixed=await repairWorksheetJson(raw,validation,$('#baseText').value.trim(),sheet._tierKey),fp=normalizeParsedVisuals(parseWorksheetResponse(fixed),sheet._visualAssets||[]),fv=validateWorksheetResponse(fp);if(fp&&String(fp.worksheet||'').trim()&&(fv.ok||fv.issues.length<validation.issues.length)){parsed=fp;validation=fv}}catch(_){}
    }
    if(!String(parsed&&parsed.worksheet||'').trim())throw makeAppError('Model nevrátil použitelnou upravenou verzi. Původní výstup zůstal zachovaný.','INCOMPLETE_RESPONSE');
    parsed=normalizeParsedScoring(parsed,sheetScoringMode(sheet));parsed=ensureMediaSourceMarker(normalizeParsedVisuals(parsed,sheet._visualAssets||[]));validation=withDeterministicOutputValidation(validateWorksheetResponse(parsed),parsed);const mediaSafety=mediaStudentSafetyIssues(parsed,$('#baseText').value.trim());if(mediaSafety.length)throw makeAppError('Úprava by odhalila zdrojový přepis v žákovské části: '+mediaSafety.join(' '),'MEDIA_TRANSCRIPT_LEAK');sheet._manualScores={};
    sheet._text=parsed.worksheet;sheet._key=parsed.answerKey||'';sheet._qualityApplied=[...already,...indexes];sheet._qualityStage=wasFinal?'final-revised':'revised';sheet._finalAuditUsed=wasFinal?true:!!sheet._finalAuditUsed;sheet._parts=parsed.parts||{title:'',instructions:'',tasks:parsed.worksheet,answerKey:parsed.answerKey||'',teacherNote:''};sheet._structured=!!parsed.structured;sheet._validation=validation;sheet._pdfWarningSkipped=false;
    renderSheetBody(sheet);renderTeacherNote(sheet);showStructureWarning(sheet,validation);const kb=sheet.querySelector('.keybox');if(kb){kb.innerHTML='';kb.classList.remove('show');delete kb.dataset.filled}const qb=sheet.querySelector('.qualitybox');if(qb){qb.innerHTML='';qb.classList.remove('show')}attachSheetTools(sheet);
    if(wasFinal){setSheetStatus(sheet,'finální opravy zapracovány · ověř učitelem','ok');showMessage('Finální opravy zapracovány','Další automatickou kontrolu už aplikace nenabízí, aby nevznikla smyčka dotazů. Projdi výsledek jako učitel a můžeš přejít k řešení nebo PDF.');}
    else{setSheetStatus(sheet,'opravy zapracovány · finální kontrola volitelná','ok');showMessage('Vybrané návrhy zapracovány','Další kontrola není povinná. Pokud chceš nezávislý druhý průchod, otevři Kontrolu a jednou použij „Finální kontrola“. Jinak výsledek ručně ověř a můžeš přejít k řešení nebo PDF.');}
    $('#qualityOverlay').classList.remove('show');qualityActiveSheet=null;
  }catch(err){restoreSheetSnapshot(sheet,snapshot);showMessage('Úprava se nepodařila',friendlyApiMessage(err)+' Původní verze zůstala zachovaná.');}
  finally{btn.disabled=false;btn.replaceChildren(...oldNodes)}
}
$('#qualityClose').addEventListener('click',()=>$('#qualityOverlay').classList.remove('show'));
$('#qualityOverlay').addEventListener('click',e=>{if(e.target.id==='qualityOverlay')$('#qualityOverlay').classList.remove('show')});
$('#qualityApply').addEventListener('click',applySelectedQualitySuggestions);
const qualityFinalRun=$('#qualityFinalRun');if(qualityFinalRun)qualityFinalRun.addEventListener('click',runFinalQualityCheck);


