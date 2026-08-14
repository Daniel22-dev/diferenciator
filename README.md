# Diferenciátor pracovních listů a testů

**Aktuální verze:** 1.3.14  
**Platforma:** GHRAB Platform 1.1.0 · etapa P5


Samostatný repozitář aplikace pro Gymnázium, Ostrava-Hrabůvka.

- **Verze:** 1.3.14
- **Doporučený název repozitáře:** `diferenciator`
- **GitHub Pages:** `https://daniel22-dev.github.io/diferenciator/`
- **Vlastník:** Daniel Baláž

## Nahrání na GitHub

Obsah tohoto balíčku nahraj přímo do kořene nového repozitáře. Složky `.github`, `src`, `scripts` a `dist` musí být přímo v kořeni, nikoli uvnitř další složky.

V **Settings → Pages** nastav **Source: GitHub Actions**. Každý push do větve `main` provede build, interní testy a nasazení.

## Lokální kontrola

```bash
npm ci
npm test
```

`npm test` nejprve znovu sestaví `dist/`, spustí regresní brány, zkontroluje verzi PWA, bezpečnostní bránu, duplicity ID, manifest a interní testy aplikace. Test použije systémový Chromium/Chrome nebo prohlížeč nainstalovaný Playwrightem. Pokud na čistém stroji prohlížeč chybí, spusť jednou `npx playwright install chromium`.

## Struktura

```text
src/                    editovatelné zdroje aplikace
scripts/build.mjs       sestavení jednosouborového index.html
scripts/test.mjs        release testy nad dist/
dist/                   hotový web pro GitHub Pages
.github/workflows/      automatické nasazení
```

## Přechod ze společného repozitáře

Po nasazení změň v AI Studiu GHRAB adresu aplikace a manuálu na nové URL uvedené výše. Starý společný repozitář nemaž dříve, než ověříš otevření aplikace z AI Studia, předávku materiálu, PWA aktualizaci a nový manifest.

API klíče ani skutečné údaje žáků nepatří do repozitáře.
