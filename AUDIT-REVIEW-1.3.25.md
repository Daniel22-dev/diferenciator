# AUDIT REVIEW 1.3.25 — nezávislé ověření Claude auditu 1.3.24

## Verdikt

Claudeův audit byl ověřen proti skutečnému stromu 1.3.24 RC. Nálezy nebyly aplikovány automaticky.

- **M1 potvrzen.** Direct runtime měl 60 s, school runtime 120 s; Core timeout skutečně řídí `requestTimeoutMs`. Opraveno na 120 s v direct profilu a doplněna blokující QA shody.
- **M2 potvrzen.** Původní `quality = gemini-3.5-flash` byl slabší/starší než `balanced = gemini-3.6-flash`. Aby se nezhoršil výchozí Doporučený profil, `balanced` zůstává na 3.6 a `quality` přechází na produkční `gemini-3.7-flash`. QA nově vynucuje pořadí `3.5 Flash-Lite < 3.6 Flash < 3.7 Flash`. Při externím ověření se navíc ukázalo, že 3.7 nepodporuje `minimal` thinking; direct integrace proto pro 3.7 mapuje `minimal` na `low`.
- **M3 potvrzen a opraven.** Detail čtyřletého gymnázia už neopakuje label.
- **M4 potvrzen a opraven.** Čtyři uvedené helpery nebyly volány a živá obrazová cesta používá jiné funkce.
- **M5 potvrzen jako technický dluh, ne release blocker.** Baseline se v tomto hotfixu nezvyšuje ani nepřepisuje; lazy-load zůstává backlog.
- **M6 jako chyba zamítnut.** GFM tabulka vyžaduje header + delimiter row; tolerantní zápis bez delimiteru by byl vlastní rozšíření aplikace.
- **M7 přijato jako procesní doporučení.** Bez zásahu do kódu.

## Release rozhodnutí

Po zelených dostupných QA branách je 1.3.25 vhodná jako GitHub release candidate. Jediný nezastupitelný manuální bod je reálný multimodální request přes skutečný provider, protože lokální testy používají mock transport.

## Ověření release candidate

- `npm test`: zelené; interní sada aplikace **142/142**.
- `qa:profiles`: **22/22**, včetně pořadí profilů, timeoutu a thinking-level capability kontraktu.
- Browser profilová QA v direct režimu ověřila, že Důkladný profil převádí levný požadavek `minimal` na `low`.
- School-server browser matice: profily, obrazové podklady, skeny, STEM i all-subject gate prošly.
- `qa:p3-quality`: **31/31**; `largestInlineScriptBytes = 379123 <= 380000`, baseline nebyla zvýšena.
- `qa:xss`: bez nové regrese sinků.
- Reportér: **56 PASS / 0 FAIL** ve statické části; browserová část je v tomto spravovaném prostředí blokována systémovým Chromium `URLBlocklist`.
- `qa:p5` nelze lokálně dokončit ve fázi `qa:runtime`, protože stejná spravovaná Chromium politika blokuje testovací URL. Tuto bránu má po nahrání provést GitHub CI.
