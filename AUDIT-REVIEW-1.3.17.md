# GARP review — Diferenciátor 1.3.17 RC

Datum: 2026-08-14

## Rozsah follow-up opravy

Uživatelský test 1.3.16 odhalil čtyři navazující problémy:
1. málo výrazný / technický hlavní nadpis;
2. samostatné PDF řešení s hlavičkou na straně 1 a vlastním klíčem až na straně 2;
3. nejasnou politiku bodování;
4. vynucovanou opakovanou kontrolní smyčku po zapracování oprav.

## Výsledek review

### 1. Hlavní nadpis — opraveno
- `worksheet_title` se zobrazuje jako samostatný výrazný titul v aplikaci i PDF.
- Providerové/technické suffixy typu `Parallel Version` se normalizují pryč.
- Prompt vyžaduje pedagogicky přirozený název a interní kontrolu úplnosti před odevzdáním.

### 2. Prázdná první strana řešení — potvrzená příčina a oprava
Příčinou bylo `split:false` u samostatného klíče v kombinaci s tiskovým `break-inside: avoid`, takže celý dlouhý klíč tvořil jeden nedělitelný blok. Oprava používá standardní rozdělení přes `buildPrintBody` a pro `.pa-key-body .pa-ex` dovoluje zalomení.

Vedle DOM regresního testu byl proveden skutečný headless Chromium tisk přes `Page.printToPDF`: dvoustránkový klíč obsahoval nadpis i první odpovědi už na straně 1.

### 3. Bodování — opraveno
- Body ze zdrojového materiálu a celkový součet jsou závazné a musí zůstat stejné.
- U zdroje bez bodů má učitel explicitní volbu `teacher` / `ai`.
- AI návrh bodů nevytváří další request; je součástí generování.
- Audit kontroluje konzistenci bodů i soulad s originálem.

### 4. Kontrolní smyčka — odstraněna
- Hlavní audit: 1 request, dva interní průchody v jednom požadavku, střední reasoning.
- Selektivní zapracování: 1 revision request; už zapracované položky se označí a nelze je znovu vybrat.
- Revision request provádí vlastní interní závěrečnou konzistenci.
- Po revision se audit zachová a PDF už další audit nevynucuje.
- Jednou lze vědomě spustit volitelnou finální kontrolu; další kontrolní kolo není nabízeno.

## Testy

- `npm test`: PASS, 113/113 interních testů, profilové a integrační regresní brány zelené.
- GHRAB Platform conformance: 109/109 PASS.
- `qa:profiles`: 17/17 PASS.
- `qa:profiles:browser`: PASS, fyzické trusted kliky economy/balanced/quality.
- `qa:quality`: 31/31 PASS po explicitním mírném posunu stále blokujících výkonových limitů.
- `qa:browser`: PASS.
- `qa:xss`: PASS; 56 `innerHTML` sinků proti baseline 62, žádný nový regresní překrok.
- `qa:lock`: PASS, 3 direct dependency záznamy / 67 lock entries.
- `test:reporter`: 56 PASS / 0 FAIL; browserová část NOT_READY pouze kvůli spravované URLBlocklist.
- `build:school-server`: PASS.
- `qa:profiles:browser:school`: PASS; direct provider settings skryté.
- skutečný Chromium print-to-PDF test dlouhého řešení: PASS, obsah začíná na straně 1.

## Omezení prostředí

- `qa:runtime`: nelze v tomto OpenAI runneru dokončit, protože spravovaná Chromium politika blokuje testovací URL (`net::ERR_BLOCKED_BY_ADMINISTRATOR`).
- `qa:axe`: `not-ready-environment`, protože runner nemá přesnou lokální instalaci `axe-core 4.12.1`. Nejde o automatický PASS.

## Gate

**GO TO USER TESTING / RC.**

Před finálním release je vhodné na reálném nasazení ověřit zejména: generování s výrazným nadpisem, zdroj s existujícím bodováním, zdroj bez bodů v obou režimech, samostatné PDF řešení a tok Kontrola → Zapracovat → Řešení/PDF bez vynucené druhé kontroly.
