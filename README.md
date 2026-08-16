# Diferenciátor pracovních listů a testů

**Aktuální verze:** 1.3.31  

1.3.31 uzavírá nezávislý GARP audit 1.3.30: tracer bezpečně rozlišuje celočíselné dělení `//` od komentářů, chemický parser odmítá neexistující prvky a nejednoznačné rovnice, tisk čeká na hydrataci odborných vizuálů a blokuje jejich chyby, anotace respektují skutečný poměr stran a mapové presety jsou povinně zahrnuté v offline cache. Kritický bundle má novou rezervu bez zvýšení zmrazených performance budgetů.
**Platforma:** GHRAB Platform 1.1.0 · etapa P5


Samostatný repozitář aplikace pro Gymnázium, Ostrava-Hrabůvka.

- **Verze:** 1.3.31
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

`npm test` nejprve znovu sestaví `dist/`, ověří centrální profily Úsporný / Doporučený / Důkladný přes `qa:profiles`, fyzickými Chromium kliknutími ověří jejich propsání do Core requestu, spustí regresní brány včetně skutečných `qa:visuals`, `qa:scan`, `qa:stem`, rozšířeného `qa:all-subjects`, `qa:office-rich`, `qa:multimedia`, `qa:multimedia:browser`, `qa:specialists` a `qa:renderers` Chromium/PDF testů a zkontroluje PWA, bezpečnost, duplicity ID, manifest i interní testy. Test použije systémový Chromium/Chrome nebo prohlížeč nainstalovaný Playwrightem. Pokud na čistém stroji prohlížeč chybí, spusť jednou `npx playwright install chromium`.

### API kvóta a CI

V aktuální vývojové fázi **GitHub Actions nikdy nevolají Gemini API**. Push, pull request, P5 gate i GitHub Pages deploy používají pouze deterministické, browserové a lokální multimediální testy, takže spotřebují **0 Gemini requests** a nevyžadují žádný repository secret s API klíčem. Live provider smoke byl z CI i z package scripts odstraněn; případné znovuzavedení patří až do budoucí serverové/tierové fáze s vědomě nastaveným kvótovým rozpočtem.

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
