# Changelog

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
