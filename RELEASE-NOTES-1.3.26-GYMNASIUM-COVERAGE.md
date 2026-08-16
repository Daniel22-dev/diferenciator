# Diferenciátor 1.3.26 — Gymnasium coverage hardening

## Cíl
Rozšířit release gate z obecné 13doménové kontroly na praktickou gymnaziální matici předmětů, specializací a multimodálních typů zadání pro pracovní listy i paralelní testy.

## Změny
- 111 routovacích případů předmětů, seminářů, praktik a průřezových školních názvů v browserové bráně.
- Rozšířené STEM větve: matematické disciplíny, astronomie, biologie/ekologie/environmentální výchova a samostatné vědy o Zemi.
- Rozšířené jazyky, společenské vědy, informatika a humanitní/umělecké obory; CEFR rozpozná i obecně pojmenované jazykové konverzace.
- PPTX/XLSX: vložené obrázky se zachovávají jako vizuální assety.
- PPTX: nativní grafy se detekují a AI dostává datové oblasti/uložené hodnoty; SmartArt/nativní diagramy dostávají textový technický přepis.
- XLSX: nativní grafy se detekují a AI dostává datové oblasti a uložené hodnoty.
- Preserved-visual invariant: paralelní varianta nesmí měnit hodnoty, popisky, polohy, symboly ani fakta uvnitř zachovaného vizuálu.
- Matice eviduje 70 obsahových primitiv včetně rovnic, tabulek, map, grafů, schémat, notace, kódu a Office-native prvků.

## Známé hranice
- Audio a video nejsou v 1.3.26 přímým vstupním formátem; poslechové/jazykové a audiovizuální úlohy proto zatím vyžadují textový přepis nebo doprovodný statický podklad.
- Nativní PPTX/XLSX graf není rasterizován pixelově; data se přepíší technicky, pro shodný vzhled použij PDF nebo snímek grafu.
- PPTX SmartArt se převádí na textovou informaci, nikoli pixelově shodný diagram.
- DOCX nativní graf/SmartArt není explicitně parsován; spolehlivá cesta je PDF nebo samostatný snímek.
- Obrazově klíčový prvek uvnitř PDF se pixelově zachová až po přidání snímku/výřezu příslušné stránky.
- HTML import zachovává text, nikoli vložené obrázky a původní layout.
- Aplikace sama negeneruje nový mapový/notový/chemický obrázek; bezpečně zachovává dodaný podklad a vytváří nové otázky kolem něj.
- Raw matematický zápis má vlastní bezpečný renderer pro běžné konstrukce, nikoli plný TeX engine; pokročilé konstrukce je vhodné dodat jako Word Equation nebo obraz/PDF.

## Release gate
Povinně: `qa:all-subjects`, `qa:all-subjects:browser`, `qa:office-rich`, `qa:visuals`, `qa:scan`, `qa:stem`, regresní a interní testy.
