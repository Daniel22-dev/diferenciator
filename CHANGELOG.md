# Changelog

## 1.3.25 — GARP follow-up po auditu 1.3.24 (2026-08-14)

- M1: direct multimodální timeout zvýšen z 60 s na 120 s a QA hlídá shodu se school profilem;
- M2: `quality` nyní používá `gemini-3.7-flash`, zatímco `balanced` zůstává na `gemini-3.6-flash`; `qa:profiles` nově vynucuje vzestupné pořadí schopností a direct 3.7 převádí nepodporované `minimal` thinking na `low`;
- M3: odstraněn zdvojený text u 1.–4. ročníku čtyřletého gymnázia;
- M4: odstraněny čtyři potvrzené nepoužívané helpery obrazové vrstvy;
- M6 uzavřeno bez změny: pipe zápis bez oddělovacího řádku není GFM tabulka, tolerantní parser zůstává případným budoucím UX rozšířením;
- doplněny regrese T25–T27; performance baseline z 1.3.24 zůstává zmrazená.
- CI hotfix: GitHub Actions workflowy, které spouštějí `qa:p5:ci`, nyní explicitně instalují `poppler-utils`; `qa:stem` při chybějícím nebo selhaném `pdftotext` končí s diagnostickou chybou a T28 hlídá návrat této závislosti.

## 1.3.24 — GARP stabilizace po auditu 1.3.19

- opraven school-server service-worker precache a přidána kontrola existence precache assetů v obou buildech;
- izolováno kosmetické scrollování od transakčního generování;
- přesná aktivace test mode pouze `?test` / `#test`;
- robustní cleanup tiskového režimu a titulku;
- kanonický storage namespace `ghrab.differentiator.*` s legacy fallbackem a sladěným datovým manifestem;
- odstraněn potvrzený mrtvý kód, nepoužívaná CSS/ID a duplicitní 180px ikona;
- sjednoceny ID selektory a zdokumentováno číslování T2/T6/T7;
- výkonové rozpočty zmrazeny přes `qa:budget-freeze`.

## 1.3.23 — Fáze 4: all-subject release gate (2026-08-14)

- Přidána trvalá testovací matice 13 předmětových domén: jazyky, matematika, fyzika, chemie, biologie, zeměpis, dějepis, ZSV/společenské vědy, informatika, hudební výchova, výtvarná výchova, tělesná výchova a humanitní předměty.
- Generování, tvorba klíče a kontrola kvality dostávají oborové pojistky mimo STEM: mapy/souřadnice/měřítko a proměnlivá data, chronologie a prameny, časově citlivé právo/politika/ekonomika, syntax a verze kódu, jazykové alternativní odpovědi, hudební notace, reprodukce a bezpečnost TV.
- Lokální validace upozorní na `[NEČITELNÉ]` / `[ČÁSTEČNĚ NEČITELNÉ]` a konzervativně porovná očíslované hlavní úlohy s očíslovaným klíčem.
- Běžné pipe tabulky a tabulátorem oddělené tabulky se bezpečně vykreslují jako skutečné tabulky v kartě výsledku i PDF; STEM sazba funguje i v buňkách.
- První all-subject test odhalil kolizi zkratky `IT` se slovem `Literatura`; klasifikátor byl opraven tak, aby krátké zkratky platily jen jako samostatné tokeny.
- Přidány blokující brány `qa:all-subjects`, `qa:all-subjects:browser` a `qa:all-subjects:school`; reálný Chromium/PDF test ověřuje klasifikaci, předmětové prompty, klíč, nečitelné markery, tabulky, kód, hudební Unicode a tisk v Direct i School režimu.
- Kvůli nové předmětové vrstvě a tabulkovému rendereru byly statické performance budgety pouze omezeně posunuty (entry/largest 490 kB, inline 380 kB, critical 670 kB, precache 970 kB, dist 1 050 kB); brána zůstává blokující.

## 1.3.22 — Fáze 3: fotografie, skeny a naskenovaná PDF (2026-08-14)

