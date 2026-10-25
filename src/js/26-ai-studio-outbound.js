(function(){
  'use strict';
  let busy=false;
  function notify(title,detail){if(typeof showMessage==='function')showMessage(title,detail);else window.alert(title+'\n'+detail)}
  async function send(sheet,button){
    if(busy)return;
    if(!sheet?._text?.trim()){notify('Chybí materiál','Nejprve vytvoř pracovní list.');return}
    if(sheet.querySelector('.body')?.isContentEditable){notify('Dokonči úpravy','Nejprve klikni na Hotovo.');return}
    if(window.__GHRAB_STUDIO_ACCESS__?.appId!=='differentiator'||!window.__GHRAB_STUDIO_ACCESS__?.permit){notify('Neověřený přístup','Otevři aplikaci přes AI Studio.');return}
    if(!window.confirm('Předám pouze žákovský text vybrané verze, nikoli řešení ani klíče. Potvrzuji anonymizaci a nepřítomnost nezbytných médií. Pokračovat?'))return;
    busy=true;button.disabled=true;
    try{
      const {sendSelectedWorksheet}=await import('./modules/stage06-outbound-ui.js');
      const url=await sendSelectedWorksheet(sheet);
      window.location.assign(url);
    }catch(e){notify('Předání se nezdařilo','Materiál zůstává v Diferenciátoru. Zkontroluj anonymizaci, přístup a čekající předání.');}
    finally{busy=false;button.disabled=false}
  }
  function attach(sheet,container){
    if(!sheet?._text?.trim()||!container||container.querySelector('[data-act="save-to-studio"]'))return;
    const b=document.createElement('button');b.type='button';b.className='btn tiny soft';
    b.dataset.act='save-to-studio';b.textContent='Uložit do AI Studia';
    b.title='Jedna varianta bez řešení a osobních údajů.';
    b.setAttribute('aria-label','Uložit '+(sheet._tierKey||'vybranou')+' verzi do AI Studia');
    b.addEventListener('click',()=>{void send(sheet,b)});container.appendChild(b)
  }
  window.__GHRAB_STAGE06_OUTBOUND__=Object.freeze({attach});
})();
