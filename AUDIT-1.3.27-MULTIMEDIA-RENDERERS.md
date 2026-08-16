# Audit Diferenciátoru 1.3.27 — multimédia, odborné vizuály a Office

**Datum:** 14. 8. 2026  
**Výchozí release candidate:** 1.3.26 Gymnasium Coverage  
**Auditovaná verze:** 1.3.27  
**Cíl:** přiblížit se požadavku „z libovolného gymnaziálního materiálu musí jít vytvořit pracovní list nebo další verze testu“ i u poslechů, videa a nově vytvářených odborných vizuálů.

## 1. Verdikt

**GO WITH KNOWN ISSUES.**

1.3.27 uzavírá dvě největší funkční mezery 1.3.26:

- audio/video je nyní přímý zdrojový vstup a má explicitní ochranu před odhalením odpovědi/transkriptu žákům;
- aplikace už není odkázána pouze na zachování dodaného obrázku: pro pět bezpečně ohraničených kategorií umí z dat vytvořit nový deterministický SVG vizuál.

Třetí velká mezera — nativní Office graf — je významově posílena: DOCX/PPTX/XLSX cached data mohou přejít na vlastní renderer. Komplexní Office objekty však nejsou obecně pixelově rekonstruovatelné.

## 2. Co lze nyní skutečně vytvořit

### Jazyky

- reading, use of English / gramatika, slovní zásoba, překlad, writing prompts, tabulky a obrázkové podklady;
- **listening** z přiloženého audia; paralelní verze může změnit otázky, nikoli zdrojovou nahrávku;
- video-based comprehension/observation z přiloženého videa;
- ochrana proti tomu, aby model vložil delší souvislý přepis do žákovského zadání.

### Matematika a statistika

- běžný matematický zápis zůstává chráněn předchozí STEM vrstvou;
- nový datový graf a souřadnicový geometrický nákres lze vytvořit z přesných číselných dat;
- lze měnit data i graf v paralelní verzi, pokud se společně aktualizuje `EDU_*` marker a klíč;
- složité konstrukce, 3D deskriptivní geometrie a plný TeX zůstávají mimo deterministický renderer.

### Fyzika

- vzorce, jednotky, převody, tabulky a grafy;
- nový datový graf nebo souřadnicový nákres lze vykreslit přímo;
- elektrické obvody zatím nejsou samostatný schematický generátor; přesný dodaný obvod se zachovává jako `VISUAL_n`.

### Chemie

- rovnice, koeficienty, indexy a náboje zůstávají v STEM vrstvě;
- jednoduchou atom-vazba 2D strukturu lze nově vykreslit deterministicky;
- nejde o cheminformatický engine: valence, stereochemie, aromatičnost a odborná správnost nejsou odvozovány kresličem.

### Biologie a geologie

- text, tabulky, genetické úlohy, grafy a dodané odborné obrázky;
- nové datové grafy jsou podporovány;
- anatomické, buněčné, stratigrafické a geologické odborné ilustrace se nadále bezpečněji zachovávají z originálu než nově generují.

### Zeměpis

- dodaná mapa/graf zůstává neměnný;
- nový jednoduchý slepý podklad lze vytvořit pro world, europe nebo czechia;
- lze zvýraznit ISO3 stát nebo přidat normalizovaný bod, ale skutečně slepá mapa má být bez popisků/zvýraznění;
- mapy jsou nízkorozlišovací školní obrysy a neslouží jako aktuální autorita pro sporné hranice.

### Dějepis / společenské vědy

- prameny, chronologie, tabulky, časově citlivé safeguardy, dodané mapy/reprodukce;
- nový jednoduchý graf nebo mapový obrys lze použít tam, kde je didakticky vhodný;
- aktuální právo/politika/ekonomická data stále vyžadují časový kontext/zdroj.

### Informatika

- kód, databázové tabulky, algoritmy a datové grafy;
- nejde o compiler/runtime sandbox, takže dynamické chování cizího kódu se automaticky neověřuje.

