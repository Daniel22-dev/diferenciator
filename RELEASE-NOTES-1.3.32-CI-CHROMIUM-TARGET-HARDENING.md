# Diferenciátor 1.3.32 — CI Chromium target hardening

## Oprava

GitHub Actions mohl po spuštění headless Chromium úspěšně načíst `/json/version`, ale `/json` ještě krátce neobsahoval žádný `page` target. Několik browser QA runnerů potom okamžitě dereferencovalo výsledek `find(...).webSocketDebuggerUrl` a spadlo na `TypeError`.

Nově používají hlavní Chromium QA runnery sdílený `waitChromiumPageTarget()`, který čeká na skutečný `page` target s platnou WebSocket debugger URL a při timeoutu vrací konkrétní diagnostiku posledního stavu.

Oprava pokrývá mimo jiné `qa:renderers`, `qa:scan`, `qa:stem`, `qa:all-subjects:browser`, `qa:office-rich`, `qa:visuals`, `qa:profiles:browser`, `qa:browser`, `qa:runtime` a starší P3 axe runner.

Regresní brána T37 nyní prohledává všechny `scripts/*.mjs` a zastaví release, pokud se vrátí přímý race-prone vzor `find(page).webSocketDebuggerUrl`.
