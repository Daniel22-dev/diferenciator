# Audit Diferenciátoru 1.3.26 — úplnost pro gymnázium

**Datum:** 14. 8. 2026  
**Výchozí balíček:** `diferenciator-1.3.25-GARP-CI-HOTFIX-GITHUB(1).zip`  
**Auditovaná a rozšířená pracovní verze:** 1.3.26  
**Cíl auditu:** ověřit, zda lze z reálných materiálů napříč gymnaziálními předměty vytvořit pracovní list a/nebo další paralelní/diferencovanou verzi testu bez ztráty odborného zápisu, dat a vizuálních podkladů.

## 1. Verdikt

**GO WITH KNOWN ISSUES.**

Verze 1.3.26 je výrazně univerzálnější než vstupní 1.3.25 a pro **statické školní materiály** (text, obrázek, PDF, DOCX, PPTX, XLSX a běžné textové formáty) má nyní robustní společnou cestu pro jazyky, humanitní, společenskovědní, přírodovědné, matematické, informatické, umělecké i pohybové předměty. Byly doplněny předmětové profily, Office obrazové podklady, technický přepis nativních grafů a ochrana hodnot uvnitř zachovaných vizuálů.

Požadavek **„od všeho“ ale ještě není splněn absolutně**. Za blokující mezery pro 100% univerzálnost považuji zejména:

1. přímý vstup **audio a video** (poslechy, hudební ukázky, filmové ukázky, analýza pohybu),
2. **pixelově přesné nativní Office objekty** (zejména DOCX graf/SmartArt a nativní PPTX/XLSX grafy bez PDF/snímku),
3. **generování zcela nového odborného vizuálu** při paralelní variantě (nová slepá mapa, nový notový zápis, nový elektrický obvod, nová strukturní formule, nový geometrický nákres) — aplikace dnes správně zachová dodaný obraz, ale sama jej odborně nepřekreslí,
4. **plný matematický sazební engine** pro libovolný raw LaTeX; běžný zápis je podporován, složité konstrukce jsou bezpečnější přes Word Equation / obrázek / PDF,
5. chybí **živý oborový smoke test proti skutečnému AI provideru** pro celou matici; browserové QA používá testovací hooky/moky a ověřuje pipeline, prompty, rendering a invariants, ne absolutní faktickou správnost každého budoucího modelového výstupu.

## 2. Co bylo v 1.3.25 skutečně nedostatečné

Audit našel konkrétní problémy, nikoli jen teoretické rezervy:

- řada reálných názvů předmětů a seminářů padala do obecného režimu (např. italština, portugalština, řečtina, algebra, geometrie, statistika, astronomie, geologie, finanční gramotnost, databáze, robotika, datová věda, dramatická/audiovizuální výchova),
- přesné názvy školních seminářů a skloňované varianty nebyly dost robustní,
- PPTX a XLSX sice uměly text, ale vložené obrázky nebyly vedeny stejnou bezpečnou visual-assets cestou jako DOCX,
- nativní XLSX graf mohl při importu prakticky zmizet z významové vrstvy,
- paralelní varianta mohla dostat instrukci změnit konkrétní data a zároveň zachovat původní graf/mapu, což vytvářelo možnost vnitřně rozporného testu,
- „all-subject“ brána byla příliš hrubá na to, aby dokazovala reálné gymnaziální pokrytí.

## 3. Co bylo změněno

### 3.1 Předmětové směrování

Browserová matice nyní obsahuje **111 názvů a školních variant**. Nejde jen o názvy předmětů, ale i o formulace typu:

- Seminář z matematiky / Matematický seminář,
- Seminář z fyziky / Fyzikální praktikum,
- Laboratorní cvičení z chemie,
- Biologické praktikum,
- Zeměpisný / Geografický seminář,
- Historický / Dějepisný seminář,
- Společenskovědní / Ekonomický seminář,
- Informatický / Programovací seminář,
- Hudební / Výtvarný seminář,
- Literární / Debatní seminář,
- Konverzace v angličtině i obecně pojmenovaná jazyková konverzace,
- Člověk a svět práce, kariérová výchova, osobnostní a sociální výchova, multikulturní a environmentální výchova.

