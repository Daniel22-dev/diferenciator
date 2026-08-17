# Audit Diferenciátoru 1.3.32 — Visual Intent Routing

**Datum:** 2026-08-17  
**Výchozí verze:** 1.3.31 CI-ZERO-LIVE-REQUESTS  
**Trigger:** reálný nevyhovující PDF výstup „You and Your Body – Advanced Vocabulary & Physiology Revision“

## Verdikt

**GO FOR GITHUB CANDIDATE.** Potvrzené systémové vady z reálného výstupu jsou uzavřeny deterministickými pravidly a regresními testy. Skutečný providerový re-test nebyl proveden, aby se nespotřebovávala omezená soukromá API kvóta; po nasazení je vhodný jeden vědomý uživatelský re-test se stejným zdrojovým DOCX.

## Potvrzené chyby 1.3.31

### P0 — TASK_IMAGE se zachoval jako originální obraz

Zdrojové screenshoty obsahovaly samotné textové/matching úlohy. Pipeline je přesto považovala za obrazy určené k zachování. Výsledek proto obsahoval původní nediferencovanou úlohu i nové instrukce kolem ní.

**Oprava:** didaktický `intent`; `task_image` a `hybrid` defaultují na `reconstruct`, `content_visual` na `preserve`.

### P0 — Duplicitní VISUAL_n

Stejný zdrojový obraz se mohl objevit vícekrát ve student outputu.

**Oprava:** `sanitizeVisualMarkers()` deterministicky deduplikuje raw marker; anotovaný zdroj potlačí vedlejší raw bitmapu. Browser QA ověřuje max. jeden výskyt.

### P1 — Marker uvnitř věty

Model mohl vytvořit konstrukce typu „Refer to the diagram below [[VISUAL_1]]. Match…“, po nahrazení markeru obrazem vznikla roztržená věta.

**Oprava:** preserve prompt vyžaduje samostatný blok; sanitizer marker normalizuje na blokový řádek mezi odstavci.

### P0 — Rozpad hierarchie bodování

Původní výstup měl hlavní sekci za 5 bodů, ale stejné „(5 b.)“ se propsalo na jednotlivé očíslované podbody a dokument skončil chybným součtem 90 bodů.

**Oprava:** stránkovací parser a parser hlavních bodovaných úloh jsou odděleny. PDF dostal `scoringIntegrityIssues()` gate; ruční editor bodování nabízí jen skutečné hlavní nadpisy.

### P1 — Nevyžádaná nová hlavní extension úloha

Model přidal samostatnou analytickou úlohu nad rámec původního pracovního listu.

**Oprava:** default prompt zakazuje novou samostatnou hlavní úlohu bez source counterpart. Učitel může tuto možnost explicitně povolit checkboxem.

## Implementační změny

- `src/js/30-api-gemini.js`
  - `VISUAL_INTENTS`, `reconstruct` mode, intent/confidence manifest;
  - intent-driven default modes;
  - rekonstrukční/preserve instrukce;
  - deduplikace a block normalization markerů;
  - oddělený scoring parser a integrity checks.
- `src/js/40-vystup-pdf-kvalita.js`
  - deterministic scoring validation;
  - PDF export block při nekonzistentním bodování;
  - manual score editor filtruje pouze skutečné hlavní úlohy.
- `src/js/20-zaklad-ui-projekty.js`
  - `allowExtensions` persisted option;
  - project import už neresetuje visual intent/mode na preserve.
- `src/body.html`, `src/styles.css`
  - didaktické visual-role UI;
  - bulk recommended action;
  - extension opt-in.
- QA
  - nový real-world BODY fixture;
  - T30;
  - visual browser QA pro `task_image -> reconstruct`, deduplikaci a block marker;
  - interní scoring regrese.

## Release gate

Finální stav po opravách:

- `npm test` PASS;
- 109/109 platform conformance;
- 146/146 interních testů;
- 56/56 specialistických testů;
- visual-assets browser PASS;
- Office-rich browser PASS;
- renderer browser PASS;
- multimedia 19/19 PASS;
- `qa:quality` 31/31 PASS;
- XSS regression PASS;
- school-server build PASS.

### Performance

Budget nebyl měněn:

- dist 1 048 446 / 1 050 000 B;
- entry HTML 456 500 / 490 000 B;
- entry critical 606 949 / 670 000 B;
- largest inline script 345 010 / 380 000 B;
- precache 926 707 / 970 000 B;
- duplicate large bytes 0 / 30 000 B.

### CI a API kvóta

T29 zůstává blokující: GitHub Actions nesmějí obsahovat live Gemini provider smoke ani provider secret. Běžný vývoj/deploy spotřebuje 0 live Gemini requests.

## Zbytkové riziko

Visual-intent klasifikace je výstup modelu v existujícím multimodálním requestu. Proto může u skutečně hraničního hybridního podkladu zůstat potřeba učitelské korekce; UI roli, jistotu a doporučení zobrazuje a umožňuje přepsat. Kritické je, že `task_image` už nemá automatickou cestu „zachovat pixely“ a výstupní deduplikace/scoring gate nejsou pouze promptové.

## Doporučený acceptance krok po nasazení

Jednou znovu nahrát původní `Vocab - body(1).docx`, použít doporučení pro všechny a vytvořit jednu variantu. Očekávání:

1. tři screenshoty textových úloh budou rozpoznány jako `task_image` a výchozí akce bude rekonstrukce;
2. ve výsledném listu nebudou původní bitmapové úlohy;
3. nebude duplicitní `VISUAL_n`;
4. zachované skutečné vizuály se budou vkládat blokově;
5. bodování bude hierarchicky konzistentní;
6. bez opt-in nevznikne nová samostatná hlavní úloha nad rámec originálu.
