# Diferenciátor 1.3.43 — GARP 2.5.1 SHIELD delta

Datum: 2026-09-09

## Co se mění
- Bez změny pedagogické logiky aplikace.
- Service worker nově zachází s runtime/deployment/access/GHRAB platform/integrity assety fail-closed: network-only + `cache: no-store` před cache-first cestou.
- Build post-processing už bezpečnostně kritický `ghrab/ghrab-platform.js` nevrací do P3 precache.
- Přidána kanonická GARP 2.5.1 TOOLING R2 vrstva, security-critical asset list, SW mutation controls, evidence manifest, CycloneDX SBOM, build provenance a PREP signed release integrity.
- Zdrojové logo bylo zarovnáno s kanonickou kopií GHRAB Platform 1.1.2; výsledný vizuální asset v buildu je shodný s platformním zdrojem pravdy.

## Ověření
- GARP R2 tooling selftest 43/43 PASS.
- GARP statická sada PASS.
- Quality 31/31 PASS a regresní gate zelený.
- Doménové dependency-free sady: AI profiles 22/22, all-subject 92/92, multimedia 19/19, specialist engines 56/56.
- SW checker public + school profile PASS; dva záměrné SW bypassy jsou správně odmítnuty.
- PREP release gate GREEN.

## Co zůstává NOT TESTED
Clean `npm ci` a Chromium/axe/runtime browser sada v tomto sandboxu kvůli nedostupnému npm balíčku; dále DAST, SHIELD-LIVE, RI-LIVE a produkční key custody na školním serveru.
