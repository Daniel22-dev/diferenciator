# Diferenciátor 1.3.32 — GitHub Pages resilient hotfix

Datum: 2026-08-17

Tento hotfix nemění aplikační logiku Diferenciátoru 1.3.32. Reaguje pouze na opakovaný HTTP 503 z GitHub Pages deployment API po úspěšném buildu, testech a uploadu artefaktu.

## Změny

- `actions/configure-pages` aktualizováno z `v5` na `v6`.
- `actions/upload-pages-artifact` aktualizováno z `v3` na `v5`.
- `actions/deploy-pages` aktualizováno z `v4` na `v5`.
- Deploy job má tři omezené pokusy: okamžitě, po 60 s a po dalších 180 s. `deploy-pages` nevystavuje HTTP status jako output, proto je retry omezený na selhání deploy kroku obecně; trvalá konfigurační chyba po třech pokusech stále failuje.
- Každý pokus používá oficiální `actions/deploy-pages@v5`; pokud ani jeden neuspěje, job skončí explicitní chybou.
- Přidána regresní pojistka T31 pro action major verze, počet retry pokusů, backoff a fail-closed závěr.
- CI politika 0 live Gemini requests zůstává beze změny; T29 ji nadále blokujícím testem hlídá.

## Rozsah

Aplikační zdrojový kód, odborné enginy, prompty, vizuální routing a bodování nejsou tímto hotfixem měněny.