- Panel obrazových podkladů je dostupný už před AI přepisem; fotografie lze lokálně seřadit, otočit, oříznout a vytvořit kontrastnější čtecí kopii pro AI bez změny originálu používaného ve výsledném listu.
- Přidán lokální quality preflight rozlišení, kontrastu a orientační ostrosti. AI navíc vrací `SCAN_REPORT` a má výslovný zákaz domýšlet nečitelná čísla, značky nebo slova; používá označení `[NEČITELNÉ]` / `[ČÁSTEČNĚ NEČITELNÉ]`.
- PDF se analyzuje multimodálně stránku po stránce i bez textové vrstvy. V jednom importu lze použít jedno PDF + doplňkové obrázky; přesný screenshot/výřez mapy, grafu nebo schématu se tak může pixelově zachovat ve výsledku.
- Učitelova explicitní volba režimu vizuálu má přednost před AI manifestem. Nepodporované obrazové formáty se nemají ztratit potichu.
- Přidána blokující brána T18 a reálný Chromium test `qa:scan` / `qa:scan:school`, který ověřuje originál vs. AI čtecí kopii, otočení, pořadí, scan report, PDF + image payload i zachovaný obraz ve výsledku.
- Aplikace záměrně nepředstírá obecný pixelový crop libovolné stránky PDF: pro věrný obraz z PDF je učitel veden k přiložení snímku/výřezu. Automatické narovnání perspektivy šikmé fotografie zatím není součástí této fáze.

## 1.3.21 — Fáze 2: STEM zápis a věcná správnost (2026-08-14)

- Přidán samostatný STEM bezpečnostní modul pro matematiku, fyziku, chemii a biologii; generování, klíč i kontrola kvality dostávají předmětová pravidla pro přepočet a odbornou kontrolu.
- Běžný matematický zápis se vykresluje typograficky místo surového LaTeXu: zlomky, odmocniny včetně n-tých odmocnin, mocniny, dolní indexy, vybrané řecké znaky a operátory. Stejný renderer používá karta výsledku, editor i tisk/PDF.
- Chemie zobrazuje indexy ve vzorcích a horní indexy nábojů; deterministická kontrola umí ověřit bilanci atomů u běžných rovnic a u explicitně zapsaných iontových rovnic také celkový náboj.
- Lokální výpočtová pojistka kontroluje zjevné numerické rovnosti, zlomky, mocniny, odmocniny, procenta, jednoduché lineární řešení zpětným dosazením a běžné převody délky, plochy, objemu, hmotnosti, času, rychlosti, tlaku, síly, energie, výkonu a frekvence.
- DOCX Word Equation (OMML) se už neslévá do obyčejného textu: zachovávají se zlomky, horní/dolní indexy, odmocniny, n-ární výrazy, jednoduché matice, pole rovnic, limity, funkce a základní akcenty v bezpečném přenositelném zápisu.
- Importní AI dostává výslovné pravidlo neměnit během přepisu čísla, znaménka, desetinnou interpunkci, jednotky, indexy, exponenty ani chemické koeficienty/náboje.
- Přidána regresní brána T17 a blokující skutečný Chromium/PDF test `qa:stem`; ten ověřuje sazbu bez viditelného `\frac`/`\sqrt`, nepřetékající layout, matematické výpočty, širokou sadu fyzikálních převodů, chemické rovnice/náboje, OMML a biologický kontrolní profil.
- Deterministická vrstva je záměrně pojistka, nikoli CAS ani odborná databáze: složitou symbolickou matematiku, kompletní fyzikální odvození a biologická fakta stále finálně kontroluje AI audit a učitel.
- Výkonová brána zůstává blokující; po přidání samostatné STEM vrstvy byly rozpočty omezeně posunuty na entry HTML 480 kB, critical 660 kB, inline script 365 kB, precache 955 kB a largest file 480 kB. Celkový dist budget zůstává 1 025 kB.

## 1.3.20 — Fáze 1: obrazově klíčové podklady (2026-08-14)

