# Diferenciátor 1.3.25 — GARP follow-up po auditu 1.3.24

Toto vydání je cílená stabilizační oprava nad 1.3.24 RC. Neotevírá znovu uzavřené funkční fáze 1–4.

## Opraveno
- **M1:** direct runtime má `requestTimeoutMs: 120000`, stejně jako school runtime. `qa:profiles` tuto hodnotu i shodu obou profilů blokujícím způsobem ověřuje.
- **M2:** `economy = gemini-3.5-flash-lite`, `balanced = gemini-3.6-flash`, `quality = gemini-3.7-flash`. Nová profilová brána zná explicitní capability order a selže při obrácení pořadí. Protože 3.7 nepodporuje thinking level `minimal`, direct volání jej pro tento model bezpečně převádí na `low`.
- **M3:** zpětná vazba po výběru 1.–4. ročníku čtyřletého gymnázia už neopakuje stejnou frázi dvakrát.
- **M4:** odstraněny nepoužívané `mediaParts`, `labelledMediaParts`, `referencedSourceVisualAssets` a `visualSummaryForPrompt`.
- Doplněny regrese **T25–T27**.

## Záměrně neprovedeno
- **M5:** lazy-load refaktor není vhodný do auditního hotfixu; performance baseline z 1.3.24 se neposouvá.
- **M6:** parser zůstává kompatibilní s GFM tabulkami, které vyžadují oddělovací řádek. Tolerantní pipe parser bez oddělovače je případné budoucí UX rozšíření, ne oprava standardu.
- **M7:** procesní doporučení bez změny kódu.

## Ruční release check
Reálný sken/PDF přes skutečné Gemini API nelze nahradit lokálním mockem. Před širším nasazením je stále vhodné jednou ověřit 3–4stránkový sken v profilu Důkladný a změřit skutečnou latenci.
