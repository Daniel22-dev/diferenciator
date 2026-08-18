# Diferenciátor 1.3.32 — CI multimedia target race hotfix

Datum: 2026-08-18

## Oprava

GitHub Actions P5 gate po úspěšných předchozích kontrolách selhal v `qa:multimedia:browser` na:

`TypeError: Cannot read properties of undefined (reading 'webSocketDebuggerUrl')`

Příčinou nebyla aplikace ani multimediální logika, ale závod při startu headless Chromia: endpoint `/json/version` už odpovídal, zatímco `/json` ještě nemusel obsahovat první `page` target.

`qa-multimedia-browser.mjs` nyní čeká na skutečný `page` target s `webSocketDebuggerUrl` a teprve potom naváže CDP spojení. Timeout je omezen na 20 sekund a při skutečném problému skončí explicitní chybou `Chromium page target timeout`.

## Regrese

T36 ověřuje, že multimedia browser QA používá čekání na target a nevrátil se k race-prone okamžitému `pages.find(...).webSocketDebuggerUrl`.

## Dopad

Žádná změna uživatelského workflow, modelových promptů ani počtu AI requestů. Jde pouze o stabilizaci CI/browser QA.