### Hudební výchova

- přímé audio řeší poslechové poznávání;
- `EDU_MUSIC` umí jednoduchou jednohlasou notaci s klíčem, metrem, tóny, délkami a předznamenáním;
- složitá partitura se má nadále použít jako původní obraz/PDF.

### Výtvarná / filmová / audiovizuální výchova

- reprodukce a fotografie se zachovávají jako originální podklady;
- video je přímý zdroj pro observační/analytickou úlohu;
- PDF obsahuje vazbu na video, nikoli vložený přehrávač.

### Tělesná výchova

- textové testy, pravidla a bezpečnostní úlohy;
- video lze použít jako zdroj pro pozorování techniky, ale aplikace není biomechanický měřicí systém a nevydává zdravotní diagnózy.

## 3. Multimediální bezpečnostní model

### Vstup

- audio/video má samostatnou detekci podle MIME i přípony;
- přímý zdroj je omezen na 12 MB;
- base64 payload musí navíc projít globálním limitem API požadavku;
- při chybě importu se obnoví předchozí zdrojový stav;
- při přepnutí na jiný typ vstupu se staré médium korektně odstraní.

### Žákovská a učitelská vrstva

- `[[MEDIA_SOURCE]]` je jediná žákovská vazba na zdroj;
- source prompt zakazuje zveřejnit transkript/titulky/odpovědi;
- answer-key a QA operace dostávají zdrojové médium jako teacher-side AI část;
- `mediaStudentSafetyIssues()` porovnává normalizovaný zdrojový přepis se student instructions/tasks a dlouhou souvislou shodu zablokuje;
- `[NESROZUMITELNÉ]` i `[NEČITELNÉ]` se považují za stav vyžadující učitelské ověření.

### Výstup

- obrazovka: HTML5 `<audio>` / `<video>` s lokálním data URL;
- PDF/tisk: pouze název zdroje a pokyn k přehrání/přiložení;
- projekt: zdrojové médium lze uložit a obnovit; projekt proto může být výrazně větší než čistě textový projekt.

## 4. Deterministické odborné renderery

### `EDU_CHART`

Vstupem jsou typ, popisky a číselné datové řady. Browser QA ověřil skutečný SVG sloupcový graf. Produkční prompt nabízí bar/line/pie, aby nebyla předstírána plnohodnotná numerická XY scatter vrstva.

### `EDU_COORD`

Přesně zadaný rozsah os, body, úsečky, polygony, kružnice a lomené čáry. Hodí se pro analytickou geometrii, jednoduché funkční/geometrické nákresy a některé fyzikální diagramy.

### `EDU_MUSIC`

Jednoduché jednohlasé příklady. Renderer nekontroluje harmonickou správnost a není náhradou MuseScore/LilyPond/kompletního notačního enginu.

### `EDU_CHEM`

Deterministicky vykreslí zadaný graf atomů a vazeb. Nevypočítává chemii; jeho přesnost je „to, co bylo zadáno, se zobrazí konzistentně“, ne „z názvu sloučeniny automaticky odvodím správnou strukturu“.

### `EDU_MAP`

Presety world/europe/czechia jsou lokální, bez externí sítě. V evropském browser testu bylo vykresleno 53 polygonů/zemí a zvýraznění CZE přesně jednou. Neobsahuje české kraje ani detailní administrativní členění.

## 5. Office

### DOCX

Testovaný syntetický dokument obsahoval text + nativní bar chart. Parser zachoval text, našel 1 graf, přečetl cached kategorie/hodnoty a vytvořil validní `EDU_CHART`.

### PPTX

Test obsahoval text snímku, nativní bar chart, SmartArt text a vložený PNG. Výsledek: 1 obrázek, 1 graf, 1 diagram; graf se převedl na rendererová data a SmartArt na textovou vrstvu.

### XLSX

Test obsahoval buňky, vzorec, nativní line chart a vložený PNG. Výsledek: vzorec zůstal čitelný, 1 obrázek a 1 graf; cached grafová data se převedla na `EDU_CHART`.

