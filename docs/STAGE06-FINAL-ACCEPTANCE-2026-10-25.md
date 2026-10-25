# Etapa 06 – Diferenciátor: závěrečný integrační audit a akceptační protokol

**Datum:** 25. 10. 2026. **Zdroj zadání:** `06_DIFERENCIATOR_OUTBOUND_MATERIAL_FLOW.txt` (73 řádků). **Rozsah:** výstup Diferenciátor → AI Studio, zachování inbound, Material v1, Bridge v2, soukromí, UX a GARP. **Autorita:** verze skutečně ověřené z GitHubu, ne starší předávací texty.

## 1. Co již bylo skutečně vydáno

Diferenciátor `1.3.51`, produkční `main` SHA `afc9a94156c37bc4fec26947f32491118a0d6476`, byl úspěšně povýšen bezpečným [PR #47](https://github.com/Daniel22-dev/diferenciator/pull/47) a nasazen. [P5 main #40172975800](https://github.com/Daniel22-dev/diferenciator/actions/runs/40172975800) PASS, [produkční deploy #40173066804](https://github.com/Daniel22-dev/diferenciator/actions/runs/40173066804) SUCCESS.

- Viditelné tlačítko „Uložit do AI Studia“ u každého hotového pracovního listu v `src/js/26-ai-studio-outbound.js`.
- `src/modules/stage06-outbound-ui.js` po školní autorizaci používá jedině oficiální Studio helper `integration/save-to-studio.js`.
- `src/modules/stage06-outbound-material.js` vytváří jeden `ghrab-material-v1` z jedné zvolené varianty. Bezprostředně dostupné pedagogické metadatové položky: `title`, `subject`, `level`/ `yearGroup`, `objectives`, `sourceText`, `provenance`; strukturované `tasks=[]`, jelikož výstup obsahuje pouze volný text úloh, nikoli spolehlivě typovaný formát. Nic se nevymýšlí.
- Odpovědní klíče, poznámky pro učitele, projektový stav, API klíče, seznamy studentů a telemetrie nejsou kopírovány. Při textu s e-maily, aktivním HTML, nepřenositelnými médii nebo nadlimitním objemem dochází k bezpečnému odmítnutí.
- Původní příjem materiálu, generování pracovních listů, PDF, GARP, SW/PWA a AI Core jsou v oficiální produkční P5 bráně.

## 2. Důležitá změna zadání: Platform 1.1.2 → 1.1.3

Původní prompt výslovně požadoval „ZACHOVEJ Platform 1.1.2“. Aktuální Diferenciátor běží na `Platform 1.1.3` a Studio candidate používá tutéž verzi. Důvod: Platform 1.1.2 u **odesílatele** chybně kontrolovala verzi *cílové aplikace* proti verzi vlastní, takže Studio 0.21.253 → Diferenciátor 1.3.51 odmítá legitimní handoff. Ve verzi 1.1.3 se kontrola provádí vůči receiverovi. Změna je **zdokumentovaná architektonická odchylka**, nikoliv splnění původního bodu doslova. Bez výslovného schválení ji nelze označit za formálně odsouhlasenou.

## 3. Kontrola oproti požadovaným testům

| Test | Ověřený výsledek | Omezení |
|---|---|---|
| Outbound Material v1, varianty a soukromí | Diferenciátor P5 PASS; testy mapperu | Lokální validace není certifikace školního účtu |
| Tlačítko / potvrzení anonymizace / dostupnost u listu | Implementováno, jednotkové UI testy | Vyžaduje uživatelský browser UAT |
| Standardní Hub bez GIT/LUDUS URL | Implementováno | Studio řídí kompatibilní cíle až po vydání Hubu |
| Bridge v2 jednorázové předání, nesprávný cíl a checksum | PR #48 CI 22/22 PASS | Izolovaný runtime, ne skutečný prohlížeč školy |
| Diferenciátor Platform 1.1.3 → Studio produkční 1.1.2 | PR #48 skutečný verzovaný JS runtime PASS | Pokročilý Hub není v produkci |
| Studio produkční 1.1.2 → Diferenciátor 1.1.3 | Známá blokace `version-range` | Opraví až vydání Studio candidate 1.1.3 |
| Kompletní round-trip Studio 1.1.3 → Diferenciátor 1.1.3 → Studio 1.1.3 | Dodatečný test připraven ve zdrojovém PR #48 | CI výsledek ověřit na přesném commitu |
| PII guard, chybné/nadlimitní materiály, nepřenositelná média | Jednotkové testy a P5 | Uživatel musí ověřit reálný UX |

## 4. Reálný provoz a závislost na etapě 05

AI Studio `main` je stále `0.21.253` / Platform 1.1.2 (SHA `501d7086a94adf4d6f8abeb145efc81465fcfd8a`). Disponuje jednoduchým příjmem `?studioHandoff=1`, validací a uložením do Mých materiálů. Pokročilý Material Flow Hub etapy 05 je v `candidate` SHA `5d5b55fadd0075b88d698c4cc2d3592ef93e8fc6` s dvojím P5 PASS, ale [PR #305](https://github.com/Daniel22-dev/AI-Studio-GHRAB/pull/305) je stále Draft: chybí legitimně autorizované browser UAT do Generátoru, Diferenciátoru a LUDUS. Je tedy zakázáno zaměňovat úspěch jednotkových testů s reálným obousměrným Material Flow.

## 5. Podmínky vydání plné funkce

1. Oprávněný učitel se přihlásí standardním školním přístupem, žádné zadávání kódů do konzole.
2. Ověří se živě předání jednoho anonymního pracovního listu z produkčního Diferenciátoru do „Mých materiálů“ aktuálního Studia a kontrola obsahu, titulu, úrovně a jednorázového převzetí.
3. Až bude schválená etapa 05 a Studio Platform 1.1.3 na main, vykoná se plný round-trip Studio → Diferenciátor → Studio; negativní testy TTL, replay, PII, média, nadlimitní objem a falešný cíl.
4. Posoudí se UX na desktopu, telefonu a relevantním iPadu/Safari; vyhodnotí se, zda po uložení Studio skutečně informuje uživatele a nabízí kompatibilní cíle.
5. Bez konkrétního výsledku autorizovaného E2E, přesné produkční SHA a pedagogického schválení nelze podepsat celosystémovou akceptaci.

## 6. Rozhodnutí

- **Etapa 06 – implementace Diferenciátoru: DONE / nasazena.**
- **Automatické integrační testy: ověřené P5 a Bridge; rozšířený round-trip CI se dokončuje v revizní větvi.**
- **Celý obousměrný ekosystém: NO-GO pro formální dokončení** až do reálného autorizovaného testu a dokončení etapy 05.
- **Přechod na etapu 07:** vývoj izolovaně může začít hned; není správné předstírat, že etapa 06 má kompletní pedagogickou akceptaci.

Nedodávat reálné osobní údaje, klíče, obsah třídních seznamů ani autentizační údaje do GitHub testů či příloh. Změny nesmí narušit školní podepsanou přístupovou bránu.

