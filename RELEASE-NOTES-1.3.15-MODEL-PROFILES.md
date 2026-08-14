# Diferenciátor 1.3.15 — centrální profily AI

## Účel

Tato verze sjednocuje volbu AI výkonu s referenční implementací Korespondenčního asistenta 5.10.4 a s GHRAB AI Core kontraktem.

## Referenční kontrakt

| UI | Core profil | Direct serverless | School Gateway |
|---|---|---|---|
| ◇ Úsporný | `economy` | mapuje `runtime-config.js` | vybírá školní server |
| ⚡ Doporučený | `balanced` | mapuje `runtime-config.js` | vybírá školní server |
| ★ Důkladný | `quality` | mapuje `runtime-config.js` | vybírá školní server |

Aplikační logika nezná konkrétní providerový model a neposílá `modelOverride`. Konkrétní modelová ID smějí být pouze v direct runtime konfiguraci; školní runtime je provider-neutrální.

## Regresní pojistky

- `npm run qa:profiles` kontroluje tři přesné profily, provider-neutrální UI a integraci, direct mapování a school runtime.
- `npm run qa:profiles:browser` fyzicky klikne v Chromiu na všechny tři profily a ověří `isTrusted`, aktivní stav i skutečný `modelProfile` v Core requestu; stejný test lze spustit nad school buildem přes `qa:profiles:browser:school`.
- Interní T6 test posílá `economy`, `balanced`, `quality` přes skutečný Core do direct test hooku i school-gateway test hooku.
- School build nahrazuje runtime konfiguraci a odstraňuje přímý Gemini endpoint z CSP.

## Ruční smoke po nahrání

1. Otevřít panel AI a postupně kliknout Úsporný / Doporučený / Důkladný.
2. S každým profilem vytvořit krátkou verzi pracovního listu.
3. Ověřit řešení a kontrolu kvality alespoň u Doporučeného a Důkladného profilu.
4. Ověřit, že obnovení stránky zachová pouze zvolený profil, nikoli providerové ID.
5. Ve školním buildu ověřit stejné tři názvy bez osobního API klíče.