- Mapy, grafy, schémata, geometrické nákresy, biologické obrázky a další obrazové prvky se nově vedou jako samostatné assety místo toho, aby po AI přepisu zmizely.
- Po načtení materiálu učitel u každého obrázku zvolí **Zachovat původní obraz ve výstupu**, **Použít jen jako předlohu** nebo **Nevkládat / ignorovat**. Kritický obraz se předvolí k zachování; fotografie celé stránky se předvolí jako reference.
- Z fotografie nebo skenu celé stránky lze bez dalšího AI požadavku vyříznout mapu, graf nebo schéma. Původní stránka zůstane jen jako reference a výřez se stane zachovaným podkladem.
- Zachované obrazové assety se přenášejí do generování, výsledku, kontroly kvality, případné revize, tvorby řešení, projektu i tiskového/PDF náhledu. AI dostává explicitní zákaz podklad překreslovat nebo měnit jeho obsah.
- Projektový export/import zachovává obrazové assety. U velmi velkých obrázků UI výslovně upozorní, pokud byla kvůli bezpečnému provozu použita technicky zmenšená kopie.
- DOCX umí vedle PNG/JPEG/WebP/GIF lokálně rasterizovat i vložené SVG; nepodporovaný obrazový formát se už neztratí potichu, ale zobrazí upozornění.
- PDF se v této fázi multimodálně analyzuje a aplikace upozorní na rozpoznaný obrazově klíčový prvek, který neumí bezpečně vyjmout a vložit zpět. Přesná extrakce obrazů ze skenů/PDF je záměrně vyhrazena Fázi 3.
- Přidána blokující statická brána T16 a skutečný Chromium test `qa:visuals`, který ověřuje beze změny přenesená obrazová data do výsledku, tiskového náhledu a projektu, lokální výřez i image část skutečného Core requestu. Stejný test je dostupný i pro school-server build.
- Výkonová brána zůstává blokující; kvůli nové vizuální vrstvě byly její limity omezeně posunuty na dist 1 025 kB, entry HTML 425 kB, critical 605 kB, inline script 318 kB, precache 905 kB a largest file 425 kB.

## 1.3.19 — ročníky, čtyři režimy bodování a čistší PDF (2026-08-14)

- Pedagogické zpřesnění používá explicitní výběr ročníku pro osmileté gymnázium (prima–oktáva) i čtyřleté gymnázium (1.–4. ročník / prvák–čtvrťák) včetně orientačního věku; čas na vypracování zůstává ručně zadávaný.
- Bodování má čtyři jednoznačné režimy: AI navrhne body, převzít body z originálu, učitel doplní body lokálně před PDF, nebo bez bodování. Pokud je v originálu bodování spolehlivě rozpoznáno, nabídka jej automaticky předvolí.
- Ruční bodování nevolá AI: před PDF se otevře editor bodů hlavních úloh a aplikace lokálně dopočítá součet.
- Odstraněn duplicitní horní blok „Rychlý postup“; jediný doporučený postup zůstává přímo u konkrétní hotové verze.
- Tisková šablona používá nulový page margin a vlastní vnitřní okraje, aby v běžném Chrome tisku nezůstával prostor pro automatické datum/URL; výchozí jméno PDF je odvozeno z hlavního nadpisu listu/testu a klíč dostává „– řešení“.
- Přidány regresní testy pro obě gymnaziální soustavy, automatickou detekci původních bodů, všechny čtyři scoring režimy a lokální ruční bodování.
- Výkonová brána zůstává blokující; po rozšíření 1.3.19 byly rozpočty jen omezeně posunuty na dist 890 kB, entry HTML 390 kB, critical 570 kB, inline script 290 kB, precache 870 kB a largest file 390 kB.

## 1.3.18 — čistší výstup a tisk (2026-08-14)

- Odstraněn duplicitní číslovaný postup z horního výsledkového souhrnu; doporučený postup zůstává u konkrétní verze.
- Výchozí název ukládaného PDF se odvozuje z hlavního nadpisu pracovního listu/testu; řešení dostává suffix „– řešení“.
- Tiskový layout byl připraven na čistší školní PDF bez browserového data a URL.

