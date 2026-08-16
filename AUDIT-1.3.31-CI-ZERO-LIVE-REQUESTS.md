# Audit amendment — Diferenciátor 1.3.31 CI Zero Live Requests

**Datum:** 2026-08-16  
**Rozsah:** pouze CI/QA politika; runtime aplikace a odborné enginy beze změny.

## Verdikt

**GO pro současnou vývojovou fázi bez automatické spotřeby Gemini API kvóty.**

Automatický live audio/video provider smoke byl z GitHub Actions i z package scripts odstraněn. Push, pull request, P5 gate a GitHub Pages deploy nečtou provider API secret a nemají žádnou cestu k automatickému volání Gemini API. Regresní test T29 tuto vlastnost blokujícím způsobem hlídá.

## Ověření

- všechny `.github/workflows/*.yml` syntakticky PASS;
- `qa:regressions` PASS včetně T29;
- `qa:specialists` 56/56 PASS;
- kompletní `npm test` PASS;
- 144/144 interních testů PASS;
- aplikační API cesta zůstává beze změny pro vědomé uživatelské testování s vlastním klíčem.

## Budoucnost

Live provider CI se nemá vracet v současném soukromém-key / nízkokvótovém režimu. Smysl může mít až po zavedení serveru nebo vyššího API tieru, s explicitním kvótovým rozpočtem a odděleným rozhodnutím o frekvenci live smoke testů.
