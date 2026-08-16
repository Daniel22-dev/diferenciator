# Diferenciátor 1.3.31 — CI Zero Live Requests Hotfix

Datum: 2026-08-16

## Důvod

Aktuální vývoj používá soukromý Gemini API klíč s velmi omezenou denní kvótou a bez serverového/tierového zázemí. Automatický live provider smoke v GitHub Actions proto nevhodně spotřebovával reálné API requests při běžném vývoji.

## Změna

- `deploy.yml` ani `p5-release-gate.yml` už nevolají Gemini API.
- Workflow nečtou `DPL_LIVE_GEMINI_API_KEY` ani `GEMINI_API_KEY`.
- Odstraněny package skripty `qa:provider:live` a `qa:provider:live:required`.
- Odstraněn CI-only live provider skript a jeho evidence soubor.
- `ffmpeg` už není instalován pouze kvůli live provider smoke; PDF audit nadále instaluje `poppler-utils`.
- Regrese T29 nyní naopak vynucuje, že běžné CI žádný live Gemini provider smoke ani provider secret neobsahuje.

## Kvótová politika

Push, pull request, P5 release gate a GitHub Pages deploy mají v této fázi spotřebovat **0 Gemini API requests**. Skutečné API volání probíhá pouze při vědomém testování aplikace uživatelem. Live provider CI lze znovu zvážit až s budoucím serverem / vyšším tierem a samostatným kvótovým rozpočtem.

## Verze

Aplikační verze zůstává 1.3.31; jde pouze o CI/QA hotfix bez změny runtime aplikace.
