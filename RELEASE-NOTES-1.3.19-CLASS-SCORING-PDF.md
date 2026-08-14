# Diferenciátor 1.3.19 RC — ročníky, bodování a čistší PDF

Datum: 2026-08-14

## Co se mění

- Cílová skupina už není volný text. Učitel vybírá konkrétní ročník osmiletého (prima–oktáva) nebo čtyřletého gymnázia (1.–4. ročník / prvák–čtvrťák); aplikace předává AI i orientační věk. Čas na vypracování zůstává ruční pole.
- Bodování má čtyři režimy: **Body navrhne AI**, **Převzít body z originálu**, **Body doplním sám/sama před PDF**, **Bez bodování**.
- Pokud je v originálu bodování spolehlivě rozpoznáno, automaticky se předvolí jeho převzetí. Pokud rozpoznáno není, tato volba je nedostupná a výchozí je Bez bodování.
- Ruční bodování probíhá čistě lokálně před PDF a nestojí žádný AI request; učitel zadá body hlavních úloh a aplikace dopočítá součet.
- Odstraněn duplicitní horní „Rychlý postup“. Doporučený postup zůstává pouze u konkrétní hotové verze.
- PDF používá hlavní nadpis materiálu jako výchozí název souboru; řešení přidává „– řešení“. Tiskový layout minimalizuje prostor pro browserové datum/URL.
- Výkonová brána zůstává blokující; po rozšíření 1.3.19 byly rozpočty jen omezeně posunuty na dist 890 kB, entry HTML 390 kB, critical 570 kB, inline script 290 kB, precache 870 kB a largest file 390 kB.

## Zachované opravy

Zůstávají všechny opravy z 1.3.15–1.3.17: tři provider-neutrální modelové profily, multimodální DOCX import, výrazný nadpis, selektivní kontrola kvality, omezená kontrolní smyčka, opravené zalamování řešení a bezpečné school-server mapování.

## Release stav

RC pro živý test v GitHub Pages / AI Studiu. Finální GO až po ověření reálného tisku v cílovém Chrome a živého Direct Gemini toku.
