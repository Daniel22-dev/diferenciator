# Diferenciátor 1.3.46 — GARP 2.5.1 SHIELD round 4

Datum: 2026-09-09

Toto vydání reaguje na nezávislou Prompt E kontrolu kandidáta 1.3.45. Pedagogická logika, AI operace a uživatelské workflow se věcně nemění; změny jsou omezené na assurance/tooling a QA.

## Uzavřené nálezy
- **N20 HIGH:** fetch-handler assurance vynucuje minimální kritickou cestu. Před security guardem jsou povolena jen data nutná pro method/origin/scope; jiné Request/FetchEvent/URL reads, `respondWith`, síťové/cache side effects, async plánování nebo více fetch handlerů vedou k FAIL. Po kladném guardu nesmí kritická větev číst další routing metadata ani provést vedlejší routing/network/cache efekt; jediná povolená cesta je právě jeden `event.respondWith(networkOnlyNoStore(request))`. Tím jsou fail-closed BP11–BP16 i sousední pre/post-guard, deferred-async a multi-handler varianty.
- **N21 MEDIUM:** `networkOnlyNoStore` se behaviorálně spouští se stubovaným `fetch`/`caches`; PASS vyžaduje přesně jeden `fetch(request,{cache:'no-store'})` a nulový Cache API přístup.
- **N22 LOW:** `put/add/addAll` uvnitř `networkOnlyNoStore` je explicitně CRITICAL.
- **N23 INFO:** předávací dokumentace výslovně uvádí, že `scripts/lib/chromium-debug.mjs` nebyl v 1.3.45 nový soubor, pouze byl rozšířen o dynamickou rezervaci portu.

## Regresní ochrana
- `qa-garp25-sw-policy.mjs`: baseline + 13 negativních kontrol;
- kanonický GARP selftest: 66/66 PASS;
- stejné opravené tooly budou vloženy do nového kanonického R2 hotfixu a do aplikace byte-identicky.

## Stav
PREP assurance je určena k dalšímu nezávislému Prompt E kolu. RI-LIVE, SHIELD-LIVE, DAST, skutečně servírované security headers/TLS, serverová auth/session/revokace/rate-limit/egress a produkční key custody zůstávají NOT TESTED. Toto vydání není produkční school-server approval.
