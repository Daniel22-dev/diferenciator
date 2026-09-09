# Diferenciátor 1.3.44 — GARP 2.5.1 audit-fix round

Datum: 2026-09-09

Toto vydání reaguje na nezávislou Prompt E kontrolu kandidáta 1.3.43. Pedagogická logika a uživatelské workflow se nemění.

## Uzavřené nálezy
- **N6 HIGH (tooling):** `check-sw-security-freeze.mjs` nyní kromě struktury behaviorálně ověřuje `isSecurityCriticalRequest()` pro každý deklarovaný kritický asset a kontrolní nekritické cesty. `qa-garp25-sw-policy` obsahuje třetí mutation control reprodukující původní `./runtime-config.js` false negative.
- **N7 MEDIUM (SBOM):** generátor používá poslední `node_modules/` segment, takže vnořené `rrweb-cssom@0.8.0` je správně inventarizováno. Samostatná coverage brána porovnává lockfile path/name/version/purl proti SBOM.
- **N8 MEDIUM:** AI assurance fingerprint má samostatný verifier a je krokem rozšířeného release gate.
- **N9 MEDIUM:** SW security freeze běží přímo v `postbuild` a `build:school-server`.
- **N10 LOW:** evidence manifest v2 kryptograficky váže externí autoritativní policy soubory.
- **N11 LOW:** AI boundary používá explicitní inventář; regex funguje jen jako detektor neevidovaných kandidátů a failuje closed.

## Další hardening
- build podporuje `SOURCE_DATE_EPOCH` a `GHRAB_BUILD_TIME`; dva buildy se stejným epoch jsou byte-identické v `dist/` i `dist-school-server/`;
- release gate explicitně uvádí `stepsRun` a `skippedSteps`;
- GARP selftest: 48/48 PASS;
- app-local tooling je byte-identický s novým kanonickým R2 hotfix balíkem.

## Stav
PREP assurance lze nezávisle auditovat. **RI-LIVE, SHIELD-LIVE, DAST, skutečně servírované security headers/TLS, serverová auth/session/revokace/rate-limit/egress a produkční key custody zůstávají NOT TESTED.** Toto vydání není produkční school-server approval.