## 1.3.17 — výrazný výstup, bodování a omezená kontrolní smyčka (2026-08-14)

- Hlavní název materiálu je samostatný, výrazný a používá se i jako titul PDF; technické dodatky typu „Parallel Version“ se odstraňují.
- Samostatné PDF řešení už není jeden nedělitelný tiskový blok, takže dlouhý klíč nezačíná po prázdné první straně.
- V Pedagogickém zpřesnění je volba pro materiály bez bodování: buď body doplní AI v rámci stejného generování, nebo zůstanou prázdné pro ruční doplnění. Původní bodování se vždy zachovává co nejvěrněji.
- Kontrola kvality provádí v jednom requestu dva interní průchody a má vrátit všechny konkrétní nálezy najednou. Po zapracování oprav se audit zachová a PDF už nevyžaduje další kontrolu; k dispozici je nejvýše jedna volitelná Finální kontrola.
- Výkonová brána zůstává blokující; po rozšíření 1.3.17 byly limity jen mírně posunuty na entry HTML 370 kB, inline script 270 kB a precache 845 kB.

## 1.3.16 — UX, DOCX import a řízené zapracování kontroly (2026-08-14)

- Cílová skupina rozpoznává česká označení osmiletého gymnázia `prima`–`oktáva` a při známém označení předává modelu ročník i orientační věk.
- „Vlastní pokyn učitele“ je explicitně předáván jako závazný požadavek s jasnou prioritou vůči automatickým preferencím.
- Výběr cílové úrovně má výrazný stav `✓ Vybráno`; výchozí je Normální, ale režim „Stejný obsah, jiná obtížnost“ Normální automaticky zneplatní a nabízí jen Jednodušší / Obtížnější.
- Nejasné automatické volby byly přejmenovány a dostaly živé vysvětlení; „Typ podpory / výzvy“ má příklady i popis skutečného vlivu na prompt.
- Kontrola kvality nabízí zaškrtávací volby pouze u `Opravit` / `Doporučení` a samostatné tlačítko zapracuje jen vybrané body; nevybrané návrhy se ignorují.
- Potvrzovací checkbox před PDF používá vlastní světlý/tmavý vzhled místo černého nativního čtverce.
- Doporučený postup je číslován `1.`, `2.`, `3.`.
- DOCX import nově čte nejen textovou vrstvu, ale i vložené obrázky v pořadí dokumentu a posílá je společně do `material-extraction`; tím nezmizí pracovní listy vložené do Wordu jako screenshoty.
- V „Dalších úpravách“ zůstaly pouze `Upravit` a `Kopírovat`; `Export .md` a `Regenerovat` byly odstraněny.
- Přidána operace `worksheet-quality-revision` a nové regresní testy pro všechna uvedená pravidla.
- Výkonnostní rozpočty byly po rozšíření funkcí vědomě posunuty na stále omezené hodnoty (entry HTML 360 kB, precache 830 kB); nejde o vypnutí výkonové brány.

## 1.3.15 — centrální profily AI (2026-08-14)

- Diferenciátor přebírá referenční modelový kontrakt KS 5.10.4: **Úsporný / Doporučený / Důkladný** = `economy / balanced / quality`.
- Aplikační UI a logika už nepracují s konkrétními názvy Gemini modelů; providerová ID jsou pouze ve veřejné serverless runtime konfiguraci.
- Odstraněn `modelOverride`; zvolený profil se předává přímo do GHRAB AI Core a konkrétní model vybírá aktivní transport.
- Všech šest registrovaných AI operací dovoluje všechny tři profily, takže uživatelská volba není potichu přepisována.
- Přidána migrace starých uložených modelů na profily a tři provider-neutrální profilová tlačítka.
- School-server runtime neobsahuje Gemini/OpenAI modely, používá stejné tři profily a school build odstraňuje přímý Gemini endpoint z CSP.
- Přidána `qa:profiles` brána, T6 integrační test a Chromium click-through test všech tří profilů pro direct Core i school gateway.

