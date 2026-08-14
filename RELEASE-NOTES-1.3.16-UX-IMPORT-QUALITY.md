# Diferenciátor 1.3.16 — UX, DOCX import a selektivní kontrola

**Datum:** 2026-08-14  
**Stav:** release candidate pro uživatelské testování

## Co se změnilo

1. **Pedagogické zpřesnění / cílová skupina:** lokální slovník rozpoznává `prima` až `oktáva` a do promptu doplní ročník osmiletého gymnázia a orientační věk.
2. **Vlastní pokyn učitele:** je v promptu výslovně označen jako závazný a má přednost před automatickými preferencemi, pokud nekoliduje se zvolenou úrovní/režimem, bezpečností nebo věcnou správností.
3. **Výběr úrovně:** Normální je výchozí; vybraná karta má výrazný stav `✓ Vybráno`. Režim „Stejný obsah, jiná obtížnost“ Normální vypne a vyžaduje Jednodušší nebo Obtížnější.
4. **Automatické volby:** byly přejmenovány a pod každou se zobrazuje živé vysvětlení konkrétního chování.
5. **Typ podpory / výzvy:** pole je volitelné vodítko pro způsob diferenciace, ne změna tématu nebo cíle; UI nabízí konkrétní příklady.
6. **Kontrola kvality:** `Opravit` a `Doporučení` mají checkboxy; tlačítko `Zapracovat vybrané` vytvoří revizi pouze z označených bodů.
7. **PDF potvrzení:** vlastní theme-aware checkbox nahrazuje černý nativní čtverec.
8. **Doporučený postup:** všechna hlavní výsledková tlačítka používají `1.`, `2.`, `3.`.
9. **DOCX:** import čte textovou vrstvu i vložené obrázky v pořadí dokumentu a odesílá je společně do `material-extraction`; image-only DOCX je podporován.
10. **Další úpravy:** `Export .md` a `Regenerovat` byly odstraněny; zůstávají `Upravit` a `Kopírovat`.

Výkonnostní rozpočty byly kvůli novému DOCX a selektivnímu quality workflow mírně zvýšeny, ale zůstávají blokující: entry HTML 360 kB, largest inline script 260 kB, precache 830 kB.

## Technická poznámka k DOCX

Předchozí čtečka Office pracovala jen s XML textovou vrstvou. Pracovní listy vložené do Wordu jako obrázky proto mohly z importu zmizet. Nová cesta čte vztahy `document.xml.rels`, zachová pořadí použitých `a:blip` obrázků, deduplikuje opakované reference a využije existující bezpečné zmenšení obrázků. Limit zůstává 8 vložených obrázků na jeden dokument.

## Kontrolní brány

Výsledky jsou uvedeny v `AUDIT-REVIEW-1.3.16.md` a musí odpovídat finálnímu zabalenému release candidate.

## Finální ověření RC

- GHRAB Platform **109/109**
- AI profily **17/17**
- interní testy **104/104**
- `qa:quality` **31/31**, bez varování
- `qa:browser`, `qa:xss`, `qa:lock` **PASS**
- error reporter **56 PASS / 0 FAIL**
- school-server build + trusted-click profilový test **PASS**
- reálný `Vocab - body.docx`: **text + 3/3 vložených obrázků načteny**

`qa:runtime` je v OpenAI runneru blokován spravovanou Chromium politikou a `qa:axe` je `not-ready-environment` kvůli chybějící přesné instalaci axe-core; tyto dvě položky nejsou označeny jako PASS.
