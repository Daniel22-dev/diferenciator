# Diferenciátor 1.3.15 — modelové profily / GARP review

Datum: 2026-08-14

## Výchozí referenční stav

Korespondenční asistent 5.10.4 byl před touto úpravou znovu ověřen z čistého ZIPu. Prošel buildem, interními testy, GHRAB AI Core/Platform konformitou, UI testy a fyzickým Chromium click-through testem profilů `economy / balanced / quality`. KS 5.10.4 je proto použit jako referenční vzor modelových profilů.

## Změna v Diferenciátoru

- UI používá pouze `◇ Úsporný / ⚡ Doporučený / ★ Důkladný`.
- Aplikační stav ukládá pouze `economy / balanced / quality`; staré uložené Gemini modely se migrují na profil.
- `modelOverride` byl odstraněn. Core request dostává pouze `modelProfile`.
- Direct runtime mapuje profily na tři aktuální Gemini modely a jako providerový fallback používá úsporný model, stejně jako referenční KS.
- School-server runtime je provider-neutrální a klient neobsahuje mapování OpenAI/Gemini modelů.
- Všech šest operací dovoluje všechny tři profily.
- Přidána statická profilová brána a browserová regresní zkouška s fyzickými důvěryhodnými kliknutími (`event.isTrusted === true`).

## Automatické ověření

- GHRAB Platform conformance: 109/109 PASS.
- `qa:profiles`: 17/17 PASS.
- `npm test`: 94/94 interních testů PASS + browser click-through profilů PASS.
- `qa:quality`: 31/31 PASS.
- `qa:browser`: PASS.
- `qa:xss`: PASS; sink inventory beze zhoršení proti baseline.
- `qa:lock`: PASS.
- Error reporter: 56 PASS / 0 FAIL; jeho URL browser část je v tomto runneru NOT_READY kvůli spravované Chromium URLBlocklist.
- School-server build: PASS; CSP `connect-src 'self'`, provider-neutrální runtime.
- School profile browser click-through: PASS pro economy / balanced / quality a provider-specific API-key blok je skrytý.

## Omezení prostředí

`qa:runtime` nelze v tomto OpenAI runneru dokončit, protože Chromium blokuje navigaci na lokální HTTP testovací server (`net::ERR_BLOCKED_BY_ADMINISTRATOR`). `qa:axe` je zde `not-ready-environment`, protože přesná lokální instalace `axe-core 4.12.1` není v runneru dostupná. Tyto dvě položky proto nejsou důkazem chyby aplikace, ale ani se nezapočítávají jako PASS.

## Release verdict

**RC / připraveno k živému smoke testu.** Pro finální GO je ještě vhodné na skutečně nasazené serverless verzi ověřit reálné Gemini volání každým ze tří profilů, import PDF/obrázku, řešení, kontrolu kvality a privacy preflight.
