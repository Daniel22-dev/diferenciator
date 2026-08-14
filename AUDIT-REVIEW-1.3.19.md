# GARP review — Diferenciátor 1.3.19 RC

Datum: 2026-08-14

## Rozsah této iterace

- odstranění duplicitního horního postupu; jediný doporučený postup zůstává na kartě konkrétní verze,
- čistší tisk a výchozí název PDF podle hlavního nadpisu materiálu,
- explicitní výběr ročníku pro osmileté i čtyřleté gymnázium; čas zůstává ruční,
- čtyři režimy bodování: AI / převzít originál / ručně před PDF / bez bodů,
- lokální editor ručního bodování bez AI requestu,
- automatické předvolení převzetí bodů, jen pokud byly v originálu spolehlivě rozpoznány,
- kompatibilita AI Studio handoffu s novým ročníkovým selectem,
- zachování předchozích oprav importu DOCX, modelových profilů, kvality a řešení PDF.

## Automatické ověření

- `npm test`: PASS — 121/121 interních testů, profilová a regresní brána zelená.
- `qa:profiles`: PASS — 17/17.
- `qa:quality`: PASS — 31/31 bez warnings.
- `qa:lock`: PASS — 3 přímé závislosti, 67 lock entries.
- `verify:platform`: PASS — 109/109.
- `qa:browser`: PASS.
- `qa:xss`: PASS — žádná nová blokující regrese sinků.
- `test:reporter`: 56 PASS / 0 FAIL; browserová část lokálně NOT_READY kvůli spravované URLBlocklist.
- `build:school-server`: PASS.
- `qa:profiles:browser:school`: PASS — economy / balanced / quality se propisují i ve school-gateway buildu.

## Výkon

Blokující rozpočty zůstávají aktivní. Po rozšíření 1.3.19 jsou nastaveny na dist 890 kB, entry HTML 390 kB, critical 570 kB, largest inline script 290 kB, precache 870 kB a largest file 390 kB. Aktuální měření je pod všemi limity.

## Omezení lokálního runneru

- `qa:runtime` nelze v tomto prostředí dokončit: Chromium blokuje lokální testovací navigaci politikou `URLBlocklist` a vrací `net::ERR_BLOCKED_BY_ADMINISTRATOR`.
- `qa:axe` je `not-ready-environment`, protože runner nemá lokálně přesnou instalaci `axe-core 4.12.1`; GitHub CI ji získá přes lockfile.
- Webová aplikace nemůže absolutně přepsat globální uživatelské nastavení Chrome „Záhlaví a zápatí“. Tisková šablona používá `@page margin:0` a vlastní vnitřní okraje, což odstraní prostor pro běžné automatické datum/URL; pokud je místní politika/profil prohlížeče přesto vynutí, UI výslovně radí položku Záhlaví a zápatí vypnout.

## Verdikt

**RC připravený k nahrání na GitHub a živému testu.** Finální GARP GO až po GitHub Actions a krátkém live smoke testu: import reálného materiálu, jeden Direct Gemini výstup, všechny čtyři scoring režimy (zejména převzetí a ruční editor), kontrola/oprava bez smyčky a reálné uložení PDF v cílovém Chrome.
