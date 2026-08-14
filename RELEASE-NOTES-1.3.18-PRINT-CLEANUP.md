# Diferenciátor 1.3.18 RC — čistší výstup a tisk

## Změny

- odstraněn duplicitní horní číslovaný workflow; Doporučený postup je jen u konkrétní verze,
- tiskový page margin je zmenšen na 5 mm, vnitřní okraje jsou vráceny přes `box-decoration-break: clone`,
- cílem je zabránit browserovým záhlavím/zápatím s datem a URL,
- výchozí název PDF se odvozuje z hlavního nadpisu materiálu, ne z názvu aplikace,
- při běhu uvnitř AI Studia se před tiskem dočasně nastavuje i title nadřazeného okna,
- řešení dostává čitelný suffix `– řešení`.

## Kontrolní záměr

Regresní brána T14 hlídá, že horní banner číslovaný postup znovu nezavede, tiskový page margin zůstane malý a filename je odvozen z nadpisu.