Bezpečnostní profily jsou záměrně širší než konkrétní školní názvy: **language, STEM, geography, history, civics, informatics, music, art, PE, humanities + general fallback**. To umožňuje obsloužit i volitelný předmět, který nemá přesně předdefinovaný název.

### 3.2 STEM

Rozšířeno a ověřováno:

- matematika, algebra, geometrie, deskriptivní geometrie, statistika, pravděpodobnost, kombinatorika, matematická analýza, finanční matematika,
- fyzika, mechanika, optika, elektromagnetismus, astronomie/astrofyzika,
- chemie, biochemie a běžné chemické rovnice/náboje/koeficienty,
- biologie, ekologie, environmentální výchova, genetika, anatomie, fyziologie, botanika, zoologie,
- geologie, mineralogie, petrologie a vědy o Zemi.

Lokální ochrany kontrolují mj. jednoduché aritmetické rovnosti, některé lineární rovnice, převody jednotek, bilanci chemických rovnic a náboje. Nejde o CAS ani úplný formální dokazovač — finální odbornou správnost stále potvrzuje AI audit + učitel.

### 3.3 Vizuály a paralelní varianta

Pro zachovaný obrazový podklad platí nový invariant:

> hodnoty, popisky, polohy, symboly a fakta zakódované v zachovaném obrazu se při paralelní variantě nesmí změnit.

Pokud tedy zadání používá dodanou slepou mapu, graf, schéma, notový zápis, anatomický obrázek nebo reprodukci, paralelní varianta může změnit otázky a data mimo obraz, **nikoli tajně změnit význam obrazu bez jeho překreslení**.

### 3.4 Office

- **DOCX:** text + vložené obrázky + Word Equation převod do zachovatelného textového zápisu.
- **PPTX:** text snímků + vložené obrázky; nově se detekují nativní grafy a jejich zdrojové oblasti/uložené hodnoty; SmartArt/nativní diagramy předají AI alespoň svou textovou vrstvu.
- **XLSX:** buňky, hodnoty, vzorce, vložené obrázky; nativní grafy předají AI zdrojové oblasti a cached values.

Nativní graf/SmartArt není považován za pixelově zachovaný, pokud není dodán jako PDF/snímek.

## 4. Předmětová pokrytí

