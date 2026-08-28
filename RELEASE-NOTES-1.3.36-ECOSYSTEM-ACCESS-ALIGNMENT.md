# Diferenciátor 1.3.36 — ecosystem access alignment

Datum: 28. 8. 2026

## Rozsah

Úzký post-GARP bezpečnostní patch navazující na 1.3.35. Nemění vzhled, pedagogické funkce, AI operace ani datové formáty.

## Opravy

- `src/config/deployment.json` a `src/config/deployment.school-server.json` jsou sjednoceny s aktuálním podepsaným access bundle AI Studia `access-p1-20260824175535Z-k_wtm7Zj`.
- Přidána regresní pojistka T48, která release zastaví při návratu starého nebo rozdílného `sharedAccessVersion` v aktivních profilech.
- Patch verze je synchronizována v runtime, PWA cache, platformních manifestech, AI Core metadatech, reportéru a manuálu.

## Záměrně beze změny

- `deployment.school-server-p0.json` zůstává historický P0 profil.
- `deployment.school-server.example.json` zůstává šablona s `REPLACE_WITH_RELEASE_ID`.
- GARP nezávisle zkontroloval verzi 1.3.35; 1.3.36 je následný ekosystémový hardening a před RED TEAMem musí projít dostupnými regresními/build/CI branami.
