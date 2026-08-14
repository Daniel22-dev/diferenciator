# Diferenciátor pracovních listů a testů

**Aktuální verze:** 1.3.25  

1.3.25 je cílený GARP follow-up po auditu 1.3.24: sjednocuje multimodální timeout na 120 s, opravuje pořadí profilů AI tak, aby Důkladný byl skutečně nejsilnější, přidává kompatibilní thinking guard pro Gemini 3.7, odstraňuje duplicitní text ročníku a potvrzený mrtvý kód. Funkční rozsah 1.3.20–1.3.24 zůstává beze změny a výkonová baseline z 1.3.24 zůstává zmrazená.
**Platforma:** GHRAB Platform 1.1.0 · etapa P5


Samostatný repozitář aplikace pro Gymnázium, Ostrava-Hrabůvka.

- **Verze:** 1.3.25
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

`npm test` nejprve znovu sestaví `dist/`, ověří centrální profily Úsporný / Doporučený / Důkladný přes `qa:profiles`, fyzickými Chromium kliknutími ověří jejich propsání do Core requestu, spustí regresní brány včetně skutečných `qa:visuals`, `qa:scan` a `qa:stem` Chromium/PDF testů a zkontroluje PWA, bezpečnost, duplicity ID, manifest i interní testy. Test použije systémový Chromium/Chrome nebo prohlížeč nainstalovaný Playwrightem. Pokud na čistém stroji prohlížeč chybí, spusť jednou `npx playwright install chromium`.

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
