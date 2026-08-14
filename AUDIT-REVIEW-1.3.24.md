# AUDIT REVIEW 1.3.24 — Claude 1.3.19 findings vs current code

## Verdikt revieweru

Starší audit 1.3.19 byl znovu ověřen proti zdrojům 1.3.23 po funkčních fázích 1–4. Nálezy nebyly přebrány automaticky. Všechny konkrétní body N1–N9, které byly v aktuálním stromu stále reprodukovatelné, byly opraveny nebo explicitně uzavřeny dokumentací.

N6 byl částečně zastaralý v interpretaci: request timeout a maximální velikost requestu už v aktuální architektuře vynucuje GHRAB AI Core přes runtime kontrakt. Mrtvé lokální duplikáty proto byly odstraněny, ale ochrany v Core zůstávají.

## Review N1–N9

- **N1 potvrzen a opraven.** Runtime deployment konfigurace už nejsou v `CORE_ASSETS`. Nový `scripts/sw-assets.mjs` kontroluje standardní i school-server build a shodí build, pokud service worker precachuje chybějící lokální asset.
- **N2 potvrzen a opraven.** Aplikační `scrollIntoView` vede přes `safeScrollIntoView`; transakční interní test záměrně simuluje výjimku kosmetického scrollování.
- **N3 potvrzen a opraven.** Testovací režim aktivuje pouze `?test` nebo přesný `#test`, ne podřetězce typu `#testy`.
- **N4 potvrzen a opraven.** Tisková session ukládá původní titulek pouze jednou, cleanup je idempotentní a má `afterprint` i timeoutovou pojistku. Interní PDF test ověřuje dvojí přípravu tisku a následnou obnovu titulku/UI.
- **N5 potvrzen a opraven.** Aplikační zápisy používají kanonické `ghrab.differentiator.*`; `dpl_*` se pouze jednorázově načte jako legacy fallback a odstraní. Platform migration zůstává kvůli existujícím uživatelům. Data manifest odpovídá novým credential klíčům.
- **N6 potvrzen částečně.** Odstraněny nepoužívané `enabled()`, `readDocx()`, lokální `assertInlineRequestSize`, lokální `GEMINI_TIMEOUT_MS`, nepoužívané CSS a nadbytečná HTML ID. Request limit a timeout nejsou odstraněny z architektury — vlastní je GHRAB AI Core/runtime.
- **N7 potvrzen a opraven.** Duplicitní `apple-touch-icon.png` je odstraněna a Apple touch link používá `icon-180.png`.
- **N8 potvrzen jako údržbová nekonzistence a opraven.** Literální ID selektory v API modulu jsou sjednoceny na `$('#id')`.
- **N9 potvrzen jako dokumentační nejasnost a opraven.** Hlavní regresní skript popisuje, kde žijí T2/T6/T7; nové stabilizační regrese jsou T20–T24.

## Výkonové doporučení

Aktuální stropy jsou od 1.3.24 vedené v samostatném `src/config/performance-budget-baseline.json` a kontrolované `qa:budget-freeze`. Release tak nemůže rozpočet posunout pouze v consumer konfiguraci. N1 a N7 současně skutečně snížily precache/duplicitní data. Další funkční růst má být hrazen úsporou nebo lazy-loadem, nikoli automatickým posouváním stropů.

## Ověření

- standardní build: service-worker precache kontrola PASS;
- school-server build: service-worker precache kontrola PASS;
- interní Chromium testy: 142/142 PASS;
- regresní gate: T1, T3–T5, T8–T24 PASS;
- Platform conformance: 109/109 PASS;
- quality: 31/31 PASS;
- model profiles, visual assets, scans, STEM a all-subject browser gates: PASS v Direct i School režimu;
- error reporter: 56 PASS / 0 FAIL (browserová část lokálně NOT_READY kvůli spravovanému URLBlocklistu);
- `qa:runtime`: lokálně blokováno `ERR_BLOCKED_BY_ADMINISTRATOR`;
- `qa:axe`: lokální prostředí `not-ready-environment` bez přesného `axe-core 4.12.1`.

## Záměrně nezměněno

Tlačítko **Testy** v produkční nabídce zůstává vědomě dostupné jako diagnostický nástroj pro kolegy. Nejde o auditní chybu.
