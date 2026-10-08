# Diferenciátor 1.3.51 — AI budget a multiplatformní QA hardening

Release 1.3.51 zpřesňuje vynucení aplikačního rozpočtu AI požadavků a stabilizuje kompletní lokální i CI kontrolu napříč podporovanými operačními systémy.

## Hlavní změny

- Jedno uživatelské workflow sdílí jeden `workflowId` mezi generováním, strukturální opravou a revizí.
- Před každým budgetovaným voláním se rezervuje nejhorší možný počet provider pokusů; limit je 12 provider požadavků na workflow.
- Chybějící nebo neúplné usage účtování se nepovažuje za nulovou spotřebu a končí fail-closed započtením rezervace.
- Chromium QA používá společnou přenosnou správu Chrome/Edge/Chromium procesů, dočasných profilů a ukončení celého procesního stromu.
- Error-reporter test již nevyžaduje externí `unzip`; ZIP kontrola je součástí testu.
- GARP foundation, red-team, accessibility a trust/fingerprint kontroly byly zpřesněny a ověřeny na Windows i v GitHub Actions.

## Bezpečnostní a provozní stav

- Aktivní autorita: GARP 2.7 r2 / G-02.
- Regresní baseline: GARP 2.5.1/N5.
- Datová klasifikace: D2.
- Agentic klasifikace: NO.
- AI operace a transportní profily se nemění.
- School-server LIVE validace zůstává `DEFERRED_BY_OWNER_DECISION / NOT_TESTED`.
