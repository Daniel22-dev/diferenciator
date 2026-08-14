# Diferenciátor 1.3.14 — nezávislý review Claude auditu

Datum: 2026-08-13  
Role: Claude = primární hloubkový audit; ChatGPT = nezávislý reviewer/opravář; Daniel = živé runtime testy.

## Stav

**1.3.14 je kandidát pro runtime testování, ne finální release GO.** Kritický K1 je opraven a dostupné lokální brány jsou zelené. Před vydáním stále zbývá skutečné generování proti živému API v běžném prohlížeči.

## Rozhodnutí k nálezům

| Nález | Verdikt review | Provedeno |
|---|---|---|
| K1 | potvrzen | Zvolena lokální cesta B. Runtime konfigurace Core se skládá v aplikaci; chybějící platformní metody už nejsou tvrdou závislostí. Přidána srozumitelná kontrola Core/Platform. |
| Z1 | potvrzen | Odstraněna `src/ghrab-platform.consumer.json`; zůstává jediná kořenová kanonická kopie. |
| Z2 | potvrzen | Platforma sjednocena na 1.1.0 / `>=1.1.0 <2.0.0`, README opraveno na P5. |
| Z3 | částečně potvrzen | Dva zdroje schématu byly skutečný problém a byly sjednoceny. Část auditu o nutných velkých typech `OBJECT/STRING` a zákazu `additionalProperties` byla odmítnuta jako neaktuální; současná Gemini dokumentace používá JSON Schema s malými typy a `additionalProperties` podporuje. Provider schema zůstává záměrně vypnuté, Core validuje vlastní kontrakt. |
| Z4 | potvrzen, diagnóza zpřesněna | Nestačilo jen překonfigurovat `profileModels`: školní gateway posílá `modelProfile`. Flash-Lite se nyní mapuje na `economy`, Flash na `balanced`; změna modelu mění i konfigurační podpis. |
| Z5 | potvrzen | Tvrdý blok e-mailu nahrazen dialogem Zrušit / Anonymizovat / Pokračovat; výslovně se uvádí omezení pro obrázky a skeny. |
| Z6 | potvrzen | Fallback je obousměrný: Flash → Flash-Lite a Flash-Lite → Flash. UI už neslibuje neurčitý seznam „všech“ fallbacků. |
| D1 | potvrzen | Mrtvý permanentní dialog odstraněn. |
| D2 | potvrzen | Duplicitní tlačítko a `saveKeyPermanent()` odstraněny. |
| D3 | potvrzen | `__TEST_MOCK_GEMINI` i stará přímá produkční cesta odstraněny. Mock testuje až vrstvu pod Core. |
| D4 | potvrzen | `npm test` hledá systémový prohlížeč i Playwright Chromium a při absenci uvádí `npx playwright install chromium`. |
| D5 | částečně potvrzen | Do školního profilu přidán HSTS a zastaralá poznámka opravena. CSP nonce/hash přestavba záměrně odložena; je to větší architektonická změna mimo opravný release. |
| D6 | **nepřevzat** | `*Ready:true` a `schoolServerConnected:false` nejsou samy o sobě rozpor: první může popisovat připravenou schopnost, druhé živé připojení. Bez důkazu chybné runtime interpretace nebyla konfigurace měněna. |
| D7 | potvrzen | CHANGELOG sjednocen, 1.3.5–1.3.11 doplněny a pořadí 1.3.x je souvislé. |

## Nové regresní krytí

- T1: přímá volání `GHRAB_PLATFORM.<metoda>()` proti skutečnému vendor API.
- T2: browser test načítá skutečnou přiloženou GHRAB Platform a produkční `callGemini` + GHRAB AI Core; mockuje až provider pod Core.
- T3: právě jedna `ghrab-platform.consumer.json`.
- T4: shoda app manifestu, consumeru a vendor platformy.
- T5: všechna ID z `body.html` musí být napojená nebo výslovně statická.
- T6: `setModel()` ověřen pro direct cestu i school-gateway (`economy` / `balanced`).
- T7: Playwright browser fallback + návodná chyba při chybějícím Chromium.
- T8: souvislost řady `RELEASE.changes` 1.3.x.
- Interní runner už neočekávanou výjimku pouze nezapíše do logu; nyní ji označí jako FAIL.

## Ověření kandidáta

Prošlo:

- `npm run build`
- GHRAB Platform conformance: **109/109**
- `npm run qa:lock`
- `npm run qa:quality`: **31/31**
- vlastní regresní brána T1/T3/T4/T5/T8
- `npm run qa:browser`: PASS
- `npm run qa:xss`: PASS, bez nového sinku
- `npm test`: **94/94 interních testů**, release gate PASS

Performance budgety nebyly zvýšeny. Po opravách je hlavní HTML 327 914 B / 330 000 B a precache 797 747 B / 800 000 B; kandidát tedy prochází, ale rezerva je malá a další verze by měla hlídat růst bundle.

## Co v tomto runneru nešlo plně uzavřít

- `qa:runtime` se nedostal k aplikaci přes lokální HTTP, protože Chromium v pracovním prostředí vrací `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Test nyní tuto příčinu vypíše přímo místo neurčitého timeoutu.
- Následný `qa:p5-release` chybí pouze runtime report; acceptance chybí runtime report a z něj odvozený release report.
- `npm ci` nebylo možné po změnách znovu dokončit v tomto runneru. Online běh skončil na úrovni pracovního nástroje a offline běh korektně hlásí chybějící cache balíčku `xmlchars`. Závislosti ani jejich verze nebyly v 1.3.14 měněny.
- `qa:axe` je proto v tomto runneru `not-ready-environment` (chybí obnovený `axe-core`).
- Nebylo provedeno živé volání Gemini s reálným API klíčem.

## Doporučený runtime test Daniela

1. Otevřít 1.3.14 v běžném prohlížeči a ověřit, že konzole nehlásí chybějící metody Platformy.
2. S Flashem provést: načtení souboru → vytvoření verze → řešení → kontrola kvality.
3. Přepnout na Flash-Lite a vytvořit další verzi; ověřit, že volba má skutečný efekt.
4. Vložit do textu testovací e-mail a vyzkoušet všechny tři volby preflight dialogu.
5. Vyzkoušet obrázek/PDF a ověřit, že upozornění správně říká, že textová kontrola e-mailu obrazový obsah předem nekontroluje.
6. Po čistém `npm ci` spustit `npm run qa:p5:ci` v prostředí, kde Chromium smí otevřít lokální HTTP server.

Teprve po těchto bodech je vhodné změnit stav z RC na GO / GO WITH KNOWN ISSUES.
