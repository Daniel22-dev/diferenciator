# Diferenciátor 1.3.32 — Practical QA hotfix

Tento hotfix vznikl z praktického testu pracovního listu „You and your body“. Aplikační verze zůstává 1.3.32; mění se pouze cílené chování importu, strukturálního režimu, normalizace bodování a automatické Normální verze.

## Opravené praktické nálezy

1. **Pořadí plovoucích obrázků v DOCX**
   - Pokud Word uloží více plovoucích obrázků do jednoho odstavce v pořadí vložení, Diferenciátor nově použije jejich `wp:positionV/wp:posOffset` a seřadí je shora dolů.
   - Pokud není pozice spolehlivě porovnatelná nebo jsou v odstavci inline/mixed objekty, zůstává bezpečný XML/document-order fallback.
   - Duplicitní reference stejného obrázku se nadále deduplikují.

2. **Explicitní Flexible má přednost**
   - `sourceStructureContract()` už nevnucuje strict pouze podle variant mode.
   - Automatika zůstává strict tam, kde má být, ale výslovná volba učitele „Může upravit strukturu…“ je autoritativní.

3. **Odstranění `Total points: N`**
   - `stripGeneratedScoring()` nyní odstraní i anglický tvar `Total points: 5` a obdobné samostatné součty.
   - Tím nezůstává zbytkové bodování při režimech Ruční / Bez bodování.

4. **Jednotný význam Normální verze**
   - Automatická Normální verze samostatně i v celé sadě zachovává původní obsah, strukturu a obtížnost jako referenční standard.
   - Paralelní materiál s novým obsahem je nadále dostupný explicitně přes „Stejný formát, jiný obsah“.

## Regresní ochrana

- Interní test: vizuální pořadí plovoucích DOCX obrázků.
- Interní test: explicitní Flexible nevynucuje strict kontrakt.
- Interní test: `Total points: N` se v no-scoring normalizaci odstraní.
- Interní test: samostatná a dávková Normální verze používají stejný význam.
- `qa:regressions`: nový T34 pro všechny čtyři opravy.

## Zásady

- Žádný nový Gemini/API request.
- Žádné zvýšení performance budgetů.
- Stávající Visual Intent Routing, scoring gate, Pages resilient deploy a zero-live-Gemini CI politika zůstávají zachovány.

## Ověření hotfixu

- `npm run qa:regressions`: PASS včetně nového T34.
- `npm run build`: PASS.
- Platform conformance po buildu: 109/109 PASS.
- `npm run qa:quality`: 31/31 PASS; zmrazené performance budgety nebyly zvýšeny (`distBytes` 1 039 880 / 1 050 000 B).
- `npm run qa:school-build`: PASS.
- Přímý deterministický test skutečného DOCX `Vocab - body(2).docx`: `image1.png → image3.jpeg → image2.png`, tedy stejné pořadí jako vizuálně na stránce.
- Přímý test no-scoring normalizace: `Total points: 5`, `Total: 5 points` i `Celkem bodů: 5` se odstraní společně s bodovým suffixem úlohy.
