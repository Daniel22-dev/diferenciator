# Diferenciátor 1.3.45 — GARP 2.5.1 SHIELD round 3

Datum: 2026-09-09

Toto vydání reaguje na nezávislou Prompt E kontrolu kandidáta 1.3.44. Pedagogická logika, AI operace a uživatelské workflow se věcně nemění; změny jsou omezené na assurance/tooling, build a QA harness.

## Uzavřené nálezy
- **N14 HIGH (tooling):** `check-sw-security-freeze.mjs` behaviorálně vyhodnocuje celý rozpoznaný `fetch` handler v omezeném Node VM. Každá položka autoritativního seznamu kritických assetů musí být klasifikována jako kritická a handler ji musí přesně jednou předat do `event.respondWith(networkOnlyNoStore(...))`. Mutace s negovaným guardem i větev bez `respondWith`/`return` nyní FAILují.
- **N15 MEDIUM:** kanonický `verify-ai-assurance-fingerprint.mjs` provádí vlastní candidate discovery a failuje na neevidovaném AI-boundary souboru. Tato kontrola proto funguje přímo v release gate, nejen v aplikačním `qa:garp25:static`.
- **N16 LOW:** SW checker vypisuje pozitivní `behavioralGuard` a `fetchRouteBehavior` evidence včetně počtu a jednotlivých případů.
- **N17 LOW:** behavioralní test pokrývá všechny položky autoritativního `security-critical-assets.json`, včetně server-only položek nepřítomných v aktuálním deploymentu.
- **N18 INFO:** crosswalk uvádí aktuální počet pěti SW mutation controls.
- **N19 INFO:** P3 Chromium harness používá dynamicky rezervovaný loopback port a delší startup okno, čímž se snižuje riziko falešného `Chromium debug timeout` při kolizi portu.

## Další hardening
- build akceptuje `GHRAB_BUILD_HASH` jako explicitní deterministický vstup vedle `SOURCE_DATE_EPOCH` / `GHRAB_BUILD_TIME`;
- kanonický GARP selftest obsahuje nové negativní kontroly pro N14/N15/N17 a pozitivní evidence N16;
- release a evidence vrstva se znovu zmrazí nad kandidátem 1.3.45.

## Stav
PREP assurance je určena k dalšímu nezávislému Prompt E kolu. **RI-LIVE, SHIELD-LIVE, DAST, skutečně servírované security headers/TLS, serverová auth/session/revokace/rate-limit/egress a produkční key custody zůstávají NOT TESTED.** Toto vydání není produkční school-server approval.
