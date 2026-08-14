# Diferenciátor 1.3.25 — CI hotfix po prvním GitHub běhu

Datum: 2026-08-14

## Důvod

Čtyři workflow (`p3-quality`, `p4-release`, `deploy`, `p5-release-gate`) skončily na stejném kroku `qa:stem`. Samotné STEM vykreslení i generování PDF proběhlo, ale test extrahuje text z PDF externím příkazem `pdftotext`. GitHub runner tuto závislost neměl v projektu explicitně zajištěnou a původní test chybu `spawnSync` nehlásil; prázdný výstup se proto projevil pouze jako `pdf.ok=false`.

## Oprava

- všechny čtyři workflow s `qa:p5:ci` explicitně instalují `poppler-utils` a vypíší verzi `pdftotext`;
- `qa-stem-browser.mjs` používá společný helper `pdfText()`, který rozliší chybějící binárku, nenulový exit a skutečně prázdný/neshodný obsah PDF;
- regresní T28 kontroluje CI provisioning i diagnostiku `qa:stem`;
- aplikační kód ani release metadata se nemění, verze zůstává 1.3.25.

## Rozsah

Jde pouze o CI/toolchain stabilizaci. Není změněna funkce aplikace, modelové profily ani performance baseline.
