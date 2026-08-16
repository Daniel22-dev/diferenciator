# Diferenciátor 1.3.31 — GARP Audit Fixes

Verze 1.3.31 je opravný release po nezávislém hloubkovém auditu 1.3.30. Nezavádí nový odborný marker; uzavírá fail-open a tiskové chyby, zvyšuje adversariální QA a vytváří skutečnou performance rezervu bez zvýšení zmrazených budgetů.

## Hlavní změny

### EDU_TRACE

- `//` funguje jako celočíselné dělení a už se nezamění za inline komentář.
- URL/řetězce s `//` se nezkracují.
- Python-like modulo pro záporná čísla.
- Hodnotové porovnání polí.
- Stabilnější číselný výstup (`0.1 + 0.2` → `0.3`).
- `maxSteps` lze zvýšit až na 2000.
- Trace renderer umí 40–300 zobrazených kroků; delší běh zobrazí začátek a konec s explicitní mezerou místo tvrdého odmítnutí.

### EDU_REACTION

- Validace všech 118 chemických symbolů H–Og.
- Překlepy jako `NAOH` jsou fail-closed.
- Rovnice s vícerozměrným nullspace bez doplňující podmínky se odmítnou jako nejednoznačné.
- `expectedCoefficients` lze použít jako explicitní doplňující podmínku a lokálně se ověřují proti celé bilanci.

### Tisk/PDF

- Před `window.print()` se čeká na dokončení hydratace odborných vizuálů.
- `data-edu-ready="error"` je tisková stopka.
- Učitel vidí seznam chyb a musí zvlášť potvrdit vědomý override; běžné finální učitelské potvrzení samo nestačí.

### EDU_ANNOTATE

- Overlay používá viewBox podle skutečného poměru stran originálního obrázku.
- Kruh zůstává kruhem a text/šipky se na 16:9, 4:3 nebo A4 obrazech anizotropně nedeformují.

### Offline mapy

- `map-presets.js` je povinný service-worker core asset.
- Build selže, pokud některý specialistický modul není v SW evidován nebo pokud map preset není core precache položka.

### Performance

- Interní testovací konzole se načítá lazy jako `internal-tests.js`; není součástí kritického inline aplikačního bundle.
- Zmrazené performance limity nebyly zvýšeny.
- Largest inline: 333 436 / 380 000 B.
- +500 B kontrolní zásah do promptové vrstvy stále prochází quality 31/31.

## QA

- `npm test` PASS
- platform 109/109
- profiles 22/22
- all-subject static 92/92
- multimedia 19/19
- specialist adversarial 56/56
- interní testy 144/144
- renderer browser PASS
- quality 31/31
- XSS PASS
- school-server build PASS

`qa:p5` v auditním sandboxu doběhne k `qa:runtime`, kde lokální HTTP navigaci Chromia blokuje `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Live provider bez credentialu zůstává `SKIPPED`; produkční release musí projít required GitHub provider gate.

## Známý backlog, nikoli blocker 1.3.31

- rozčlenit/naformátovat historicky ručně kompaktní specialistické zdroje a zavést standardní build-time minifikaci;
- oddělit generované QA artefakty od případně verzovaných distribučních souborů jako samostatnou repozitářovou změnu;
- posílit XSS kontrolu ze sink-inventory směrem k explicitnímu taint/sink nebo hash-CSP modelu;
- poté spustit adversariální + corpus-driven benchmark nad reálnými gymnaziálními testy a pracovními listy.
