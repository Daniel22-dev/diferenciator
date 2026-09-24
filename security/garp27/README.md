# Diferenciátor — GARP 2.7 r2 / G-02

Tato složka je aplikační adaptér pro konsolidovaný **GARP 2.7 r2 / G-02 FIX** z 23. 9. 2026. Jedinou aktivní bezpečnostní autoritou je GARP 2.7. GARP 2.5.1 zůstává v repozitáři jako povinný regresní základ; historické důkazy se nepřepisují ani nevydávají za aktuální GARP 2.7 evidenci.

Normativní balík je bitově převzat ve `vendor/garp-2.7-consolidated-r2/` a jeho strom je připnut v `trust-anchor.json`. Produkční browser runtime jej neimportuje; používá jej pouze build/verification vrstva.

Diferenciátor zachovává hranice **D2** a **AGENTIC=NO**. Sedm registrovaných AI operací nemá provider tools ani autonomní side effects. Standalone profil zůstává `direct-gemini`; školní profil zůstává provider-neutrální `school-gateway` a není připojen.

## Brány

- `npm run qa:garp27:contracts` — package/contract selftest, G-02 policy admission a korektní deferred LIVE stav.
- `npm run qa:garp27:architecture` — dependency/artifact/capability/trust/single-authority integrita.
- `npm run qa:garp27:policy-mutations` — pozitivní a negativní G-02 scénáře aplikační policy.
- `npm run qa:garp27:mutations` — G27-AR mutation scénáře dokazující fail-closed architektonické kontroly.
- `npm run qa:garp27:auto-patch` — GARP 2.7 state/gate admission a vazba na existující verified-live `app-updated` tok.
- `npm run qa:garp27:static` — celý statický GARP 2.7 řetězec.
- `npm run qa:garp27:foundation` — kumulativní FOUNDATION evidence včetně zachovaných GARP 2.5.1 regresí.

V chráněném CI musí architecture gate dostat přesný SHA-256 `security/garp27/trust-anchor.json` přes `GARP27_EXTERNAL_TRUST_SHA256`. Pin je uložen mimo samotný trust anchor v P5 workflow, takže změna anchoru bez odpovídající explicitní změny chráněného CI pinu selže.

## Serverová hranice

Školní server zůstává `DEFERRED_BY_OWNER_DECISION`. Migrace nevytváří serverové endpointy, Docker/Fortinet změny ani LIVE tvrzení. `security/garp27/live-status.json` proto zůstává `NOT_TESTED` a skutečný Node 24/Alpine školní runtime musí být ověřen až v serverové etapě.
