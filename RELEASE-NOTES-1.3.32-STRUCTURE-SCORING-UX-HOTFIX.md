# Diferenciátor 1.3.32 — Structure / Scoring / UX hotfix

Tento hotfix navazuje na Visual Intent Routing i GitHub Pages resilient hotfix. Aplikační verze zůstává 1.3.32.

## Opravy

1. Checkbox pro povolení nové rozšiřující úlohy je znovu kompaktní a text je klikací spolu s checkboxem.
2. Lokální kontrola obrazů už nehlásí neurčité „alespoň jeden snímek“, ale vypíše konkrétní VISUAL_n a problém. Přidáno hromadné lokální tlačítko pro vylepšení čtecích kopií; originály se nemění.
3. TASK_IMAGE/HYBRID manifest získal strukturální metadata `task_item_counts` a `explicit_examples` v rámci stejného existujícího načítacího AI requestu.
4. Při „Stejný formát, jiný obsah“ / striktním zachování struktury se kontroluje počet hlavních úloh a položek. Ručně dopsaná či předvyplněná odpověď se nesmí sama od sebe změnit na „Example – not scored“.
5. AI scoring musí být transparentní: bodová hodnota v nadpisu každé hlavní úlohy a celkový součet. PDF se při neúplném bodování nebo strukturálním driftu zablokuje.
6. Interní testovací konzole se v produkčním dist ukládá gzip-komprimovaně a rozbalí se až při testovacím režimu; zmrazené performance limity nebyly zvýšeny.
7. Regresní fixture reálného BODY listu nyní obsahuje očekávanou strukturu 7 / 6 / 6 / 9 položek a reprodukci 32-vs-33 driftu.

## Quota / CI

Žádný nový AI request nebyl přidán. GitHub Actions nadále neprovádějí žádné live Gemini volání.
