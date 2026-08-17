# Audit dodatku 1.3.32 — Output Repair / Visual UX hotfix

## Reprodukované problémy

1. `Total points: 34.` bylo součástí instrukční věty, zatímco validátor přijímal jen samostatný řádek a PDF falešně blokoval.
2. Blokace bodování neměla přímou cestu k opravě.
3. Volby `Převést / Zachovat / Reference / Nepoužívat` a tlačítka `Dříve / Později` byly funkční, ale bez dostatečného vysvětlení.
4. Při nejisté klasifikaci se `Reference` zobrazovalo jako doporučení, i když aplikace ve skutečnosti nevěděla, zda jde o screenshot úlohy nebo skutečný obrazový podklad.
5. Poznámka pro učitele mohla obsahovat volně generovaný `Target audience` včetně překlepu `gymnasion`.
6. Jednoduchý Markdown (`*Scenario:*`, `---`) se mohl propsat do viditelného výstupu jako surové znaky.

## Opravy

- inline-aware parser celkového bodového součtu;
- lokální editor bodů + automatický přepočet součtu a přímé pokračování k PDF;
- explicitní UX legenda obrazových režimů a oddělené ovládání pořadí;
- fail-safe chování u nejistého visual intentu;
- deterministická cílová skupina v učitelské části;
- Markdown cleanup pro jednoduchou kurzívu a oddělovače.

## Release gate

Hotfix nesmí změnit politiku 0 live Gemini requestů v CI ani zvyšovat zmrazené performance budgety. Finální stav je popsán ve výstupu testů přiloženém k vydanému balíčku.

## Výsledek verifikace

**Verdikt: GO WITH CI RUNTIME CONFIRMATION.** Funkční, browserové, specialistické, scoring/visual regresní, quality, school-build a XSS brány jsou zelené. Lokální P5 runtime krok nebylo možné dokončit pouze kvůli administrativní blokaci lokální navigace v tomto pracovním prostředí (`ERR_BLOCKED_BY_ADMINISTRATOR`); GitHub Actions má tento runtime krok spustit znovu po nahrání.

Ověřeno: `npm test` PASS, 156/156 interních testů, platforma 109/109, specialisté 56/56, quality 31/31, XSS PASS, school-server build PASS, T29–T33 PASS. Žádný performance limit nebyl zvýšen a CI politika 0 live Gemini requestů zůstala nedotčena.