| Oblast / předmět | Co jsem ověřoval | Stav |
|---|---|---|
| Český jazyk | text, mluvnice, tabulky, otevřené/uzavřené úlohy, dlouhý zdroj | **PASS** |
| Literatura | pramen, citace ze zdroje, interpretace, více obhajitelných odpovědí | **PASS** |
| Cizí jazyky | cílový jazyk, CEFR, gramatika, překlad, reading, tabulky, alternativní odpovědi | **PASS** pro text/obraz; **GAP** audio listening |
| Latina / další jazyky | obecný language profil, diakritika/Unicode, skloňované názvy | **PASS** pro text |
| Matematika | zlomky, odmocniny, mocniny, indexy, rovnice, nerovnice, funkce, statistika, vektory, matice, integrály, sumy, limity | **PASS/PARTIAL** — běžná notace ano, plný TeX ne |
| Geometrie / deskriptiva | geometrický obrázek, popisky, vazba obrazu na zadání | **PASS** při dodaném obrazu; **PARTIAL** pro nové konstrukce |
| Fyzika | vzorce, jednotky, převody, grafy, experimentální data, elektrická schémata | **PASS** při dodaném grafu/schématu |
| Astronomie | fyzikální vztahy + grafické/obrazové podklady | **PASS** |
| Chemie | vzorce, koeficienty, náboje, reakce, stechiometrie | **PASS** |
| Organická chemie | strukturní vzorec jako obraz | **PASS** při dodaném obrazu; **PARTIAL** pro novou kresbu |
| Biologie | terminologie, klasifikace, genetické tabulky, procesy | **PASS** |
| Anatomie | anatomický obrázek a popisky | **PASS** při dodaném obrazu |
| Ekologie/environmentální | data, vztahy, grafy, více podmíněných odpovědí | **PASS** |
| Geologie/vědy o Zemi | mapa, profil, vzorek, stratigrafická posloupnost | **PASS** při dodaném podkladu |
| Zeměpis/geografie | slepé mapy, souřadnice, měřítko, časová pásma, klimatické grafy, tematické mapy | **PASS** při dodané mapě/grafu; **PARTIAL** pro novou mapu |
| Dějepis | chronologie, časová osa, prameny, skeny, interpretace | **PASS** |
| ZSV / občanský základ | fakta vs. názor, právní/politické/ekonomické údaje | **PASS** se safeguardem na časově citlivá fakta |
| Psychologie/sociologie/politologie/filozofie | otevřené odpovědi, pojmy, argumentace | **PASS** |
| Ekonomie/finanční gramotnost | tabulky, grafy, výpočtové prvky, časově citlivé údaje | **PASS** s kontrolou data/zdroje |
| Informatika | zdrojový kód, speciální znaky, algoritmy, DB tabulky, očekávaný výstup | **PASS/PARTIAL** — bez reálného compiler sandboxu |
| Databáze / robotika / data science | tabulky, algoritmy, kód, schémata | **PASS** pro statický materiál |
| Hudební výchova/nauka | ♯ ♭ ♮, rytmické symboly, metrum, notový obraz | **PASS** pro text/obraz; **GAP** audio |
| Výtvarná výchova/dějiny umění | reprodukce, fotografie, vizuální analýza | **PASS** při dodaném obrazu |
| Fotografie/design | obrazový podklad, popis, analýza | **PASS** |
| Dramatická/filmová/audiovizuální | text, scénář, statický snímek | **PASS** staticky; **GAP** video |
| Tělesná výchova | textové testy, pravidla, bezpečnostní otázky | **PASS** |
| Sportovní příprava | statické schéma/postup | **PASS**; **GAP** video pohybu |
| Výchova ke zdraví | bezpečnostní hranice, bez diagnóz | **PASS** |
| Člověk a svět práce / kariérová | společenskovědní směrování, modelové situace | **PASS** |
| OSV/multikulturní/průřezová témata | text, situace, reflexe, otevřená odpověď | **PASS** |
| Integrovaný/projektový seminář | obecný fallback + učitelský kontext | **PASS** jako obecný materiál; oborový profil závisí na názvu |

## 5. Typy úloh a odborné prvky

Matice nyní eviduje **70 obsahových primitiv**. Ověřované skupiny:

### Jazyk a obecná didaktika
- multiple choice, matching, gap-fill,
- otevřená odpověď, esej, překlad,
- reading/source text, dlouhý zdroj,
- bodování, rubrika, klíč,
- markdown/tab tabulky.

### Matematika
- zlomky, odmocniny, mocniny, indexy,
- rovnice, nerovnice, soustavy,
- funkce, množiny,
- pravděpodobnost a statistika,
- matice, vektory,
- integrály, sumy, limity,
- souřadnicové grafy.

### Fyzika
- fyzikální vzorce,
- vědecký zápis,
- převody jednotek,
- experimentální data,
- grafy,
- elektrická schémata.

### Chemie
- chemické vzorce,
- reakční rovnice,
- náboje,
- stechiometrie,
- strukturní formule jako obraz,
- Lewisovy struktury jako obraz.

### Biologie a přírodní vědy
- biologická/anatomická schémata,
- genetické tabulky,
- klasifikace,
- geologické mapy/profily/vzorky.

### Zeměpis
- slepé mapy,
- měřítko,
- souřadnice,
- časová pásma,
- klimatické grafy,
- tematické mapy.

### Dějepis a humanitní vědy
- časové osy,
- historické prameny,
- skeny,
- citace ze zdroje,
- interpretace s více obhajitelnými odpověďmi.

