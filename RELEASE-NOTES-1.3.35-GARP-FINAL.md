# Diferenciátor 1.3.35 — GARP final hardening

Datum: 2026-08-26

## Kontext

Tato verze je druhá a poslední opravná reakce ChatGPT po druhém nezávislém kontrolním kole Claude. Claude u 1.3.34 nenašel CRITICAL ani HIGH blokátor a potvrdil opravy D1–D3. Nové nálezy E1 a E2 označil jako neblokující defense-in-depth; byly přesto ověřeny proti kódu a opraveny před finálním GitHub/CI releasem.

## E1 — content-independent trust partition

`worksheet-generation` už neskládá důvěryhodné instrukce, importovaný materiál a teacher context do jednoho řetězce, který by se následně dělil pomocí `indexOf()` markerů ovlivnitelných obsahem. `PromptBuilder` vytváří důvěryhodné instrukce a současně předá oddělené části `source` a `teacher-context` bez zpětného parsování importovaného textu. Produkční volání předává source a teacher-context jako samostatné datové části a instrukce přes `appInstructions`.

Bezpečnostní dopad: importovaný soubor obsahující text `UČITELSKÝ KONTEXT (JSON):` se nemůže přestítkovat z `source` na `teacher-context`.

## E2 — whitelist datových labelů

`dplData()` přijímá pouze pevně povolené labely `source`, `source-material`, `source-document-text` a `teacher-context`. Jakýkoli jiný label degraduje na nejméně privilegovaný `source`.

## Regrese

- T46: worksheet-generation používá content-independent oddělení instrukcí/source/teacher-context.
- T47: neznámý nebo injekční label nemůže změnit atribut datového obalu.

## Release podmínka

Lokální testy nesmějí nahrazovat povinné CI runtime/reflow a axe brány. Produkční vydání je povoleno až po zeleném GitHub Actions P5 gate se `qa:runtime` a `AXE_REQUIRED=1` axe kontrolou.