## 1.3.14 — oprava AI integrační vrstvy (2026-08-13)

- Opraven kritický blokátor: produkční AI cesta už nevolá neexistující metody `GHRAB_PLATFORM`.
- Runtime konfigurace GHRAB AI Core se sestavuje lokálně z deployment konfigurace; školní profil používá `school-gateway`, GitHub profil `direct-gemini`.
- Flash / Flash-Lite se propisuje do `modelProfile` i pro školní gateway a fallback funguje oběma směry.
- Sjednocen výstupní JSON Schema kontrakt; odstraněn mrtvý druhý schema parametr v původní Gemini cestě.
- Preflight e-mailů je varovný místo tvrdého blokování: nabízí zrušení, automatickou anonymizaci nebo vědomé pokračování.
- Odstraněn mrtvý dialog trvalého klíče, duplicitní tlačítko pro uložení a testovací bypass integrační vrstvy.
- Sjednocena platformní verze na 1.1.0, odstraněna duplicitní consumer konfigurace a opraven popis etapy na P5.
- `npm test` umí použít Chromium instalované Playwrightem a při chybě dává návodnou instalační hlášku.
- Bezpečnostní profil dostal HSTS pro školní server a pravdivou poznámku k dočasnému `unsafe-inline`.
- Doplněny regresní kontroly platformního API, jediné consumer konfigurace, shody verzí, napojení ID a souvislosti řady 1.3.x v changelogu.
- CI follow-up: regresní test reportéru už nevyžaduje chybějící interní auditní dokument a u chybějícího povinného souboru vypíše explicitní FAIL místo pádu na `ENOENT`.

## 1.3.13 — sjednocení reportéru (2026-08-13)

- Reportér používá dvoukrokové vytvoření a skutečné stažení diagnostického ZIPu; Gmail je dostupný až po kliknutí na stažení.
- Rozhraní i e-mail vyžadují ruční přiložení ZIPu a pomocné video je bezpečně skryté uvnitř reportéru i při scrollování.
- Regresní sada fyzicky ověřuje stažený ZIP, jeho snímky a diagnostiku, jednu instanci reportéru, motivy, mobilní zobrazení a klávesnici.
- Mobilní rozložení má explicitní šířkový containment, který odstraňuje dvoupixelové vodorovné přetečení release gate.

## 1.3.12 — P5 R2 (2026-08-05)

- Runtime audit se skripty a odemčeným UI.
- Reprodukovatelné deklarované QA závislosti a blokující exact axe v CI.

## 1.3.11 — P5 (2026-08-05)

- Předprodukční akceptace bez povinného školního serveru.
- Nulové otevřené automatické a11y nálezy jsou podmínkou P5 brány.
- Přidán release-acceptance kontrakt; serverový profil je připravený, ale záměrně nepřipojený.

## 1.3.10 — P4 FINAL (2026-08-04)

- Finální certifikace, čisté buildy, přístupnost, výkon, bezpečnost a release evidence.
- Přidána povinná `qa:p4:ci` brána.

## 1.3.9 — P3 (2026-08-04)

- GHRAB Platform 1.1.0, přístupnost, performance budgety a modularizace P3.

## 1.3.8 — P2 (2026-08-04)

- Sjednocení platformy GHRAB, školní identity, theme/storage/bridge/artifact kontraktů a platformní konformity.

## 1.3.7 — P1 (2026-08-04)

- Produkční bezpečnost, serverový profil, datové manifesty a GHRAB AI Core 1.0.0.

## 1.3.6 — P0 (2026-08-04)

- Bezpečný best-effort start reportéru, konfigurovatelný přístup k AI Studiu a server-ready deployment profil.

## 1.3.5 (2026-08-03)

- Reportér sjednocen se společným základem AI Studio GHRAB; aktualizovány manifest, service worker a regresní testy.

## 1.3.4

- Opravy regenerace, PDF náhledu, editace, kontroly kvality, modelů a návratu z manuálu.
