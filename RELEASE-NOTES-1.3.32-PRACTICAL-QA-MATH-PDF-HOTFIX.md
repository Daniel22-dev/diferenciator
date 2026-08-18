# Diferenciátor 1.3.32 — Practical QA Math/PDF Hotfix

Datum: 2026-08-18

## Praktický zdroj

Regresní materiál: `pracovni-listy-rovnice-zavorky.pdf`, jedna stránka s jednou hlavní úlohou a 12 lineárními rovnicemi se závorkami.

## Opravené nálezy

1. **Pure PDF Strict struktura** — přepis nyní vrací technický `SOURCE_STRUCTURE` pro celý materiál. Strict kontrakt tedy zná `task_item_counts=12` i bez samostatných `VISUAL_n` obrázků.
2. **Dvousloupcový matematický layout** — deterministický strukturální validátor umí jako matematický fallback spočítat rovnice v Markdown tabulce; 6 řádků × 2 rovnice = 12 položek.
3. **České dělení dvojtečkou** — lokální aritmetický parser převádí `:` na dělení stejně jako `÷`.
4. **Dosazování do rovnic se závorkami** — substituce mění pouze proměnnou, nikoli její znaménko/koeficient. Odstraněny false-positive i missed-error případy u `3(6-x)=33` a `-(4+x)=3x`.
5. **Očíslovaný answer key** — před numerickou kontrolou se odstraní běžný prefix `1.` / `2)`, takže rovnice v reálném klíči nejsou potichu přeskočeny.
6. **Dokončení sjednocení Normální verze** — plný release gate odhalil zbylý starý pokyn v `TIERS.core.instr`; i samostatně generovaná Normální verze nyní zachovává zdrojový obsah, strukturu a obtížnost stejně jako Normální verze v celé sadě.

## Regresní ochrana

- T35 v `scripts/qa-differentiator-regressions.mjs`.
- Interní test všech 12 správných řešení a 12 úmyslně chybných řešení.
- Interní test `SOURCE_STRUCTURE` a dvousloupcového matematického layoutu.

Hotfix nepřidává nový API request; metadata struktury vznikají v již existujícím multimodálním načtení zdroje.
