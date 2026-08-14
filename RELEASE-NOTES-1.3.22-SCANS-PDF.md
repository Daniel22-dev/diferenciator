# Diferenciátor 1.3.22 RC — Fáze 3: fotografie, skeny a naskenovaná PDF

Datum: 2026-08-14  
Stav: RC — připraveno k uživatelskému testování

## Cíl fáze

Fáze 3 rozšiřuje import tak, aby byl použitelnější pro fotografie pracovních listů, skeny, vícestránkové obrazové podklady a PDF bez spolehlivé textové vrstvy. Důraz je na to, aby se nečitelný obsah nehádal, učitel mohl před AI přepisem lokálně upravit čtecí kopii a obrazově klíčové prvky zůstaly zachovatelné i v novém pracovním listu.

## Hlavní změny

- Panel **Obrazové podklady** je dostupný už před AI přepisem. U jednotlivých fotografií lze bez dalšího AI požadavku měnit pořadí, otočení a výřez.
- Přidána lokální volba **Vylepšit čitelnost pro AI**. Vytvoří kontrastnější čtecí JPEG kopii pouze pro analýzu; originální obraz používaný ve výsledném listu se nezmění.
- Aplikace lokálně orientačně kontroluje rozlišení, kontrast a ostrost fotografie a upozorní na potenciálně špatně čitelný zdroj.
- Importní prompt vyžaduje technický `SCAN_REPORT` se stavem `good / fair / poor`, počtem stran a stručným popisem problému.
- Model dostává výslovný zákaz domýšlet nečitelné hodnoty, čísla, značky a slova. Nečitelná místa mají být označena `[NEČITELNÉ]` nebo `[ČÁSTEČNĚ NEČITELNÉ]`.
- PDF se modelu předává jako multimodální PDF a instrukce vyžaduje vizuální průchod každé stránky, tedy i u skenu bez textové vrstvy.
- V jednom importu lze použít **jedno PDF + doplňkové obrázky**. Tím lze k naskenovanému PDF přiložit přesný snímek nebo výřez mapy, grafu, schématu či jiného prvku, který má být pixelově zachován ve výstupu.
- U PDF aplikace nepředstírá přesnou lokální extrakci obrazu z libovolné stránky. Pro pixelově věrné zachování vizuálu se používá učitelem přiložený snímek/výřez; samotné PDF slouží modelu k multimodálnímu čtení stránky po stránce.
- Výslovná učitelská volba **zachovat / reference / ignorovat** má přednost před následnou AI klasifikací vizuálu.
- Nepodporovaný obrazový formát, který prohlížeč neumí dekódovat, se už nemá tiše ztratit; uživatel dostane pokyn uložit zdroj jako JPG/PNG/WebP nebo PDF.
- Přidána blokující regresní brána T18 a skutečný Chromium test `qa:scan`; stejný test existuje pro school-server build jako `qa:scan:school`.

## Co se zachovává z předchozích fází

- Fáze 1: obrazově klíčové podklady včetně slepých map, grafů a schémat lze zachovat jako skutečné obrazové assety ve výsledku, projektu a PDF.
- Fáze 2: STEM typografie, Word Equation, deterministické kontroly matematiky/fyziky/chemie a STEM browser/PDF gate zůstávají aktivní.

## Známé hranice

- Lokální kvalita fotografie je heuristika, nikoli profesionální OCR nebo měření ostrosti; výsledný přepis musí učitel porovnat se zdrojem.
- Diferenciátor v této fázi neobsahuje obecný PDF rasterizer/cropper, který by z libovolného skenu automaticky vyřízl přesnou mapu či diagram. Pro takový prvek se používá doplňkový screenshot/výřez.
- Automatické narovnání perspektivy šikmé fotografie není součástí 1.3.22. Otočení, pořadí, výřez a čtecí kontrast jsou lokální; složitě deformovaný snímek je vhodné předem vyfotit znovu nebo narovnat v telefonu.
- `SCAN_REPORT` je pomocná AI diagnostika a nenahrazuje učitelské ověření čísel, symbolů a odborného zápisu.
