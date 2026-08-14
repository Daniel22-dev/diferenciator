# Diferenciátor 1.3.20 RC — Fáze 1: obrazově klíčové podklady

## Cíl
První fáze rozšiřuje Diferenciátor tak, aby mapa, graf, schéma, geometrický nákres, biologický obrázek nebo jiný obrazově klíčový podklad po importu nezmizel v textovém přepisu. Princip této fáze je: **obrazově klíčový podklad se zachovává jako skutečný asset, ne jako AI popis nebo překreslená náhrada**.

## Co je nové
- Po multimodálním načtení aplikace klasifikuje přiložené obrázky jako obrazově klíčové, podpůrné, fotografii/sken celé stránky nebo dekorativní.
- Učitel u každého obrázku volí **Zachovat původní obraz ve výstupu**, **Použít jen jako předlohu** nebo **Nevkládat / ignorovat**.
- Kritický obraz se po rozpoznání předvolí k zachování; fotografie celé stránky se předvolí jako reference, aby se do nové verze nekopíroval celý původní pracovní list.
- Z fotografie celé stránky lze lokálně vyříznout jen mapu, graf, schéma nebo jinou potřebnou oblast. Výřez nevytváří žádný další AI request.
- Zachovaný asset je poslán modelu jako multimodální kontext a zároveň je uložen mimo modelový text. Model vrací pouze marker `[[VISUAL_n]]`; aplikace jej nahradí uloženým zdrojovým obrazem. Když model marker opomene, aplikace zachovaný podklad doplní sama.
- Stejný obrazový asset se přenáší do výsledku, editace, kontroly kvality, revize, tvorby řešení, exportu/importu projektu a tiskového/PDF náhledu.
- Kontrola kvality a tvorba řešení dostávají zachované obrázky jako skutečné image vstupy, takže mohou ověřovat úlohy závislé na mapě/grafu/schématu místo práce pouze s textovým popisem.
- DOCX podporuje vložené PNG/JPEG/WebP/GIF a nově lokálně rasterizuje SVG. Nepodporovaný vložený obrazový formát se už neztratí potichu — učitel dostane upozornění.
- U technicky zmenšeného velkého obrázku aplikace výslovně upozorní na kontrolu jemných detailů v PDF náhledu.

## Slepé mapy — doporučený tok
1. Nahraj samostatnou mapu nebo fotografii pracovního listu.
2. Po načtení zkontroluj panel **Obrazové podklady**.
3. Pokud je vložena celá stránka, použij **Vyříznout oblast** a ponech jen mapu.
4. U mapy nech **Zachovat původní obraz ve výstupu**.
5. Diferenciace pak mění zadání, míru podpory, počet prvků nebo formu odpovědi, ale mapu samotnou AI nepřekresluje.
6. Před tiskem zkontroluj mapu v PDF náhledu stejně jako ostatní obsah.

## Ověření
- `npm test`: zelené; Platform 109/109, modelové profily 17/17, regresní brána včetně T16, skutečný Chromium visual test a 121/121 interních testů.
- `qa:visuals` Direct Gemini: PASS — klasifikace manifestu, tři režimy, beze změny přenesená PNG data do výsledku/tiskového náhledu/projektu, lokální výřez a image část skutečného Core requestu.
- `qa:visuals:school`: PASS se stejnými kontrolami přes School Gateway.
- `qa:quality`: 31/31; aktuálně dist 909 455 B, entry HTML 417 266 B, critical 592 041 B, largest inline script 310 966 B, precache 889 134 B.
- `qa:browser`: PASS; `qa:xss`: PASS; `qa:lock`: PASS; error reporter 56 PASS / 0 FAIL.
- `qa:profiles:browser:school`: PASS.

## Známá hranice Fáze 1
PDF je multimodálně analyzováno a aplikace umí rozpoznat, že obsahuje obrazově klíčový prvek, ale v této fázi jej **nevyjímá z PDF jako samostatný spolehlivý obrazový asset**. Pokud je mapa/graf/schéma v PDF nezbytné pro řešení, UI na to upozorní a doporučí nahrát příslušnou stránku nebo podklad jako obrázek. Přesná práce se skeny, PDF stránkami, šikmými fotografiemi a jejich předzpracováním je plánovaná Fáze 3.

Také není záměrem této fáze automaticky překreslovat nebo „vylepšovat“ mapu pomocí generativní AI. U školních testů je věrnost zdroji bezpečnější než generovaná náhrada.