### Společenské vědy
- právní a statistické údaje s časovým kontextem,
- ekonomické tabulky a grafy,
- fakt / názor / modelový příklad.

### Informatika
- kód a escaping `< > &` apod.,
- algoritmické trasování,
- databázové tabulky,
- logická schémata.

### Hudba a umění
- předznamenání,
- rytmické symboly,
- notový zápis jako obraz,
- reprodukce,
- fotografie.

### Office-native
- spreadsheet buňky + vzorce,
- PPTX nativní graf — datový přepis,
- PPTX SmartArt — textový přepis,
- XLSX nativní graf — datový přepis.

## 6. Vstupní formáty

| Formát | Text | Vložený obraz | Nativní graf/diagram | Verdikt |
|---|---:|---:|---:|---|
| ručně vložený text | ano | — | — | **PASS** |
| obrázek JPG/PNG/WebP/GIF | AI vizuální čtení | ano | součást obrazu | **PASS** |
| PDF | AI text + vizuální čtení | vizuálně ano | vizuálně ano | **PASS**, pixelový re-use kritického prvku přes snímek/výřez |
| DOCX | ano | ano | ne explicitně | **PASS/PARTIAL** |
| PPTX | ano | ano | graf=data, SmartArt=text | **PASS/PARTIAL** |
| XLSX | ano + vzorce | ano | graf=data | **PASS/PARTIAL** |
| TXT/MD/CSV/TSV/JSON | ano | ne | ne | **PASS** |
| HTML | čistý text | ne | ne | **PARTIAL** |
| RTF | čistý text | ne | ne | **PASS/PARTIAL** |
| DOC/PPT/XLS | ne | ne | ne | **UNSUPPORTED** — převést na nový Office formát/PDF |
| audio | ne | ne | — | **GAP** |
| video | ne | ne | — | **GAP** |

## 7. Vizuální fidelita

### Plně zachovatelné jako asset
- mapa / slepá mapa dodaná jako obraz,
- graf dodaný jako obraz,
- diagram/schéma dodané jako obraz,
- geometrický nákres jako obraz,
- biologický/anatomický obrázek,
- chemická struktura jako obraz,
- tabulka jako obraz,
- notový zápis jako obraz,
- časová osa jako obraz,
- elektrické schéma,
- molekulový obraz,
- reprodukce díla,
- fotografie,
- obrazový pramen.

### Podmíněné
- kritický vizuál uvnitř PDF: AI ho umí číst, ale pro přesné znovupoužití je nutný snímek/výřez,
- nativní PPTX/XLSX graf: významová/data vrstva ano, pixelová podoba ne,
- PPTX SmartArt: textová vrstva ano, přesná geometrie ne,
- DOCX nativní graf/SmartArt: není explicitně parsován.

### Co se úmyslně nedělá
Aplikace nesmí předstírat, že bezpečně vytvořila nový odborný obrázek, když pro něj nemá deterministický renderer. Proto se při paralelní variantě raději zachová původní vizuál a mění se otázky kolem něj.

## 8. Testovací důkazy finální pracovní verze

### Funkční a regresní testy
- `npm test`: **PASS**,
- interní testy: **142/142 PASS**,
- platform conformance: **109/109 PASS**,
- AI profile gate: **22/22 PASS**,
- all-subject statická brána: **63/63 PASS**,
- all-subject browser: **111/111 routovacích případů PASS** + CEFR/prompt/validace/tabulky/PDF,
- `qa:office-rich`: **PASS** na fyzicky vytvořeném syntetickém PPTX a XLSX,
- visual-assets browser gate: **PASS**,
- scan/PDF browser gate: **PASS**,
- STEM browser gate: **PASS**,
- regresní brána T1–T28: **PASS**.

### Výkonová brána
`qa:quality`: **31/31 PASS**.  
Zmrazený strop pro největší inline script zůstal dodržen: **379 524 B ≤ 380 000 B**.

### P5
Kompletní `qa:p5` projde všemi testy až k `qa:runtime`. Tam headless Chromium v tomto auditním prostředí odmítne lokální HTTP navigaci:

