# Diferenciátor 1.3.32 — Visual Intent Routing

**Datum:** 2026-08-17  
**Výchozí release:** 1.3.31 CI-ZERO-LIVE-REQUESTS

## Proč tato verze vznikla

Reálný test s pracovním listem „You and your body“ odhalil, že obrazová pipeline zaměnila screenshoty/naskenované úlohy za skutečné didaktické obrázky. Výsledný PDF list proto zachoval původní úlohy jako bitmapy, některé `VISUAL_n` vložil opakovaně, roztrhl věty kolem markerů a při ručním bodování přenesl bodovou hodnotu hlavní úlohy na očíslované podbody. Současně byla bez explicitního souhlasu přidána nová samostatná extension úloha.

## Hlavní změny

### 1. Visual Intent Routing

Každý obrazový podklad nyní nese didaktickou roli:

- `content_visual` — skutečný obrazový podklad, např. mapa, graf, fotografie nebo odborné schéma;
- `task_image` — textová/tabulková úloha zachycená jako bitmapa nebo scan;
- `hybrid` — skutečný vizuál a textová úloha v jednom obrazu;
- `decorative` — nedidaktická grafika;
- `unknown` — role není spolehlivě určena.

Klasifikace je součástí již existující multimodální analýzy, takže nevzniká nový samostatný API request.

### 2. TASK_IMAGE se rekonstruuje

`task_image` a `hybrid` mají výchozí režim `reconstruct`. Model dostane zdrojový obraz pro čtení, ale původní bitmapu nesmí vložit do žákovského výstupu. Má zachovat význam, položky, vazby a řešitelnost a vytvořit novou čistou diferencovanou úlohu.

`content_visual` má výchozí režim `preserve`: originální obraz se nepřekresluje a může se použít jako odborný podklad.

### 3. Nové UI obrazových podkladů

Panel zobrazuje rozpoznanou roli, jistotu a doporučenou akci. Přibyl hromadný příkaz **Použít doporučení pro všechny**. Učitel může doporučení vždy ručně změnit.

### 4. Deduplikace a blokové vkládání VISUAL_n

Raw marker stejného `VISUAL_n` se ve výsledku zachová nejvýše jednou. Zachovaný marker je normalizován na samostatný blokový řádek; nesmí rozdělit větu na dva fragmenty. Pokud je stejný zdroj použit přes `EDU_ANNOTATE`, raw bitmapa se vedle anotované verze nevkládá.

### 5. Scoring integrity gate

Tiskové stránkování a identifikace hlavních bodovaných úloh jsou nyní dvě oddělené logiky. Očíslované podbody typu `1. shake ___` se nepovažují za samostatnou hlavní úlohu pro ruční bodování.

Před PDF exportem se kontroluje:

- bodový součet podbodů proti deklarované hodnotě hlavní úlohy;
- součet hlavních úloh proti deklarovanému `Celkem/Total`;
- rozporné celkové součty.

Nekonzistentní bodování PDF export zablokuje a vyžádá opravu nebo změnu režimu bodování.

### 6. Nové samostatné úlohy jsou opt-in

Ve výchozím stavu model nesmí přidat další samostatně číslovanou hlavní úlohu, která v originálu nemá předlohu. Přidání nové extension úlohy je možné jen po zapnutí volby **Povolit novou rozšiřující úlohu nad rámec originálu**.

## Regrese z reálného BODY testu

Přidán `test-fixtures/visual-intent-body-regression.json` a blokující T30. Fixture zachycuje přesně třídu vad z reálného výstupu:

- tři screenshoty úloh se nesmějí výchozím způsobem zachovat jako bitmapy;
- duplicitní `VISUAL_n` nesmí projít;
- marker se nesmí vložit inline do věty;
- rozpad bodování typu „hlavní úloha 5 b. + každý podbod 5 b. + Celkem 90 b.“ musí být odmítnut;
- samostatná extension úloha je bez opt-in zakázaná.

## Ověření

- `npm test` — PASS
- platform conformance — 109/109 PASS
- interní testy — 146/146 PASS
- specialist engines — 56/56 PASS
- visual-assets browser QA — PASS
- Office-rich browser QA — PASS
- renderer browser QA — PASS
- multimedia — 19/19 PASS
- `qa:quality` — 31/31 PASS
- XSS regression inventory — PASS (`eval=0`, `new Function=0`)
- school-server build — PASS

Performance budgety nebyly zvýšeny. Finální měření při QA:

- `dist`: 1 048 446 / 1 050 000 B
- entry HTML: 456 500 / 490 000 B
- entry critical: 606 949 / 670 000 B
- largest inline script: 345 010 / 380 000 B
- precache: 926 707 / 970 000 B
- duplicate large assets: 0 B

## API kvóta

CI politika z 1.3.31 zůstává beze změny. Push, PR, P5 gate a deploy nevolají Gemini API a spotřebují **0 live Gemini requests**. T29 blokuje návrat provider secretu nebo live provider smoke do CI.

## Co nebylo provedeno

Nebyl znovu spuštěn skutečný Gemini generation request nad původním BODY dokumentem, aby se při současné omezené soukromé kvótě zbytečně nespotřeboval request. Třída chyby je pokrytá deterministickým fixture, statickou regresí a browserovým testem visual-intent pipeline. Praktický re-test v aplikaci je vhodný až po nasazení 1.3.32 a vědomém použití jednoho uživatelského requestu.
