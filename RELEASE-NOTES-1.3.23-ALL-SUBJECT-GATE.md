# Diferenciátor 1.3.23 — Fáze 4: all-subject release gate

Datum: 2026-08-14
Stav: RC — univerzální předmětová brána

## Cíl

Fáze 4 uzavírá čtyřfázový program univerzálnosti. Cílem není tvrdit, že model nahrazuje odbornou kontrolu učitele, ale trvale chránit aplikační vrstvu, promptování, lokální validaci a výstup/PDF napříč typickými gymnaziálními předměty.

## Testovací matice

Trvalý soubor `src/config/all-subject-test-matrix.json` pokrývá 13 domén: jazyky, matematiku, fyziku, chemii, biologii, zeměpis, dějepis, ZSV/společenské vědy, informatiku, hudební výchovu, výtvarnou výchovu, tělesnou výchovu a humanitní předměty. Průřezově se hlídá klíč, nečitelné části, bodování, tabulky, Unicode, obrazové assety, skeny, PDF a School Gateway.

## Nové pojistky

- `36-all-subject-safety.js` klasifikuje běžná česká označení a zkratky předmětů a doplňuje oborové instrukce do generování, řešení i kontroly kvality.
- Zeměpis hlídá mapový podklad, souřadnice, měřítko, časová pásma a časově proměnlivé údaje.
- Dějepis hlídá chronologii, prameny a zákaz vymyšlených citací.
- ZSV/společenské vědy upozorňují na časově citlivé právo, veřejné funkce a ekonomické ukazatele bez časového kontextu.
- Informatika chrání syntaxi, očekávaný výstup, verze a znaky `<`, `>`, `&`.
- Jazykové předměty rozlišují jednoznačné uzavřené odpovědi od více přijatelných otevřených formulací.
- Hudební/výtvarná výchova chrání notaci a obrazový podklad; tělesná výchova přidává věkovou a bezpečnostní hranici.
- Lokální validace upozorní na `[NEČITELNÉ]` / `[ČÁSTEČNĚ NEČITELNÉ]` a konzervativně porovná očíslované hlavní úlohy s očíslovaným klíčem.
- Pipe tabulky a tabulátorem oddělené tabulky se bezpečně převádějí na skutečné HTML tabulky a stejný layout se používá v PDF. STEM zápis funguje i uvnitř buněk.

## Brány

- `qa:all-subjects` — statická matice a zapojení pojistek,
- `qa:all-subjects:browser` — reálný Chromium render, klasifikace předmětů, validace klíče, tabulky, kód, hudební Unicode a skutečné PDF,
- `qa:all-subjects:school` — stejný browser/PDF test nad School Gateway buildem.

## Omezení

Věcná správnost otevřených odborných úloh, interpretace pramenů, aktuální právní/politické údaje a složité oborové výpočty nemohou být plně deterministicky ověřeny klientským kódem. Aplikace proto kombinuje lokální kontroly, oborový audit modelu a explicitní finální kontrolu učitele. Aktuální údaje bez časového kontextu se nemají domýšlet.

## Výkonový rozpočet

Kvůli nové trvalé předmětové vrstvě a tabulkovému rendereru byly stále blokující statické limity omezeně posunuty na dist 1 050 kB, entry HTML/largest file 490 kB, critical 670 kB, largest inline script 380 kB a precache 970 kB. Brána zůstává povinná; nejde o její vypnutí.
