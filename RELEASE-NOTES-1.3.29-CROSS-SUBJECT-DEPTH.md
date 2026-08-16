# Diferenciátor 1.3.29 — Cross-subject depth

## Hlavní změna

Verze 1.3.29 rozděluje příliš obecnou odbornou vizuální vrstvu podle skutečného typu předmětu a přidává čtyři deterministické specialistické cesty:

- `EDU_FLOW` — procesní, vztahové a algoritmické diagramy,
- `EDU_TIMELINE` — chronologické osy,
- `EDU_GENETICS` — Punnettovy čtverce a rodokmeny,
- `EDU_PHYS` — vektorové součty a bezpečně omezený diagram spojné čočky.

Biologie, fyzika, chemie, matematika a vědy o Zemi už nepoužívají jeden společný STEM seznam markerů. Dějepis a informatika dostávají vlastní deterministické cesty pro běžné typy úloh.

## Bezpečnost odborného obsahu

Nové renderery jsou fail-closed. Duplicitní/neexistující odkazy, neplatné genotypy, chybné pravděpodobnosti, záporná velikost vektoru nebo nepodporovaný optický případ vedou k odmítnutí rendereru místo přibližného obrázku.

## QA

- `npm test` PASS,
- 142/142 interních testů PASS,
- 84/84 all-subject static PASS,
- 32/32 specialist engines PASS,
- browser renderers PASS,
- 111 subject-name/routing browser matrix PASS,
- school-server all-subject/PDF PASS,
- `qa:quality` 31/31 PASS,
- XSS regression PASS.

P5 v auditním sandboxu znovu blokuje pouze lokální runtime navigace (`ERR_BLOCKED_BY_ADMINISTRATOR`). Live provider smoke je bez credentialu korektně `SKIPPED`; release workflow má nadále používat required provider gate.

## Performance

Zmrazený performance budget zůstal beze změny. Finální měření `dist` je 1 049 632 B z limitu 1 050 000 B.
