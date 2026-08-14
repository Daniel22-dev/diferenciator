# Diferenciátor 1.3.21 RC — Fáze 2: STEM zápis a věcná správnost

## Cíl

Fáze 2 rozšiřuje Diferenciátor tak, aby matematické, fyzikální, chemické a biologické materiály nezávisely jen na obecné jazykové generaci. Aplikace má nyní samostatnou vrstvu pro zachování odborného zápisu, lokální deterministické kontroly a přísnější předmětové instrukce pro generování i následný audit.

## Matematika

- typografické zlomky, odmocniny a n-té odmocniny, mocniny, indexy, běžné matematické symboly a řecká písmena;
- lokální přepočet uzavřených numerických rovností včetně zlomků, procent, mocnin a odmocnin;
- jednoduché lineární řešení lze ověřit zpětným dosazením;
- nepodporovaný LaTeX se označí varováním místo tichého předstírání správného zobrazení.

## Fyzika

- předmětový prompt vyžaduje kontrolu vztahu, dosazení, jednotek, převodů a rozměrové konzistence;
- lokálně se ověřují běžné převody délky, plochy, objemu, hmotnosti, času, rychlosti, tlaku, síly, energie, výkonu a frekvence;
- vědecký zápis a exponenty zůstávají typograficky čitelné v listu i PDF.

## Chemie

- vzorce zobrazují číselné indexy jako dolní indexy a explicitní náboje jako horní indexy;
- lokální parser rozumí závorkám a hydrátům se středovou tečkou;
- běžné chemické rovnice se kontrolují na počet atomů;
- explicitně zapsané iontové rovnice se kontrolují i na celkový náboj;
- generování nesmí zaměnit index ve vzorci za stechiometrický koeficient.

## Biologie

Biologie nemá bezpečnou univerzální deterministickou databázi faktů. Proto dostává samostatný kontrolní profil, který vyžaduje ověření terminologie, vztahu struktura–funkce, genetiky/fyziologie/ekologie a upozornění na úlohy s více biologicky správnými odpověďmi. Finální odborné potvrzení zůstává na učiteli.

## DOCX / Word Equation

Import DOCX zpracovává OMML objekty Word Equation a převádí je do přenositelného zápisu, který aplikace umí znovu typograficky vykreslit. Pokryty jsou zlomky, horní a dolní indexy, odmocniny, jednoduché matice, pole rovnic, limity, funkce a základní n-ární výrazy. Extrémně specializované matematické objekty mohou stále vyžadovat vizuální kontrolu originálu.

## QA

Nový blokující test `qa:stem` spouští skutečné Chromium, vytvoří STEM pracovní list, kontroluje DOM i tiskový náhled, generuje skutečné PDF a ověřuje, že v něm nezůstává surový `\\frac` / `\\sqrt`. Stejný test lze spustit nad school-server buildem pomocí `qa:stem:school`.

## Hranice záruky

Deterministická vrstva je druhá nezávislá pojistka pro chyby, které lze bezpečně přepočítat. Není to plnohodnotný CAS, chemický solver ani biologická encyklopedie. U složitých symbolických důkazů, pokročilých fyzikálních modelů, organické chemie a odborných biologických tvrzení zůstává nutná AI kontrola a finální učitelské ověření.
