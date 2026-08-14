# Diferenciátor 1.3.24 — GARP stabilizace po auditu 1.3.19

Tato verze nereviduje znovu již uzavřené funkční fáze 1–4. Jde o cílený review staršího Claude auditu 1.3.19 proti aktuálnímu kódu 1.3.23.

## Potvrzené a opravené nálezy
- N1: runtime deployment konfigurace odstraněny z `CORE_ASSETS`; standardní i school-server build nyní shodí build, pokud precache odkazuje na neexistující soubor.
- N2: všechna aplikační `scrollIntoView` vedou přes bezpečný helper; interní transakční test simuluje vyhozenou výjimku.
- N3: `#testy` už neaktivuje interní režim; jen `?test` nebo přesně `#test`.
- N4: tisk uchová původní titulek jen jednou a má idempotentní `afterprint` + 2,5s cleanup pojistku.
- N5: primární storage namespace je `ghrab.differentiator.*`; `dpl_*` je pouze jednorázový migrační fallback. Aktualizován je i datový manifest credential klíčů.
- N6: odstraněny nepoužívané `enabled()`, `assertInlineRequestSize`, `readDocx()` a `GEMINI_TIMEOUT_MS`; timeout a velikost requestu zůstávají v GHRAB AI Core/runtime kontraktu. Odstraněny nepoužívané CSS a nadbytečná HTML ID.
- N7: duplicitní `apple-touch-icon.png` odstraněna; Apple touch link používá existující `icon-180.png`.
- N8: literální ID selektory v API modulu sjednoceny na `$('#id')`.
- N9: mezery T2/T6/T7 jsou výslovně zdokumentované s odkazem na samostatné QA brány.

## Výkon
Aktuální výkonové stropy jsou od 1.3.24 zmrazeny souborem `src/config/performance-budget-baseline.json` a `qa:budget-freeze`. Další vydání už nemůže rozpočet tiše navýšit bez vědomé změny baseline. Odstranění duplicitní ikony a runtime deploymentů zároveň snížilo precache/distribuční objem.

## Záměrně nezměněno
Tlačítko **Testy** v produkční nabídce zůstává vědomě dostupné jako diagnostický nástroj pro kolegy. Nejde o auditní chybu.
