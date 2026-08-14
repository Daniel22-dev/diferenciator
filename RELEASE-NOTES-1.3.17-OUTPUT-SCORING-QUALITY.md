# Diferenciátor 1.3.17 — výstup, bodování a omezená kontrola

Datum: 2026-08-14
Stav: release candidate

## Co se mění

### Výrazný název pracovního listu / testu
- Strukturovaný výstup má samostatný hlavní nadpis v aplikaci i PDF.
- Technické dodatky typu `Parallel Version`, `Parallel Variant` nebo `Normální verze` se z hlavního názvu odstraní.
- Název materiálu se v PDF tiskne výrazně; název varianty je jen menší podtitul.

### PDF řešení bez prázdné první strany
- Klíč už není tisknut jako jeden nedělitelný blok.
- Jednotlivé části řešení se mohou zalomit přes stránku, takže prohlížeč neodsouvá celý klíč až na další stranu.
- Tiskový test přes Chromium `Page.printToPDF` ověřil dvoustránkový klíč, jehož první odpovědi skutečně začínají už na straně 1.

### Bodování
- Existující bodování ve zdrojovém materiálu je závazné: zachovávají se bodové hodnoty srovnatelných úloh i celkový součet.
- Pokud diferenciace vyžaduje vnitřní změnu úlohy, body se smějí přerozdělit pouze uvnitř této úlohy tak, aby její hodnota a celkový součet zůstaly stejné.
- Pokud zdroj žádné body nemá, učitel volí:
  - ponechat materiál bez nových bodů a doplnit je ručně;
  - nebo nechat AI navrhnout body v rámci stejného generovacího requestu.

### Kontrola bez nekonečné smyčky
- První kontrola je hlavní souhrnný audit za 1 request.
- Audit dostává pokyn udělat v rámci jednoho requestu dva interní průchody: nejprve úlohu po úloze, poté celek; skutečné nálezy má vrátit najednou.
- Učitel označí jen opravy, které chce zapracovat; jejich zapracování je 1 revision request.
- Revision request sám provede interní závěrečné ověření, že opravy nevytvořily nový rozpor.
- Po zapracování PDF ani řešení nevynucují novou kontrolu.
- K dispozici je nejvýše jedna explicitně volitelná `Finální kontrola ⚡ 1`; třetí auditní kolo aplikace nenabízí.
- Stav po zapracování už neříká „znovu ověř“, ale „finální kontrola volitelná“.

## Regresní pojistky
- T13 hlídá hlavní nadpis, bodování, zalomitelný klíč a omezený auditní tok.
- Interní test ověřuje, že po zapracování první kontroly lze přejít přímo k PDF bez dalšího vynuceného AI requestu.
- Interní test kontroluje, že se zobrazí maximálně jedna volitelná finální kontrola.

## Výkon
Funkce 1.3.17 zvětšily jednosouborový build o několik kB. Výkonová brána zůstává blokující; rozpočty byly pouze mírně posunuty na současnou velikost s malou rezervou (entry HTML 370 kB, největší inline script 270 kB, precache 845 kB).
