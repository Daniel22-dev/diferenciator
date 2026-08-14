# Diferenciátor 1.3.16 — GARP review

**Datum:** 2026-08-14  
**Stav:** RC připravený k uživatelskému testování  
**Rozsah:** 10 bodů uživatelského testování (pedagogické zpřesnění, vlastní pokyn, volba úrovně, automatika/struktura, typ podpory, selektivní kontrola, PDF checkbox, číslování postupu, DOCX import, zjednodušení nástrojů).

## Verdikt

Všech 10 bodů je zapracováno a potvrzeno regresními testy. Změny neporušily provider-neutrální profilovou architekturu 1.3.15 ani GHRAB Platform/Core kontrakty.

## Ověřené změny

1. **Pedagogické zpřesnění** — rozpoznává `prima` až `oktáva`, včetně více tříd v jednom poli (např. `tercie, kvarta`). Do AI promptu se doplňuje ročník osmiletého gymnázia a orientační věk; při více třídách se požaduje společná přiměřená úroveň.
2. **Vlastní pokyn učitele** — do promptu vstupuje jako `ZÁVAZNÝ VLASTNÍ POKYN UČITELE` a má přednost před automatickými preferencemi, pokud nekoliduje s cílovou úrovní/režimem, bezpečností nebo věcnou správností.
3. **Volba úrovně** — Normální je standardní výchozí stav; vybraná karta je jednoznačně označena. Režim „Stejný obsah, jiná obtížnost“ Normální deaktivuje a vyžaduje Jednodušší nebo Obtížnější.
4. **Automatika / struktura** — nejasné popisky byly nahrazeny volbami s dynamickým vysvětlením konkrétního chování.
5. **Typ podpory / výzvy** — je nepovinné vodítko pro mechanismus diferenciace (např. slovní banka, nápověda po krocích, argumentace navíc), nikoli pokyn ke změně tématu nebo cíle.
6. **Kontrola kvality** — položky `Opravit` a `Doporučení` jsou selektivní checkboxy; revizní AI operace zapracuje jen označené body. Položky `OK` nejsou volitelné.
7. **PDF potvrzení** — nativní černý checkbox byl nahrazen vlastním light/dark vzhledem.
8. **Doporučený postup** — používá číslování `1.`, `2.`, `3.`.
9. **DOCX import** — čte textovou XML vrstvu i vložené obrázky v pořadí dokumentu; podporuje i image-only DOCX a deduplikuje opakované reference.
10. **Další úpravy** — `Export .md` a `Regenerovat` byly odstraněny; zůstávají pouze `Upravit` a `Kopírovat`.

## Evidence z reálného DOCX

U testovacího `Vocab - body.docx` obsahuje textová XML vrstva prakticky jen dva nadpisy, zatímco vlastní obsah cvičení je vložen ve třech obrázcích. Reálný Chromium import finálního kódu načetl:

- text: `You and your body` + `Internal organs – Match the definition to the correct word`,
- **3/3 vložených obrázků** v pořadí dokumentu,
- všechny tři obrázky byly převedeny do bezpečné multimodální vstupní cesty a připraveny pro společný `material-extraction` request.

Tím je potvrzena příčina starého chování i funkčnost nové lokální importní cesty. Samotný test záměrně nevolal placené externí AI API.

## Release gate — finální výsledky

| Brána | Výsledek |
|---|---|
| GHRAB Platform conformance | **109/109 PASS** |
| AI model profiles | **17/17 PASS** |
| Interní testy | **104/104 PASS** |
| Regresní brána 1.3.16 | **PASS** |
| `qa:quality` | **31/31 PASS**, 0 warnings |
| `qa:lock` | **PASS** — 3 direct dependencies / 67 locked packages |
| `qa:browser` | **PASS** |
| `qa:xss` | **PASS** — `innerHTML` 61 při baseline 62 |
| Error reporter | **56 PASS / 0 FAIL** |
| School-server build | **PASS** |
| School profile trusted-click browser test | **PASS** — economy / balanced / quality |
| Reálný import `Vocab - body.docx` | **PASS** — text + 3/3 obrázků |

### Výkonnostní budget

Zůstává blokující; byl explicitně a mírně navýšen kvůli nové multimodální DOCX cestě a selektivní quality revizi. Aktuální metriky jsou pod limity:

- dist: 841 890 ≤ 850 000 B,
- entry HTML: 350 856 ≤ 360 000 B,
- critical entry: 525 631 ≤ 540 000 B,
- largest inline script: 253 524 ≤ 260 000 B,
- precache: 821 620 ≤ 830 000 B,
- largest file: 350 856 ≤ 360 000 B,
- duplicate large content: 23 410 ≤ 30 000 B.

## Limity testovacího prostředí OpenAI

- `qa:runtime` zde nemůže doběhnout: spravovaná Chromium politika `URLBlocklist` blokuje lokální testovací URL a navigace končí `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Nejde o nalezenou chybu aplikace.
- `qa:axe` vrací `not-ready-environment`, protože runner nemá přesnou instalaci `axe-core 4.12.1`; neoznačuje se proto jako PASS.
- Čisté `npm ci` v tomto runneru není deklarováno jako ověřené; dřívější pokus narazil na omezení klienta/cache prostředí.

## GARP stav

**GO FOR USER TESTING.** Před finálním produkčním releasem zbývá živý smoke test skutečného AI volání a GitHub Actions v cílovém prostředí.
