# Diferenciátor 1.3.32 — Vertical arithmetic PDF hotfix

Praktická oprava pro PDF pracovní listy typu **Písemné odčítání**, kde je větší počet aritmetických příkladů zapsán svisle v pravidelné mřížce.

## Opravený problém

Původní generování mohlo z listu 4 × 6 vytvořit jednu dlouhou svislou sekci, každý příklad zapsat dvakrát (např. `47 − 28 =` a znovu pod sebou) a následně správně fail-closed zablokovat PDF kvůli změně struktury. Samotný gate tedy zachytil problém, ale generátor neměl přesný výstupní formát pro tuto třídu materiálů.

## Změny

- `SOURCE_STRUCTURE` umí `layout=vertical_arithmetic_grid`, `columns` a `rows`.
- Mřížka se kanonicky chápe jako jedna hlavní úloha s N příklady.
- `EDU_ARITH` je nový deterministický renderer pro písemné sčítání, odčítání, násobení a dělení.
- Prompt výslovně zakazuje duplicitní horizontální + svislý zápis stejného příkladu.
- Strict gate počítá položky markeru a u známého layoutu kontroluje i počet sloupců.
- T39 + interní regresní testy + browser renderer QA chrání tento případ.
- V režimech „Bez bodování“ a „Ruční bodování“ se deterministicky čistí i slovní bodování přidané AI do instrukcí nebo do závorky v nadpisu úlohy; časový limit se zachová.
- T40 chrání reálný screenshotový případ `Hodnocení: 1 bod za každý správný výsledek (celkem 24 bodů)` a složenou závorku `každý příklad = 1 bod, celkem 24 bodů`.

## Ověření

- `npm test`: PASS po finální regresi.
- `qa:renderers`: PASS včetně `EDU_ARITH`.
- T1–T40: PASS.
- `qa:school-build`: PASS.
