# RELEASE NOTES — Diferenciátor 1.3.34 — GARP kolo 2

Datum: 26. 8. 2026

## Důvod vydání

Druhé kandidátní vydání reaguje na první nezávislou kontrolu Claude nad 1.3.33. Claude vydal AMBER bez CRITICAL/HIGH blokátoru a uvedl tři vlastní nálezy D1–D3.

## Opravy

- D1: secret scanner kontroluje i kořenové `.env` a `.env.*`.
- D2: secret scanner kontroluje také `.gz` build artefakty; rozbalení je omezené a při nečitelném gzipu selže fail-closed.
- D3: textové vstupy do AI jsou oddělené od aplikačních instrukcí. Nedůvěryhodné části jsou serializovány jako JSON string uvnitř označeného `<data>` obalu; zdrojový materiál a `teacher-context` jsou rozlišeny a ostatní modelové/quality vstupy zůstávají v datové vrstvě.
- Volný teacher context zůstává datem. Pro předmětové bezpečnostní instrukce se používá jen lokálně odvozená kanonická kategorie předmětu, takže např. chemická pravidla zůstávají funkční bez povýšení volného názvu předmětu na trusted instrukci.
- Přidány T44/T45; T45 spouští pětiprvkový otrávený korpus přímo proti skutečnému encoderu datového obalu.

## Nezměněná omezení

- Veřejný serverless build není absolutní bezpečnostní hranice proti stažení a úpravě klientského kódu.
- Přístupový guard zůstává společnou externí hranicí AI Studia / GHRAB Platform.
- Plné P5 runtime/reflow a axe s `AXE_REQUIRED=1` musí potvrdit GitHub Actions, pokud je lokální auditní Chromium omezuje.
