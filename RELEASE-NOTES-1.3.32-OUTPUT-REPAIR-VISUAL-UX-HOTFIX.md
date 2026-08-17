# Diferenciátor 1.3.32 — Output Repair / Visual UX hotfix

Tento hotfix navazuje na Visual Intent Routing, Pages resilient deploy a Structure/Scoring UX hotfix. Aplikační verze zůstává 1.3.32.

## Co se mění pro učitele

- Volby u obrazových podkladů jsou vysvětlené přímo v aplikaci. U každého obrázku je krátký popis právě zvoleného režimu.
- „Dříve / Později“ je nahrazeno srozumitelným „Pořadí v materiálu: Posunout o místo výš / níž“ s vysvětlením účelu.
- Pokud si aplikace není jistá rolí obrázku, nic neoznačuje jako falešně „doporučené“ a hromadná akce nejisté podklady nepřepisuje.
- `Total points: N` je rozpoznáno i uvnitř běžné instrukce (např. `Time limit: 30 minutes. Total points: 34.`).
- Při skutečné nekonzistenci bodů se otevře lokální editor: učitel upraví body hlavních úloh, aplikace sama přepočítá celkový součet a může pokračovat k PDF. Žádný Gemini request navíc.
- Tlačítko **Upravit body** je dostupné i před pokusem o export PDF.
- Poznámka pro učitele už nepřebírá nekontrolovanou AI větu `Target audience`; cílová skupina se skládá z vybraného ročníku, věku a CEFR. Překlep `gymnasion` se nezobrazuje.
- Literální `*Scenario:*`, `*Task:*`, `*blushing*` apod. se renderují jako kurzíva; `---` se renderuje jako oddělovač.

## Zachované zásady

- Žádný nový AI request.
- GitHub Actions stále provádějí 0 live Gemini requestů.
- Pages resilient retry zůstává zachován.
- Performance limity se nezvyšují; hotfix musí projít stávajícími budgety.

## Finální ověření

- `npm test`: PASS; 156/156 interních testů PASS, specialistické enginy 56/56 PASS, browserové profily/vizuály/scan/Office/multimedia/renderery PASS.
- Platform conformance: 109/109 PASS.
- `qa:quality`: 31/31 PASS; zmrazené performance budgety nebyly zvýšeny (`distBytes` 1 039 250 / 1 050 000 B).
- `qa:school-build`: PASS.
- XSS sink regression: PASS; `eval` 0, `new Function` 0.
- T29–T33: PASS, včetně zero-live-Gemini CI, Pages retry, BODY scoring fixture a nového visual/scoring UX.
- Kompletní lokální `qa:p5:ci` doběhl až po `qa:runtime`; zdejší kontejner zablokoval navigaci na lokální testovací URL chybou `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Nejde o nalezenou chybu aplikace; předchozí browserové testy používající přímé Chromium/CDP prošly. GitHub Actions proto zůstává finálním runtime P5 ověřením po pushi.
