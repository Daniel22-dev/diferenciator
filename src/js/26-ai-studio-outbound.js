/* Stage06: UI adapter in protected Differentiator bundle; does not touch inbound. */
(function(){
  'use strict';
  let busy=false;
  const messages={
    ANONYMITY_NOT_CONFIRMED:'Před předáním je nutné potvrdit anonymizaci materiálu.',
    NO_GENERATED_TEXT:'Nejprve vytvoř hotovou verzi pracovního listu.',
    NONPORTABLE_MEDIA:'Tato verze obsahuje obrázek nebo média, která nelze bezpečně předat jako text.',
    PRIVATE_OR_ACTIVE_CONTENT:'Text obsahuje možné osobní údaje nebo nebezpečný aktivní obsah.',
    MATERIAL_OVERSIZED:'Materiál je pro jednorázové předání příliš velký.',
    STUDIO_ORIGIN_UNTRUSTED:'AI Studio není na povolené stejné doméně.',
    STUDIO_PATH_UNTRUSTED:'Nesprávná nebo nedůvěryhodná cesta k AI Studiu.',
    STUDIO_NOT_CONFIGURED:'AI Studio nemá nakonfigurovanou adresu.',
    handoff_pending:'Nejprve dokonči nebo zruš předchozí předání materiálu.',
    unsafe_material:'AI Studio odmítlo obsah z důvodu soukromí nebo bezpečnosti.',
    'handoff-pending':'Nejprve dokonči nebo zruš předchozí předání materiálu.',
    'unsafe-material':'AI Studio odmítlo obsah z důvodu soukromí nebo bezpečnosti.',
  };
  function notice(title,message){
    if (typeof showMessage==='function') showMessage(title,message);
    else window.alert(title+'\n'+message);
  }
  async function exportSheet(sheet,button){
    if(busy) return;
    if(!sheet?._text?.trim()) {notice('Uložení není možné',messages.NO_GENERATED_TEXT);return;}
    if(sheet.querySelector('.body')?.isContentEditable){notice('Dokonči úpravy','Nejprve klikni na Hotovo, aby se uložila aktuální verze.');return;}
    if (!window.__GHRAB_STUDIO_ACCESS__?.permit || window.__GHRAB_STUDIO_ACCESS__.appId!=='differentiator') {
      notice('Neověřený přístup','Aplikace musí být řádně otevřena přes přístupovou bránu AI Studia.');return;
    }
    const permit=window.confirm('Do AI Studia předám pouze žákovský text této verze, nikoli řešení, poznámky, API klíče nebo další varianty. Potvrzuji, že text neobsahuje osobní údaje ani nezbytná média, která by při přenosu chyběla. Pokračovat?');
    if(!permit) return;
    busy=true;button.disabled=true;
    try{
      const {mapSelectedWorksheet,trustedStudioRoot}=await import('./modules/stage06-outbound-material.js');
      const base=trustedStudioRoot(window.__GHRAB_DEPLOYMENT_CONFIG__?.studioBaseUrl,window.location.href);
      const helperUrl=new URL('integration/save-to-studio.js',base);
      const {saveMaterialToStudio}=await import(helperUrl.href);
      const ver=document.documentElement.dataset.ghrabAppVersion;
      if(typeof crypto?.randomUUID!=='function') throw new Error('NO_SECURE_UUID');
      const material=mapSelectedWorksheet({
        form:{subject:document.getElementById('subject')?.value||'',meta:{
          topic:document.getElementById('mTopic')?.value||'',
          subject:document.getElementById('mSubject')?.value||'',
          className:document.getElementById('mClass')?.value||''},
          advanced:{learningGoal:document.getElementById('advLearningGoal')?.value||''}},
        sheet,
        id:'dif-'+crypto.randomUUID(),
        now:new Date().toISOString(),appVersion:ver,privacyConfirmed:true,
      });
      const result=saveMaterialToStudio({material,studioUrl:base,sourceAppId:'differentiator',sourceAppVersion:ver,navigate:false});
      if(!result?.ok) throw new Error(result?.reason||'HANDOFF_NOT_PREPARED');
      notice('Materiál připraven','Otevřu Moje materiály v AI Studiu. Originál ve Diferenciátoru zůstává zachován.');
      window.location.assign(result.targetUrl);
    }catch(err){
      const code=err?.code||err?.message||'UNKNOWN';
      notice('Nelze předat materiál',messages[code]||'Předání se nezdařilo. Materiál zůstává ve Diferenciátoru; zkontroluj spojení se Studiem a anonymizaci.');
    }finally{busy=false;button.disabled=false;}
  }
  function attach(sheet,container){
    if(!sheet?._text?.trim() || !container || container.querySelector('[data-act="save-to-studio"]')) return;
    const button=document.createElement('button');button.type='button';button.className='btn tiny soft';
    button.dataset.act='save-to-studio';button.textContent='Uložit do AI Studia';
    button.title='Jedna vybraná varianta, pouze žákovský text. Po potvrzení se otevřou Moje materiály.';
    button.setAttribute('aria-label','Uložit '+(sheet._tierKey||'vybranou')+' verzi do AI Studia');
    button.addEventListener('click',()=>{void exportSheet(sheet,button)});
    container.appendChild(button);
  }
  window.__GHRAB_STAGE06_OUTBOUND__=Object.freeze({attach});
})();
