# Diferenciátor 1.3.49 — GARP 2.7 r2 migration assessment

Datum: 2026-09-24  
Aplikace: `differentiator` / Diferenciátor pracovních listů a testů 1.3.49  
Aktivní kontrakt: GARP 2.7 / konsolidace `2026-09-23-r2`  
Vstupní aplikační ZIP SHA-256: `a716266df09e31e3a786152dbb27c0be1db1152bf350a1ab81da4a1ca7dc4d90`  
GARP r2 vstupní ZIP SHA-256: `0c278aefa0581b3ba13dd5725da9d3fc624976c255602ec16b054fc81da6f7c8`

## Rozhodnutí

Diferenciátor byl převeden z aktivní GARP 2.5.1/N5 baseline na **GARP 2.7 r2 / G-02** bez odstranění existujících ochran. GARP 2.5.1 tooling, N5, release-integrity v2, Safe Promotion, Platform 1.1.2 a AI Core 1.0.0 zůstávají povinnými regresními vrstvami.

Migrace je adaptér/gate změna. Pedagogické workflow, renderery, uživatelské UI, počet AI operací i jejich funkční význam se záměrně nemění.

## Zachované hranice

- datová třída zůstává **D2**;
- agentní profil zůstává **AGENTIC=NO**;
- registry obsahuje přesně 7 AI operací a žádný provider tool;
- žádný MCP/shell executor, autonomní tool loop ani modelově spouštěný aplikační side effect nebyl přidán;
- standalone profil zůstává explicitní `direct-gemini` bez automatického fallbacku;
- školní profil zůstává výhradně `school-gateway`, zakazuje lokální provider key a nově výslovně vyžaduje LIVE validaci po skutečném připojení.

## GARP 2.7 dopad

- `differentiator` je ověřován proti trusted ecosystem inventory;
- policy admission používá r2 G-02 sémantický validator;
- capability inventory váže 7 AI operací, D2/AGENTIC=NO, runtime profily, importy, storage a cross-app rozhraní;
- architecture gate kontroluje zdrojové dependency hrany, produkční artefakt, capability drift, trusted digests, single active authority a CI trust pin;
- mutation testy úmyslně porušují dependency boundary, produkční artefakt, AI inventory, school egress, policy/tool trust a vendored master a musí zčervenat;
- auto-patch kontrakt je navázán na existující verified-live release dispatch; sám nevydává LIVE tvrzení.

## Server/LIVE

School-server fáze zůstává `DEFERRED_BY_OWNER_DECISION`. Žádný nový serverový endpoint, Fortinet zásah ani infrastruktura se v tomto patchi nepřidává. LIVE stav zůstává `NOT_TESTED`. Kompatibilita s cílovým Node 24/Alpine prostředím není tímto lokálním kolem prohlášena za ověřenou.

## Governance

Technický nález G-02 je pokryt aplikační policy, referenčním validátorem a negativními testy. G-01 formální přijetí normativní autority zůstává samostatnou vlastnickou/governance akcí; technický patch jej nefalšuje jako automaticky schválený.