### Co Office stále neumí slíbit

- pixelově stejný vzhled nativního grafu;
- plnou rekonstrukci libovolného SmartArt/diagramu;
- spolehlivý převod každého typu grafu bez cached values;
- makra, dynamické externí datové zdroje a objektové vložky nejsou bezpečná univerzální vstupní vrstva.

## 6. Release QA — výsledky

| Brána | Výsledek |
|---|---:|
| `npm test` | PASS |
| Interní testy | **142/142** |
| Platform conformance | **109/109** |
| AI profile gate | **22/22** |
| Regression gate T1–T28 | PASS |
| All-subject static | **70/70** |
| All-subject browser klasifikace | **111/111** |
| All-subject PDF render | PASS, 51 923 B |
| Multimedia unit/static | **19/19** |
| Multimedia browser E2E | PASS |
| Deterministické renderery | **5/5 typů PASS** |
| Office-rich DOCX/PPTX/XLSX | PASS |
| Performance | **31/31** |
| XSS sink regression audit | PASS |

### Výkonové rozpočty

| Metrika | Naměřeno | Limit |
|---|---:|---:|
| dist | 1 004 148 B | 1 050 000 B |
| entry HTML | 479 541 B | 490 000 B |
| entry critical | 654 511 B | 670 000 B |
| largest inline script | 369 178 B | 380 000 B |
| precache | 968 645 B | 970 000 B |
| largest file | 479 541 B | 490 000 B |

Limity nebyly pro 1.3.27 zvyšovány.

## 7. P5 a omezení sandboxu

Kompletní `qa:p5` doběhne přes nové i staré funkční brány a zastaví se až při `qa:runtime`: Chromium v tomto prostředí odmítne otevřít lokální runtime URL s `net::ERR_BLOCKED_BY_ADMINISTRATOR`.

Po samostatném spuštění:

- XSS audit: PASS;
- P5 release report: 36/37 — chybí pouze runtime report;
- acceptance: 13/15 — chybí runtime report a z něj odvozený zelený release report.

Toto omezení není maskováno jako PASS.

## 8. Co ještě brání absolutnímu „od všeho“

1. **Živý AI provider smoke test pro multimédia:** bez produkčního API klíče nebylo možné prokázat, že každý budoucí nasazený model přijme každý podporovaný MIME typ se stejnou kvalitou.
2. **Komplexní notace:** vícehlas, akordy, ligatury, artikulace, chromatická sazba, celé partitury.
3. **Komplexní chemické kreslení:** stereochemie, aromaticita, mechanismy reakcí, automatické odvození správné struktury.
4. **Elektrická/technická schémata:** dodaný obraz se zachová, ale samostatný normalizovaný obvodový renderer ještě není.
5. **Detailní kartografie:** kraje/okresy, vrstevnice, tematické polygonové vrstvy a autoritativní aktuální hranice nejsou obecný mapový engine.
6. **Plný TeX/CAS:** běžná STEM notace ano, libovolný TeX a formální algebra ne.
7. **Komplexní Office objekty:** významová data/text ano tam, kde jsou dostupná; pixelová reprodukce obecně ne.
8. **Video analýza pohybu:** video lze použít jako observační zdroj, ale aplikace neměří trajektorie, úhly ani biomechanické parametry.

## 9. Doporučení pro další verzi

Pokud chceme pokračovat k ještě silnějšímu tvrzení „od všeho“, největší přínos 1.3.28 by nebyl další seznam předmětů, ale **specializované deterministické enginy**:

- elektrická schémata,
- pokročilá chemie,
- plná hudební notace,
- detailnější kartografie,
- volitelný TeX/MathJax nebo jiný auditovaný sazební engine,
- provider-backed golden set reálných audio/video materiálů.

1.3.27 už ale řeší hlavní „tiché ztráty“: zdrojové médium, nativní graf a nový jednoduchý odborný vizuál mají explicitní, testovanou cestu od vstupu až po výstup.
