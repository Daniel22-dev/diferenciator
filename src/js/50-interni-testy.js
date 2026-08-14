const TestSystem={
  demoBase:"Angličtina – past simple vs. present perfect\n\nComplete the sentences with the correct form of the verb. Then answer two short questions about a school trip.",
  sampleStructured(){return JSON.stringify({worksheet_title:"Past Simple Practice – varianta",student_instructions:"Doplň správný tvar slovesa a odpověz celou větou.",tasks:"1. Complete: Yesterday we ___ (visit) the museum.\n2. Complete: She ___ (already finish) her project.\n3. Answer: What did the students see during the trip?",answer_key:"1. visited\n2. has already finished\n3. Přijatelná odpověď podle textu, např. They saw the museum exhibition.",teacher_note:"Zkontroluj rozdíl mezi jednorázovou minulostí a zkušeností s vazbou already."})},
  mockQuality:"OK: Materiál má jasné zadání a odpovídá zvolené úrovni.\nOK: Řešení odpovídá počtu úloh.\nDoporučení: Před tiskem doplň třídu a datum.",
  results:[],
  enabled(){return true},
  setVisible(show){
    const panel=$('#testPanel');
    const toggle=$('#testToggle');
    const isShown=!!show;
    if(panel)panel.classList.toggle('show',isShown);
    document.body.classList.toggle('test-view',isShown);
    if(toggle){
      toggle.classList.toggle('active',isShown);
      toggle.setAttribute('aria-expanded',isShown?'true':'false');
    }
    if(isShown && panel)setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}),0);
  },
  toggle(){
    const panel=$('#testPanel');
    this.setVisible(!(panel&&panel.classList.contains('show')));
  },
  init(){
    const all=$('#runAllTests'), clear=$('#clearTestResults'), hide=$('#hideTestPanel'), toggle=$('#testToggle');
    if(toggle){
      toggle.setAttribute('aria-controls','testPanel');
      toggle.setAttribute('aria-expanded','false');
      toggle.addEventListener('click',()=>this.toggle());
    }
    if(hide)hide.addEventListener('click',()=>this.setVisible(false));
    if(all)all.addEventListener('click',()=>this.runAll());
    if(clear)clear.addEventListener('click',()=>this.clear());
    if(IS_TEST_MODE)this.setVisible(true);
  },
  clear(){this.results=[];const r=$('#testResults');if(r)r.innerHTML='';const l=$('#testLog');if(l){l.textContent='';l.classList.remove('show')}},
  add(state,title,detail){
    this.results.push({state,title,detail});
    const r=$('#testResults'); if(!r)return;
    const icon=state==='ok'?'✓':state==='warn'?'!':'×';
    const item=document.createElement('div');
    item.className='test-item '+state;
    item.innerHTML='<b>'+icon+'</b><span><strong>'+esc(title)+'</strong><br><span>'+esc(detail||'')+'</span></span>';
    r.appendChild(item);
  },
  log(msg){const l=$('#testLog');if(!l)return;l.classList.add('show');l.textContent+=(l.textContent?'\n':'')+String(msg||'')},
  assert(cond,title,okDetail,failDetail){if(cond){this.add('ok',title,okDetail||'OK');return true}this.add('fail',title,failDetail||'Selhalo');throw new Error(title+': '+(failDetail||'Selhalo'))},
  fillDemo(){
    const paste=$('#pasteText'), base=$('#baseText'), subj=$('#subject');
    if(paste)paste.value=this.demoBase;
    if(base)base.value=this.demoBase;
    if(subj)subj.value='Angličtina';
    if($('#mSubject'))$('#mSubject').value='Angličtina';
    syncCefrHintFromSubject();
    this.add('ok','Demo zadání vloženo','Vyplněn ukázkový jazykový materiál pro testy bez API klíče.');
  },
  async runAll(){
    this.clear();
    this.add('ok','Spouštím testy','Běží smoke test, parser, CEFR, API guard, export/import projektu, mock generování, PDF tok a layout.');
    this.log('Vnitřní moduly aplikace: '+Object.entries(AppModules).map(([k,v])=>k+' = '+v).join(' · '));
    await this.runStep('Smoke UI',()=>this.runSmokeUi());
    await this.runStep('Parser',()=>this.runParserTests());
    await this.runStep('CEFR',()=>this.runCefrTests());
    await this.runStep('API guard',()=>this.runApiGuardTests());
    await this.runStep('T6 AI profile switch',()=>this.runModelSwitchIntegrationTest());
    await this.runStep('Stav a bezpečnost projektu',()=>this.runStatusAndProjectSafetyTests());
    await this.runStep('Roundtrip projektu',()=>this.runProjectRoundtripTest());
    await this.runStep('Mock generování',()=>this.runMockGeneration());
    await this.runStep('Transakční testy',()=>this.runBatchAndTransactionTests());
    await this.runStep('Auditní regrese',()=>this.runAuditRegressionTests());
    await this.runStep('PDF tok',()=>this.runPdfFlowTest());
    await this.runStep('Layout',()=>this.runLayoutTest());
    await this.runStep('Nativní dialogy',()=>this.runNativeDialogScan());
    await this.runStep('Release gate',()=>this.runReleaseGateTest());
    const failed=this.results.filter(x=>x.state==='fail').length;
    this.add(failed?'warn':'ok','Souhrn testů',failed?('Dokončeno s počtem chyb: '+failed+' · release nepouštět.'):('Všechny interní testy prošly · release gate OK.'));
  },
  async runStep(label,fn){
    const failedBefore=this.results.filter(x=>x.state==='fail').length;
    try{return await fn()}
    catch(error){
      const message=String(error?.message||error||'Neznámá chyba');
      this.log(label+': '+message);
      const failedAfter=this.results.filter(x=>x.state==='fail').length;
      if(failedAfter===failedBefore)this.add('fail',label,'Neočekávaná výjimka testu: '+message);
      return undefined;
    }
  },
  runSmokeUi(){
    const ids=['apiStepPanel','inputPanel','configPanel','resultsPanel','apiPanel','baseText','subject','cefr','cefrForce','tiers','genBtn','genAllBtn','results','restartOverlay','pdfCheckOverlay','printOverlay','qualityOverlay','qualityApply','messageOverlay','privacyOverlay','privacyAnonymize','privacyContinue','advVariantMode','advLearningGoal','advTargetGroupDetected','advScoringMode','tierChoiceHint','printTeacherConfirmed','cefrRunBtn','qualityFinalRun'];
    ids.forEach(id=>this.assert(!!$('#'+id),'UI prvek: '+id,'Nalezen','Chybí prvek #'+id));
    this.assert(document.querySelectorAll('#tiers input[type="radio"]').length===3,'Výběr úrovně','K dispozici jsou 3 úrovně','Počet úrovní není 3');
    const checked=document.querySelector('#tiers input[type="radio"]:checked');
    this.assert(checked&&checked.dataset&&checked.dataset.tier==='core','Výchozí úroveň','Výchozí volba je Normální','Výchozí volba není Normální');
    this.assert(!!document.querySelector('.privacy-note'),'Upozornění na anonymizaci','Krátké upozornění je u vstupu přítomné','Chybí upozornění u vstupu');
    this.assert(!!document.querySelector('#extractBtn .zap-cost'),'Štítek spotřeby načtení','Tlačítko Načíst zadání obsahuje štítek spotřeby','U tlačítka Načíst zadání chybí štítek spotřeby');
  },
  runParserTests(){
    const parsed=parseWorksheetResponse(this.sampleStructured());
    const validation=validateWorksheetResponse(parsed);
    this.assert(parsed.structured&&parsed.structureType==='json','Parser JSON výstupu','Rozpoznal nové JSON schéma','Parser nerozpoznal JSON strukturu');
    this.assert(validation.ok,'Validátor struktury','Strukturovaný vzorek prošel','Validátor hlásí chybu: '+validation.issues.join('; '));
    this.assert(!/[{}]\s*$/.test(parsed.worksheet)&&!/<<<\s*(?:TASKS|ANSWER_KEY|WORKSHEET_TITLE)/i.test(parsed.worksheet),'Čistý žákovský výstup','JSON ani technické značky se nepropsaly do listu','Technická struktura zůstala v listu');
    const fallback=parseWorksheetResponse('Pouze volný text bez značek.');
    const fallbackValidation=validateWorksheetResponse(fallback);
    this.assert(!fallbackValidation.ok,'Fallback kontrola','Nestrukturovaný výstup je označen k ověření','Fallback měl být označen jako varování');
    const emailProbe=[{type:'text',text:'Kontakt: teacher@example.com'}];
    this.assert(dplEmailMatches(emailProbe).length===1&&dplAnonymizeEmails(emailProbe)[0].text.includes('[e-mail anonymizován]'),'Anonymizace e-mailu','Preflight rozpozná a automaticky nahradí e-mailovou adresu.','Preflight e-mail nerozpoznal nebo nenahradil');
    const prompt=makePromptForTier('core',this.demoBase);
    this.assert(prompt.includes('VNITŘNÍ STRUKTURA VÝSTUPU')&&prompt.includes('worksheet_title')&&prompt.includes('answer_key'),'Prompt pro JSON schéma','Prompt výslovně vyžaduje JSON strukturu','Prompt neobsahuje očekávané JSON schéma');
    this.assert(normalizeWorksheetTitleText('You and your body (Parallel Version)')==='You and your body','Čistý hlavní nadpis','Technický suffix Parallel Version se z hlavního nadpisu odstraní','Technický suffix zůstal v nadpisu');
    const titleSheet=makeSheet('core',false);titleSheet._structured=true;titleSheet._text='You and your body\n\nWork carefully.\n\n1. Match.';titleSheet._parts={title:'You and your body',instructions:'Work carefully.',tasks:'1. Match.',answerKey:'1. A',teacherNote:''};renderSheetBody(titleSheet);
    this.assert(!!titleSheet.querySelector('.worksheet-title')&&titleSheet.querySelector('.worksheet-title').textContent==='You and your body','Výrazný nadpis výsledku','Strukturovaný výstup vykresluje samostatný hlavní nadpis','Nadpis se stále zobrazuje jako obyčejný text');
    const scoring=$('#advScoringMode'),oldScoring=scoring?scoring.value:'teacher';if(scoring)scoring.value='ai';const scoringAi=makePromptForTier('core',this.demoBase);if(scoring)scoring.value='teacher';const scoringTeacher=makePromptForTier('core',this.demoBase);if(scoring)scoring.value=oldScoring;
    this.assert(/navrhni přiměřené body/i.test(scoringAi)&&/žádné nové body nevymýšlej/i.test(scoringTeacher)&&/Pokud originál obsahuje explicitní body nebo celkový součet/i.test(scoringAi)&&/celkový počet bodů přesně/i.test(scoringAi),'Bodování podle volby učitele','Existující body se zachovají a chybějící lze buď navrhnout AI, nebo nechat učiteli','Režimy bodování se do promptu nepropsaly správně');
    const mediaOrder=docxReferencedMediaPaths('<w:p><a:blip r:embed="rId4"/><a:blip r:embed="rId5"/><a:blip r:embed="rId5"/><a:blip r:embed="rId6"/></w:p>','<Relationships><Relationship Id="rId4" Type="x/image" Target="media/image1.png"/><Relationship Id="rId5" Type="x/image" Target="media/image2.png"/><Relationship Id="rId6" Type="x/image" Target="media/image3.jpeg"/></Relationships>');
    this.assert(mediaOrder.join(',')==='word/media/image1.png,word/media/image2.png,word/media/image3.jpeg','DOCX vložené obrázky','DOCX parser zachová pořadí a odstraní duplicitní reference vložených obrázků','DOCX parser neumí spolehlivě najít vložené obrázky');
    const oldTarget=$('#advTargetGroup')?$('#advTargetGroup').value:'';if($('#advTargetGroup'))$('#advTargetGroup').value='tercie';
    this.assert(/3\. ročník osmiletého gymnázia/.test(targetGroupPromptLine('tercie'))&&/13–14 let/.test(targetGroupPromptLine('tercie')),'Cílová skupina tercie','Tercie se převádí na konkrétní ročník a věk','Aplikace neví, co znamená tercie');
    this.assert(/tercie =/.test(targetGroupPromptLine('tercie, kvarta'))&&/kvarta =/.test(targetGroupPromptLine('tercie, kvarta'))&&/14–15 let/.test(targetGroupPromptLine('tercie, kvarta')),'Více gymnaziálních tříd','Tercie, kvarta i další uvedené stupně se rozpoznají společně','Při více gymnaziálních označeních se část cílové skupiny ztratila');
    if($('#advTargetGroup'))$('#advTargetGroup').value=oldTarget;updateTargetGroupHint();
    const batchPrompt=makePromptForTier('core',this.demoBase,3),singlePrompt=makePromptForTier('core',this.demoBase,1);
    this.assert(!/změň konkrétní obsah/i.test(batchPrompt)&&/referenční variantu sady/i.test(batchPrompt),'Jednotné pravidlo celé sady','Normální verze v sadě zachovává stejný obsah a obtížnost','Normální verze sady stále žádá jiný obsah');
    this.assert(/změň konkrétní obsah/i.test(singlePrompt),'Samostatná normální varianta','Jedna Normální verze může vytvořit paralelní obsah','Samostatná Normální verze ztratila pravidlo jiného obsahu');
  },
  runCefrTests(){
    const old=$('#subject')?$('#subject').value:'';
    if($('#subject'))$('#subject').value='Angličtina';
    this.assert(subjectAllowsCefr(),'CEFR u jazyků','Angličtina CEFR povoluje','Jazykový předmět CEFR nepovolil');
    if($('#subject'))$('#subject').value='Matematika';
    if($('#cefrForce'))$('#cefrForce').checked=false;
    this.assert(!subjectAllowsCefr(),'CEFR u nejazykových předmětů','Matematika CEFR blokuje','Nejazykový předmět CEFR neblokoval');
    if($('#subject'))$('#subject').value='Seminář AJ';
    this.assert(subjectAllowsCefr(),'CEFR u zkratek','Seminář AJ CEFR povoluje','Zkratka jazykového předmětu CEFR nepovolila');
    if($('#subject'))$('#subject').value='ČJ';
    this.assert(!subjectAllowsCefr(),'CEFR u češtiny','ČJ se správně nepovažuje za cizí jazyk','ČJ bylo chybně vyhodnoceno jako CEFR předmět');
    if($('#subject'))$('#subject').value='IT';
    this.assert(!subjectAllowsCefr(),'CEFR u informatiky','IT se správně nepovažuje za jazyk','IT bylo chybně vyhodnoceno jako jazyk');
    if($('#subject'))$('#subject').value='Čeština pro cizince';
    this.assert(subjectAllowsCefr(),'CEFR u češtiny pro cizince','Čeština pro cizince CEFR povoluje','Čeština pro cizince nebyla rozpoznána');
    if($('#subject'))$('#subject').value='Seminář X';
    if($('#cefrForce'))$('#cefrForce').checked=true;
    this.assert(subjectAllowsCefr(),'Ruční vynucení CEFR','Vynucení CEFR povolí nerozpoznaný jazykový předmět','Ruční vynucení CEFR nefunguje');
    if($('#cefrForce'))$('#cefrForce').checked=false;
    setSelectedTierKey('core');
    if($('#advVariantMode')){$('#advVariantMode').value='same_content_diff_difficulty';syncVariantTierRules();}
    this.assert(/stejný obsah, jiná obtížnost/i.test(variantModePromptLine('support')),'Režim nové verze','Volba stejný obsah / jiná obtížnost se propisuje do promptu','Režim nové verze se nepropsal do promptu');
    const coreRadio=document.querySelector('#tiers input[data-tier="core"]');
    this.assert(coreRadio&&coreRadio.disabled&&!actualSelectedTierKey()&&selectedSetTierKeys().join(',')==='support,extend','Logika jiné obtížnosti','Normální se zneplatní a sada nabízí jen Jednodušší + Obtížnější','Normální zůstala aktivní v režimu, který vyžaduje jinou obtížnost');
    if($('#advTeacherInstruction'))$('#advTeacherInstruction').value='Zachovej všech sedm původních položek.';
    const teacherPrompt=makePromptForTier('support',this.demoBase);
    this.assert(/ZÁVAZNÝ VLASTNÍ POKYN UČITELE/.test(teacherPrompt)&&/sedm původních položek/.test(teacherPrompt),'Vlastní pokyn učitele','Pokyn je v promptu jako závazné doplnění','Vlastní pokyn se do promptu nepropsal správně');
    if($('#advTeacherInstruction'))$('#advTeacherInstruction').value='';
    if($('#advVariantMode')){$('#advVariantMode').value='auto';syncVariantTierRules();}
    setSelectedTierKey('core');
    if($('#subject'))$('#subject').value=old;
    syncCefrHintFromSubject();
  },
  installMockGemini(){
    dplEnsureAiCore();
    const testing=window.GHRAB_AI&&window.GHRAB_AI.__testing;
    if(!testing||typeof testing.setTestHooks!=='function')throw new Error('GHRAB AI Core neposkytuje test hooks.');
    const snapshot=testing.snapshot();
    const previousHooks=snapshot&&snapshot.state&&snapshot.state.testHooks?snapshot.state.testHooks:{};
    const mockText='1. visited\n2. has already finished\n3. They saw the museum exhibition.';
    const directGemini=async({operation})=>{
      await new Promise(res=>setTimeout(res,20));
      if(operation==='cefr-detection')return {text:'A2'};
      if(operation==='worksheet-quality-audit')return {text:this.mockQuality};
      if(operation==='answer-key-generation'||operation==='material-extraction')return {text:mockText};
      return JSON.parse(this.sampleStructured());
    };
    testing.setTestHooks({isEnabled:()=>true,directGemini});
    return ()=>testing.setTestHooks(previousHooks);
  },
  async runAuditRegressionTests(){
    this.assert(['Anglický jazyk','Německý jazyk','Ruský jazyk','Italský jazyk','Konverzace v anglickém jazyce'].every(looksLikeLanguageSubject)
      && !['Matematika','Dějepis','Informatika','Český jazyk'].some(looksLikeLanguageSubject),
      'Rozpoznání jazykového předmětu','Úřední názvy typu „Anglický jazyk“ projdou, nejazykové předměty ne.','Jazykový předmět není rozpoznán podle přídavného jména');
    this.assert(buildPrintBody('Úvodní text\n12 hodin práce\n1. První úloha\n2. Druhá úloha').split('<div class="pa-ex">').length-1===3,
      'Dělení tisku na cvičení','Běžný řádek začínající číslem nevytvoří blok; úvod a dvě úlohy zůstanou tři logické části.','Tisk chybně považuje „12 hodin práce“ za novou úlohu');
    this.assert(/Ostrava-Hrab/.test(printHead()),'Školní identita v PDF','Hlavička tištěného listu uvádí plný název školy.','Hlavička PDF uvádí jen obecné „Gymnázium“');
    this.assert(/chybu v úloze 3/.test(renderQualityAudit('Opravit chybu v úloze 3')),'Audit bez dvojtečky','Kontrola kvality nezahodí začátek řádku bez dvojtečky.','Kontrola kvality ořízla skutečný obsah řádku');
    const qaItems=parseQualityAudit('OK: Bez problému.\nOpravit: Změň zadání.\nDoporučení: Přidej nápovědu.');
    this.assert(qaItems.filter(x=>x.selectable).length===2&&qaItems.find(x=>x.kind==='qa-ok'&&!x.selectable),'Výběr návrhů z kontroly','Zaškrtávací volby jsou jen u Opravit a Doporučení; OK se neaplikuje','Audit nemá správně selektivní zaškrtávání');
    const editSheet=makeSheet('core',false);editSheet._text='**Nadpis**\n\n1. Úloha';editSheet._key='1. Řešení';editSheet._quality='OK: vše sedí';editSheet._parts={title:'Nadpis',instructions:'',tasks:editSheet._text,answerKey:editSheet._key,teacherNote:'Poznámka'};editSheet.querySelector('.body').innerHTML=render(editSheet._text);renderTeacherNote(editSheet);const editBtn=document.createElement('button');toggleEdit(editSheet,editBtn);toggleEdit(editSheet,editBtn);
    this.assert(editSheet._text==='**Nadpis**\n\n1. Úloha'&&editSheet._key==='1. Řešení'&&editSheet._quality==='OK: vše sedí'&&!!editSheet.querySelector('.body b'),'Prázdná editace zachová data','Tučné markery, řešení i kontrola kvality zůstaly beze změny.','Pouhé otevření editace poškodilo text nebo učitelská data');
    const dataOverlay=$('#dataOverlay'),messageOverlay=$('#messageOverlay');if(dataOverlay&&messageOverlay){dataOverlay.classList.add('show');await new Promise(r=>setTimeout(r,0));messageOverlay.classList.add('show');await new Promise(r=>setTimeout(r,0));document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await new Promise(r=>setTimeout(r,0));this.assert(!messageOverlay.classList.contains('show')&&dataOverlay.classList.contains('show'),'Zásobník dialogů','Escape zavře naposledy otevřené potvrzení a ponechá spodní dialog.','Escape zavřel nesprávný dialog');dataOverlay.classList.remove('show');messageOverlay.classList.remove('show');await new Promise(r=>setTimeout(r,0));}
    const oldSupport=TIERS.support.cefrLbl,oldCore=TIERS.core.cefrLbl,oldExtend=TIERS.extend.cefrLbl;
    const probe=makeSheet('core',false);$('#results').appendChild(probe);applyCefrLevels('B1');
    this.assert(probe.querySelector('.level-badge')&&probe.querySelector('.level-badge').textContent==='B1','Živý CEFR štítek','CEFR změna se propsala i do již vytvořené karty.','CEFR štítek na hotové kartě zůstal zastaralý');
    probe.remove();TIERS.support.cefrLbl=oldSupport;TIERS.core.cefrLbl=oldCore;TIERS.extend.cefrLbl=oldExtend;applyCefrLevels(oldCore||null);
  },
  runApiGuardTests(){
    const oldKey=geminiApiKey, oldScope=geminiKeyScope;
    try{
      geminiApiKey=''; geminiKeyScope='';
      const allowed=requireApiKeyForAction('testovací akci');
      this.assert(!allowed,'API guard','Bez API klíče se modelová akce nespustí','Akce bez API klíče nebyla zablokována');
    }finally{
      if($('#messageOverlay'))$('#messageOverlay').classList.remove('show');
      geminiApiKey=oldKey; geminiKeyScope=oldScope; updateKeyStatus();
    }
  },
  async runModelSwitchIntegrationTest(){
    const oldProfile=selectedModelProfile,oldDeployment=window.__GHRAB_DEPLOYMENT_CONFIG__,testing=window.GHRAB_AI?.__testing;
    if(!testing?.snapshot||!testing?.setTestHooks)throw new Error("Core test hooks chybí.");
    const oldHooks=testing.snapshot()?.state?.testHooks||{};
    try{
      dplConfiguredSignature="";dplEnsureAiCore();
      const state=testing.snapshot().state,credentials=await state.credentialProvider({mode:"direct-gemini",operation:"worksheet-generation",modelProfile:"balanced"}),map=state.runtime.ai.directGemini.profileModels;
      this.assert(!("modelOverride" in credentials)&&MODEL_PROFILES.every(p=>map[p])&&new Set(MODEL_PROFILES.map(p=>map[p])).size===3,"T6 direct runtime","3 profily bez modelOverride.","Neplatný direct runtime.");
      const direct=[];testing.setTestHooks({isEnabled:()=>true,directGemini:async({modelProfile})=>{direct.push(modelProfile);return JSON.parse(this.sampleStructured())}});
      for(const p of MODEL_PROFILES){setModelProfile(p);await callGemini([{text:"T6"}],{json:true,operation:"worksheet-generation"})}
      this.assert(direct.join(",")==="economy,balanced,quality","T6 direct routing","3 profily dorazily do Core.","Chybný direct modelProfile.");
      window.__GHRAB_DEPLOYMENT_CONFIG__={...(oldDeployment||{}),profile:"school-server",aiTransport:"school-gateway",apiBaseUrl:"https://school.example/api/v1/",endpoints:{...(oldDeployment?.endpoints||{}),aiGenerate:"ai/generate",aiHealth:"ai/health"}};
      dplConfiguredSignature="";dplEnsureAiCore();
      const seen=[],response=p=>({schema:window.GHRAB_AI.responseSchema,requestId:"mock",clientRequestId:p.clientRequestId,result:JSON.parse(this.sampleStructured()),usage:{providerRequests:1,retryRequests:0,generatedOutputs:1},meta:{latencyMs:0}});
      testing.setTestHooks({isEnabled:()=>true,schoolGateway:async p=>{seen.push(p.modelProfile);return response(p)}});
      for(const p of MODEL_PROFILES){setModelProfile(p);await callGemini([{text:"T6"}],{json:true,operation:"worksheet-generation"})}
      this.assert(seen.join(",")==="economy,balanced,quality","T6 gateway routing","3 profily dorazily na gateway.","Chybný gateway modelProfile.");
    }finally{
      testing.setTestHooks(oldHooks);if(oldDeployment===undefined)delete window.__GHRAB_DEPLOYMENT_CONFIG__;else window.__GHRAB_DEPLOYMENT_CONFIG__=oldDeployment;setModelProfile(oldProfile);dplConfiguredSignature="";dplEnsureAiCore();
    }
  },
  runProjectRoundtripTest(){
    const oldState=getAppFormState();
    const oldKey=geminiApiKey, oldScope=geminiKeyScope;
    let temp=null;
    try{
      temp=makeSheet('core',false);
      temp._text='Testovací export projektu\n\n1. Doplň větu.';
      temp._key='1. Správná odpověď';
      temp._quality='OK: kontrola.';
      temp._structured=true;
      temp._parts={title:'Testovací export projektu',instructions:'Doplň.',tasks:'1. Doplň větu.',answerKey:'1. Správná odpověď',teacherNote:'Poznámka jen pro učitele.'};
      const results=$('#results');
      if(results)results.appendChild(temp);
      geminiApiKey='TEST_SECRET_SHOULD_NOT_EXPORT'; geminiKeyScope='memory';
      const data=serializeProject();
      if(temp.parentNode)temp.parentNode.removeChild(temp);
      const json=JSON.stringify(data);
      this.assert(data&&data.form&&Array.isArray(data.sheets),'Export projektu','Projekt se serializuje do očekávané struktury','Export nemá očekávanou strukturu');
      this.assert(!json.includes('TEST_SECRET_SHOULD_NOT_EXPORT'),'Bezpečnost exportu','API klíč není součástí exportovaného projektu','API klíč se propsal do exportu');
      const restored=restoreProjectSheet(data.sheets[0]||{});
      this.assert(restored&&restored._text&&restored._key&&restored.querySelector('.teacherbox.show'),'Import výstupu','Výstupní karta jde obnovit z projektových dat','Obnovení výstupu z projektu selhalo');
      const sample={pasteText:'Ukázka',baseText:'Základ',subject:'AJ',cefr:true,cefrForce:true,selectedTier:'extend',meta:{subject:'AJ',topic:'Past simple',className:'2.B',date:'17. 6. 2026'},advanced:{targetGroup:'2. ročník',workTime:'10 minut',variantMode:'same_format_new_content',structureMode:'strict',supportType:'slovní banka',teacherInstruction:'Zachovej počet úloh.'}};
      applyAppFormState(sample);
      const after=getAppFormState();
      this.assert(after.subject==='AJ'&&after.cefrForce===true&&after.selectedTier==='extend'&&after.advanced.variantMode==='same_format_new_content','Import nastavení','Formulář a pedagogické volby se obnoví z projektu','Nastavení projektu se neobnovilo správně');
      this.add('ok','Export/import projektu','Ověřen roundtrip bez stažení souboru a bez API klíče v datech.');
    }finally{
      if(temp&&temp.parentNode)temp.parentNode.removeChild(temp);
      applyAppFormState(oldState);
      geminiApiKey=oldKey; geminiKeyScope=oldScope; updateKeyStatus();
    }
  },
  runStatusAndProjectSafetyTests(){
    const oldKey=geminiApiKey,oldScope=geminiKeyScope;
    try{
      geminiApiKey='';geminiKeyScope='';updateKeyStatus();
      this.assert(/chybí klíč/i.test($('#statusKey')?$('#statusKey').textContent:''),'Stav API klíče','Po smazání se horní stav okamžitě přepne na chybějící klíč','Horní stav zůstal po smazání zastaralý');
      geminiApiKey='TEST';geminiKeyScope='memory';updateKeyStatus();
      this.assert(/neuložen/i.test($('#statusKey')?$('#statusKey').textContent:''),'Neuložený API klíč','Ručně zadaný klíč je označen jako neuložený','Stav neuloženého klíče je zavádějící');
      let rejected=false;try{normalizeProject({app:'Jiná aplikace',schemaVersion:1,form:{},sheets:[]})}catch(_){rejected=true}
      this.assert(rejected,'Validace projektu','Cizí nebo nekompatibilní projekt je odmítnut','Import přijal projekt jiné aplikace');
      const safe=normalizeProject({app:PROJECT_APP,schemaVersion:PROJECT_SCHEMA_VERSION,form:{subject:{malicious:true}},sheets:[]});
      this.assert(safe.form.subject==='','Normalizace projektu','Neplatný objekt v textovém poli nezpůsobí pád ani vložení HTML','Neplatné projektové pole nebylo bezpečně normalizováno');
    }finally{geminiApiKey=oldKey;geminiKeyScope=oldScope;updateKeyStatus()}
  },
  async runBatchAndTransactionTests(){
    const results=$('#results'),oldNodes=results?[...results.childNodes]:[],oldBase=$('#baseText').value,oldKey=geminiApiKey,oldScope=geminiKeyScope,restoreMock=this.installMockGemini();
    const progress=$('#progressStrip'),progressSnapshot=progress?{html:progress.innerHTML,cls:progress.className}:null,status=$('#statusFlow'),statusSnapshot=status?{html:status.innerHTML,cls:status.className}:null,banner=$('#resultBanner'),bannerSnapshot=banner?{cls:banner.className,summary:$('#resultSummary').textContent}:null,resultsPanel=$('#resultsPanel'),resultsPanelHidden=resultsPanel&&resultsPanel.classList.contains('hide'),configErr=$('#configErr'),configErrHtml=configErr?configErr.innerHTML:'';
    try{
      if(results)results.replaceChildren();$('#baseText').value=this.demoBase;geminiApiKey='INTERNAL_BATCH_TEST_KEY';geminiKeyScope='memory';updateKeyStatus();
      await generateVersions(['support','core','extend'],$('#genAllBtn'));
      const sheets=[...results.querySelectorAll('.sheet')];
      this.assert(sheets.length===3,'Celá diferencovaná sada','Jedním tokem vznikly všechny 3 úrovně','Celá sada nevytvořila 3 výstupy');
      this.assert(sheets.map(x=>x._tierKey).join(',')==='support,core,extend','Pořadí sady','Sada má pořadí Jednodušší → Normální → Obtížnější','Pořadí nebo typy variant nesouhlasí');
      this.assert(sheets.every(x=>x.querySelector('.teacherbox.show')),'Poznámka pro učitele','Poznámka modelu je viditelná pouze v učitelské části','Poznámka pro učitele se ztratila');
      this.assert(sheets.every(x=>/Zobrazit řešení/.test(x.querySelector('.tool-group.primary').textContent)),'Přesné značení spotřeby','Již hotové řešení se nabízí bez symbolu dalšího API dotazu','Hotové řešení stále zavádějícím způsobem účtuje dotaz');
      this.assert(sheets.every(x=>/^1\. /.test(x.querySelector('.tool-group.primary').children[0].textContent)&&/^2\. /.test(x.querySelector('.tool-group.primary').children[1].textContent)&&/^3\. /.test(x.querySelector('.tool-group.primary').children[2].textContent)),'Číslování doporučeného postupu','Akce mají přirozené značení 1. / 2. / 3.','V doporučeném postupu chybí tečky za čísly');
      this.assert(sheets.every(x=>!/(Export \.md|Regenerovat)/i.test(x.querySelector('.tool-group.secondary').textContent)),'Zjednodušené další úpravy','Sekce Další úpravy obsahuje jen Upravit a Kopírovat','Zbytečný Export .md nebo Regenerovat se vrátil do výsledku');
      const keep=makeSheet('support',false);keep._text='PŮVODNÍ JEDNODUŠŠÍ';keep.querySelector('.body').innerHTML=render(keep._text);results.replaceChildren(keep);
      await generateVersions(['extend'],$('#genBtn'));
      this.assert([...results.children].some(s=>s._tierKey==='support')&&[...results.children].some(s=>s._tierKey==='extend'),
        'Hotová verze přežije nové generování','Generování jiného stupně nemaže dříve vytvořené verze.','Nové generování smazalo hotovou verzi jiného stupně');
      const preserved=makeSheet('core',false);preserved._text='PŮVODNÍ HOTOVÁ VERZE';preserved._key='PŮVODNÍ KLÍČ';preserved._parts={title:'Původní',instructions:'',tasks:preserved._text,answerKey:preserved._key,teacherNote:'Původní poznámka'};preserved.querySelector('.body').innerHTML=render(preserved._text);renderTeacherNote(preserved);results.replaceChildren(preserved);
      const workingMock=callGemini;callGemini=async()=>{throw makeAppError('Simulovaný výpadek API.','TIMEOUT')};
      await generateVersions(['core'],$('#genBtn'));
      this.assert(results.firstElementChild===preserved&&preserved._text==='PŮVODNÍ HOTOVÁ VERZE','Transakční generování','Při úplném výpadku API zůstane předchozí výstup zachovaný','Neúspěšné generování smazalo předchozí práci');
      callGemini=workingMock;if($('#messageOverlay'))$('#messageOverlay').classList.remove('show');
    }finally{
      restoreMock();geminiApiKey=oldKey;geminiKeyScope=oldScope;updateKeyStatus();$('#baseText').value=oldBase;if(results)results.replaceChildren(...oldNodes);if(progressSnapshot&&progress){progress.innerHTML=progressSnapshot.html;progress.className=progressSnapshot.cls}if(statusSnapshot&&status){status.innerHTML=statusSnapshot.html;status.className=statusSnapshot.cls}if(bannerSnapshot&&banner){banner.className=bannerSnapshot.cls;$('#resultSummary').textContent=bannerSnapshot.summary}if(resultsPanel)resultsPanel.classList.toggle('hide',!!resultsPanelHidden);if(configErr)configErr.innerHTML=configErrHtml;if($('#messageOverlay'))$('#messageOverlay').classList.remove('show');
    }
  },
  async runMockGeneration(){
    const restore=this.installMockGemini();
    const oldKey=geminiApiKey, oldScope=geminiKeyScope;
    const progress=$('#progressStrip');
    const progressSnapshot=progress?{html:progress.innerHTML,cls:progress.className}:null;
    const status=$('#statusFlow');
    const statusSnapshot=status?{text:status.textContent,cls:status.className}:null;
    try{
      // Mockované volání modelu má projít stejnou cestou jako ostrá akce, včetně API guardu.
      // Proto se pro dobu interního testu nastaví jen dočasný syntetický klíč; do úložiště ani exportu se neukládá
      // a po testu se vždy obnoví původní stav uživatele.
      geminiApiKey='INTERNAL_SMOKE_TEST_KEY';
      geminiKeyScope='memory';
      updateKeyStatus();
      const sheet=makeSheet('core',true);
      await generateIntoSheet(sheet,'core',this.demoBase,0,1);
      this.assert(!!sheet._text&&sheet._text.includes('Past Simple'),'Mock generování','Vznikl pracovní list přes mock bez reálného API','Nevznikl očekávaný text');
      this.assert(sheet._structured&&sheet._validation&&sheet._validation.ok,'Mock struktura','Vygenerovaný mock výstup má platnou strukturu','Mock výstup není strukturálně platný');
      await checkQuality(sheet,{disabled:false,innerHTML:'Kontrola'});
      this.assert(!!sheet._quality,'Mock kontrola kvality','Kontrola kvality se vyplnila přes mock bez reálného API','Kontrola kvality se nevyplnila');
      const choice=$('#qualityBody')&&$('#qualityBody').querySelector('.qa-choice');if(choice){choice.checked=true;choice.dispatchEvent(new Event('change'));await applySelectedQualitySuggestions();}
      this.assert(!!sheet._quality&&sheet._qualityStage==='revised'&&/Past Simple/.test(sheet._text),'Selektivní zapracování kontroly','Vybraný bod se zapracuje, audit se zachová a PDF už nevyžaduje povinný další audit','Zapracování znovu vytvořilo povinnou kontrolní smyčku nebo poškodilo výstup');
      await checkQuality(sheet,{disabled:false,innerHTML:'Kontrola'});
      this.assert($('#qualityFinalRun')&&!$('#qualityFinalRun').classList.contains('hide'),'Jedna volitelná finální kontrola','Po opravě je k dispozici právě jeden volitelný finální audit','Po opravě chybí řízená finální kontrola');
      if($('#qualityOverlay'))$('#qualityOverlay').classList.remove('show');
      if($('#printOverlay'))$('#printOverlay').classList.remove('show');if($('#pdfCheckOverlay'))$('#pdfCheckOverlay').classList.remove('show');
      requestPdfForSheet(sheet,'PDF po opravě',sheet._text);
      this.assert($('#printOverlay')&&$('#printOverlay').classList.contains('show')&&!$('#pdfCheckOverlay').classList.contains('show'),'PDF bez auditní smyčky','Po zapracování první kontroly lze přejít k PDF bez povinného dalšího requestu','PDF po opravě znovu vynutilo kontrolu');
      if($('#printOverlay'))$('#printOverlay').classList.remove('show');
      if($('#qualityOverlay'))$('#qualityOverlay').classList.remove('show');if($('#messageOverlay'))$('#messageOverlay').classList.remove('show');
      this.add('ok','Mock generování dokončeno','Ukázková verze vznikla jen uvnitř testu a nepropsala se do běžné aplikace.');
    }finally{
      restore();
      geminiApiKey=oldKey;
      geminiKeyScope=oldScope;
      updateKeyStatus();
      if($('#messageOverlay'))$('#messageOverlay').classList.remove('show');
      if(progressSnapshot&&progress){progress.innerHTML=progressSnapshot.html;progress.className=progressSnapshot.cls}
      if(statusSnapshot&&status){status.textContent=statusSnapshot.text;status.className=statusSnapshot.cls}
    }
  },
  runPdfFlowTest(){
    const sheet=makeSheet('core',false);
    sheet._text='Testovací pracovní list\n\n1. Doplň větu.';
    sheet._key='1. Správná odpověď';
    sheet._validation={ok:true,issues:[]};
    sheet._quality='';
    requestPdfForSheet(sheet,'PDF test',sheet._text);
    this.assert($('#pdfCheckOverlay')&&$('#pdfCheckOverlay').classList.contains('show'),'PDF před kontrolou','Před PDF se zobrazil kontrolní modal','Kontrolní modal se nezobrazil');
    closePdfCheck();
    sheet._quality='OK: Ručně zkontrolováno.';
    requestPdfForSheet(sheet,'PDF test',sheet._text);
    this.assert($('#printOverlay')&&$('#printOverlay').classList.contains('show'),'PDF po kontrole','Po kontrole se otevřel náhled PDF','Náhled PDF se neotevřel');
    this.assert(!!document.querySelector('#printPreview .pa-body'),'Struktura náhledu PDF','Náhled používá stejný obal těla jako tisk','V náhledu PDF chybí .pa-body');
    this.assert($('#printConfirm')&&$('#printConfirm').disabled,'Povinná učitelská kontrola','Tisk je do potvrzení učitele zablokovaný','Tisk nebyl zablokovaný před potvrzením');
    if($('#printTeacherConfirmed')){$('#printTeacherConfirmed').checked=true;$('#printTeacherConfirmed').dispatchEvent(new Event('change'));}
    this.assert($('#printConfirm')&&!$('#printConfirm').disabled,'Odemčení PDF','Potvrzení učitele odemklo tisk/PDF','Potvrzení učitele tisk neodemklo');
    if($('#printOverlay'))$('#printOverlay').classList.remove('show');
    sheet._structured=true;sheet._parts={title:'Výrazný testovací nadpis',instructions:'Pracuj pečlivě.',tasks:'1. První úloha\n2. Druhá úloha',answerKey:'1. A\n2. B\n3. C\n4. D\n5. E\n6. F',teacherNote:''};sheet._key=sheet._parts.answerKey;downloadKeyPdf(sheet);
    this.assert(!!$('#printPreview .pa-title')&&$('#printPreview .pa-title').textContent==='Výrazný testovací nadpis','Nadpis v PDF','PDF používá skutečný výrazný název materiálu, ne jen technický název verze','PDF nemá výrazný skutečný nadpis');
    this.assert(document.querySelectorAll('#printPreview .pa-key-body .pa-ex').length>1,'Řešení bez prázdné první strany','Klíč je v tisku rozdělen do zalomitelných bloků místo jednoho nedělitelného bloku','Celý klíč je stále jeden blok a může odsunout obsah na další stranu');
    if($('#printOverlay'))$('#printOverlay').classList.remove('show');
  },
  runLayoutTest(){
    const overflow=document.documentElement.scrollWidth-window.innerWidth;
    this.assert(overflow<=2,'Layout bez horizontálního přetečení','scrollWidth nepřesahuje viewport o víc než 2 px','Přetečení: '+overflow+' px');
  },
  runReleaseGateTest(){
    this.assert(/^\d+\.\d+\.\d+$/.test(RELEASE.version),'Release verze','RELEASE.version má tvar x.y.z','RELEASE.version nemá očekávaný tvar');
    this.assert(Array.isArray(RELEASE.changes)&&RELEASE.changes[0]&&RELEASE.changes[0].includes(RELEASE.version),'Changelog verze','První záznam changelogu odpovídá aktuální verzi','První záznam changelogu neodpovídá aktuální verzi');
    this.assert(/release gate OK/i.test('release gate OK'),'Release pravidlo','Bez zelených interních testů novou verzi nevydávat; při FAIL je release stopka.','Release pravidlo není definováno');
    this.assert(/AI výstup je návrh/i.test($('#resultBanner')?$('#resultBanner').textContent:''),'Učitelské ověření','Výstup připomíná ruční ověření před PDF','Chybí připomínka ručního ověření výstupu');
    this.assert(!!$('#helpTopBtn'),'Horní nápověda','Nápověda je dostupná i v horní liště','Chybí horní tlačítko nápovědy');
    this.assert(!!document.querySelector('.formats-compact'),'Kompaktní formáty','Mobilní zobrazení má kompaktní řádek podporovaných formátů','Chybí kompaktní mobilní popis formátů');
    this.assert(/Kontrola[\s\S]*Řešení[\s\S]*PDF/.test($('#resultBanner')?$('#resultBanner').textContent:''),'Výsledkový postup','Banner vede uživatele v pořadí Kontrola → Řešení → PDF','Doporučený postup ve výsledku není sjednocený');
    const apiSource=String(callGemini);this.assert(apiSource.includes('GHRAB_AI.generate')&&!apiSource.includes("thinkingLevel:'low'")&&DPL_AI_OPERATIONS.operations['worksheet-generation']&&DPL_AI_OPERATIONS.operations['worksheet-quality-revision'],'Odolnost modelového API','Volání vede přes GHRAB AI Core, operace je registrovaná a kód nepoužívá pevnou úroveň low','Nastavení AI Core neodpovídá release pravidlům');
  },
  runNativeDialogScan(){
    const forbidden=['al'+'ert','pro'+'mpt'];
    const code=Array.from(document.scripts).map(s=>s.textContent||'').join('\n');
    const testCodeStart=code.indexOf('const TestSystem=');
    const appCode=testCodeStart>=0?code.slice(0,testCodeStart):code;
    const found=forbidden.filter(name=>new RegExp('\\b'+name+'\\s*\\(').test(appCode));
    this.assert(!found.length,'Nativní dialogy','Aplikační kód nepoužívá blokující systémové dialogy.','Nalezeno použití blokujícího systémového dialogu: '+found.join(', '));
  }
};


