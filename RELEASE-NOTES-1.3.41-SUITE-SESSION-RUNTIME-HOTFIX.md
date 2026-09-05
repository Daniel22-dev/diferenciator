# Diferenciátor 1.3.41 — suite-session runtime hotfix

Datum: 2026-09-05

## Důvod
GitHub Actions P5 runtime audit kandidáta 1.3.40 odhalil `ReferenceError: GHRAB_PLATFORM is not defined` při prvním načtení `index.html`. Platforma ještě nemusela být v okamžiku okamžité instalace lifecycle handleru dostupná.

## Oprava
`src/js/21-suite-session-lifecycle.js` používá pro detekci platformy `window.GHRAB_PLATFORM?.session`. Pokud platforma ještě není připravená, instalace se bezpečně odloží na `ghrab:platform-ready`.

Storage ownership, cleanup policy, acknowledgement pořadí a vendorizovaná GHRAB Platform 1.1.2 se nemění.