`net::ERR_BLOCKED_BY_ADMINISTRATOR`

To je environmentální politika sandboxu, nikoli zjištěná runtime chyba aplikace. Následně:

- `qa:xss`: **PASS**,
- release report: **36/37**, jediný fail = chybějící runtime report,
- acceptance: **13/15**, oba fail body jsou přímým důsledkem chybějícího runtime reportu/release statusu.

**P5 proto v tomto prostředí nelze označit za plně certifikovaný. Runtime report se nesmí falšovat ani nahrazovat testem s jinou transportní semantikou.**

## 9. Co testy nedokazují

Zelená QA není důkazem, že libovolný budoucí generativní výstup AI bude vždy fakticky správný. V tomto auditu nebyl k dispozici produkční provider klíč pro stovky živých oborových generací. Automatické browserové testy ověřují:

- směrování předmětu,
- sestavení odborných promptů,
- předání médií,
- zachování vizuálů,
- strukturu výstupu,
- lokální validace,
- rendering a PDF,
- regresní invariants.

Pro skutečnou „modelovou“ akceptaci doporučuji později doplnit provider smoke matrix s malým počtem pečlivě vybraných zlatých úloh pro každý profil a s deterministickou následnou validací.

## 10. Priority pro další verzi, pokud má platit doslova „od všeho“

### P0 — multimédia
1. Audio vstup: WAV/MP3/AAC/OGG/FLAC apod.
2. Poslechový režim: zdrojové audio se eviduje jako samostatný asset; žákovská verze nesmí omylem obsahovat transcript, pokud má být úloha poslechová.
3. Video vstup pro film/audiovizuální výchovu a případně pohybovou analýzu; s rozumným size/file workflow.

### P1 — odborné vizuální renderery
4. Deterministický grafový renderer z dat (čárový/sloupcový/koláčový/scatter + osy), aby paralelní varianta mohla opravdu změnit data a vytvořit nový konzistentní graf.
5. Matematická sazba přes plnohodnotný bezpečný engine pro pokročilé výrazy.
6. Geometrické SVG konstrukce / souřadnicové systémy.
7. Notový renderer pro nově generované krátké příklady.
8. Chemický renderer pro strukturní formule z bezpečného strukturovaného zápisu.
9. Volitelná knihovna mapových podkladů pro nové slepé mapy; nepoužívat generativní obrázek tam, kde je potřeba kartografická přesnost.

### P1 — Office fidelita
10. DOCX charts/SmartArt explicitní parser nebo deterministická rasterizace.
11. PPTX/XLSX nativní grafy umět převést do vlastního grafového rendereru, ne jen na data/text.
12. HTML import včetně lokálních/embedded obrázků a tabulek při zachování bezpečnosti.

### P1 — živá oborová akceptace
13. Golden-set smoke testy proti skutečnému provideru pro reprezentativní předměty a rizikové typy úloh.
14. Zvláštní faktické validátory tam, kde jsou levné a deterministické (např. více jednotek, funkce, statistika, jednoduchá programová očekávání).

## 11. Doporučení pro release

**1.3.26 lze vydat jako „Gymnasium coverage hardening“ s verdiktem GO WITH KNOWN ISSUES**, pokud release notes výslovně zachovají hranice uvedené výše.

Pro marketingové/uživatelské tvrzení **„funguje na všechny možné gymnaziální materiály“** bych 1.3.26 ještě nepoužil. Přesnější tvrzení je:

> Diferenciátor 1.3.26 pokrývá širokou škálu statických gymnaziálních testů a pracovních listů napříč předměty, včetně vzorců, rovnic, tabulek, obrázků, grafů, schémat a mapových podkladů. U odborných vizuálů preferuje bezpečné zachování originálu. Audio/video a některé nativní Office/nově generované odborné vizuály zůstávají omezené.

Až po P0/P1 bodech výše bude technicky obhajitelné usilovat o doslovný cíl „od všeho“.
