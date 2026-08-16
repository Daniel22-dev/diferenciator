# Diferenciátor 1.3.30 — Deep Subject Engines

## Hlavní změna

Verze 1.3.30 realizuje všech pět hloubkových návrhů z auditu 1.3.29:

- `EDU_TRACE` — bezpečný omezený interpret školního pseudokódu s krokovou trace tabulkou,
- `EDU_REACTION` — deterministické vyčíslování chemických rovnic, nábojová bilance a jednoduchá stechiometrie,
- `EDU_ANNOTATE` — body, šipky a rámečky nad přesně zachovaným `VISUAL_n`, bez překreslení originálu,
- `EDU_TIMELINE` — období, přibližná a nejistá datace,
- `EDU_PHYS` — free-body diagram s výslednicí a kontrolou `ΣF = m·a`.

## Odborné fail-safe chování

`EDU_TRACE` nespouští libovolný JS/Python a nepoužívá `eval` ani `new Function`. `EDU_REACTION` nehádá produkty ani chybějící redoxní prostředí. `EDU_ANNOTATE` vyžaduje skutečný existující `VISUAL_n`; pokud chybí, validace selže. FBD a časové intervaly se rovněž validují před vykreslením.

## QA

- `npm test` — PASS,
- 142/142 interních testů PASS,
- platform 109/109 PASS,
- all-subject static 92/92 PASS,
- specialist engines 46/46 PASS,
- 111 subject-name/routing browser matrix PASS,
- browser renderery nových markerů PASS,
- school-server all-subject/PDF + visual-assets PASS,
- `qa:quality` 31/31 PASS,
- XSS sink regression PASS (`eval=0`, `new Function=0`).

`EDU_ANNOTATE` má integrační důkaz, že používá přesný původní base64 obraz, funguje v tiskové cestě a nevytváří vedle anotované verze duplicitní `VISUAL_n`.

## Performance

Zmrazené limity nebyly zvýšeny:

- `dist`: 1 024 354 / 1 050 000 B,
- entry HTML: 489 961 / 490 000 B,
- entry critical: 640 410 / 670 000 B,
- largest inline script: 379 999 / 380 000 B,
- precache: 932 664 / 970 000 B,
- duplicate large assets: 0 B.

Largest inline script je prakticky na stropu; další růst této vrstvy má vést k refaktoru/splitu, ne ke zvýšení budgetu.

## Externí podmínky release

Agregovaný P5 v auditním sandboxu opět zastavila pouze lokální Chromium navigace `net::ERR_BLOCKED_BY_ADMINISTRATOR`; samostatný XSS gate prošel. Live provider smoke je bez credentialu korektně `SKIPPED: missing-credentials`. Produkční workflow má nadále používat required provider gate s `DPL_LIVE_GEMINI_API_KEY`.

## Další směr

Po této verzi je doporučený další krok corpus-driven acceptance benchmark nad reálnými obtížnými gymnaziálními pracovními listy a testy. Při použití skutečných studentských materiálů musí být osobní údaje anonymizovány. Další specialistický engine má vzniknout až podle opakujících se chyb z tohoto korpusu.
