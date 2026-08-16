# Diferenciátor 1.3.31 — CI ffmpeg hotfix

Datum: 2026-08-16

## Důvod

Po nastavení repository secretu `DPL_LIVE_GEMINI_API_KEY` prošel P5 release gate, ale samostatný povinný live audio/video provider smoke skončil ještě před voláním provideru chybou `spawnSync ffmpeg ENOENT`. GitHub runner neměl explicitně zajištěnou binárku `ffmpeg`, kterou `qa-provider-multimedia-live.mjs` používá k přípravě testovacích audio/video vstupů.

## Oprava

- `.github/workflows/deploy.yml` instaluje `poppler-utils ffmpeg` a ověřuje `pdftotext -v` i `ffmpeg -version`;
- `.github/workflows/p5-release-gate.yml` provádí stejný provisioning před `qa:provider:live:required`;
- regresní brána dostala T29, která vyžaduje `ffmpeg`, `ffmpeg -version` a povinný live provider smoke v obou release workflow.

## Rozsah

Jde pouze o CI/toolchain hotfix. Aplikační kód, odborné enginy, modelové profily, build budgety ani číslo verze aplikace se nemění. Verze zůstává 1.3.31.

## Lokální ověření

- YAML parse všech `.github/workflows/*.yml`: PASS
- `npm run qa:regressions`: PASS včetně nové T29
- plná aplikační regrese se provádí nad stejným zdrojovým release candidate; live provider výsledek je definitivně ověřitelný až v GitHub Actions s repository secretem.
