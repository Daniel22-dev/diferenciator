# Diferenciátor 1.3.48 — MASTER cleanup

Datum: 2026-09-18

## Účel

Metadata-only cleanup patch nad ověřeným produkčním baseline 1.3.47. Nemění aplikační logiku, pedagogické workflow, UI ani AI operace.

## Auditní oprava

Pre-release `release-acceptance.json` je zdrojový P5 vstup, nikoli autorita pro živý stav. V 1.3.47 se historicky kopíroval do `dist/config/`, takže veřejný runtime mohl obsahovat kandidátní stavová metadata i po úspěšném produkčním deployi.

1.3.48 ponechává dokument v `src/config/`, ale build jej explicitně odstraní z runtime artefaktu. P5 současně fail-closed ověřuje, že `dist/config/release-acceptance.json` neexistuje.

## Autoritativní live evidence

Aktuální produkční stav je dokazován prostřednictvím:

- `release-integrity.json`,
- živého `studio-manifest.json`,
- AI Studio `release-wave`,
- chráněného GitHub P5 / Safe Promotion / Pages deploy řetězce.

## Auto-patch E2E

1.3.47 je přijatý a nasazený baseline. 1.3.48 je první cleanup PATCH, který má projít standardním automatickým tokem Diferenciátor → live Pages verification → `app-updated` → AI Studio patch-only promotion.

## Neměněné oblasti

GARP 2.5.1/N5 tooling, GHRAB Platform 1.1.2, Studio Bridge v2, storage/data model, školní server PREP profil, pedagogické enginy a provider/model policy.
