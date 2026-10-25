# Stage 06 — Diferenciátor outbound material flow (PREPRODUCTION REVIEW)

**Date:** 2026-10-25. **Parent:** Differentiator `main` SHA `a45e6472a4b15fdbe2b6c2b403624c6bf076dc1c`, version 1.3.51. **Status: isolated review branch, no deployment.**

## Original requirement
`06_DIFERENCIATOR_OUTBOUND_MATERIAL_FLOW.txt` (2026-09-30): add a teacher-visible outbound action via AI Studio Hub, retain existing inbound `studioHandoff`, PWA/PDF/GARP/Platform/AI Core, and prohibit proprietary direct connections to Generator or LUDUS.

## Source-reviewed mapping
- The generated `.sheet` is managed by `src/js/40-vystup-pdf-kvalita.js`. Its `_text` is authoritative student-facing text, with `_parts.tasks` only a freeform **string**, not typed selectable tasks. A separate answer key is in `_key` and `_parts.answerKey`; media in `_visualAssets`/`_mediaSource`.
- A new per-sheet secondary action is attached from `attachSheetTools(sheet)` **only after a real worksheet exists**.
- Each transfer builds ONE canonical `ghrab-material-v1` with `sourceText=sheet._text`, `tasks=[]`, teacher-provided subject/topic/objective/optional CEFR and class/year group. It is always `ai-draft` unless separately reviewed in Studio.
- **No answer key, student roster, teacher note, project state, API key, telemetry, embedded visual or media payload** is put in the material. Nonportable media references, active markup, personal-email identifiers, unsupported source, oversized material and untrusted origin are refused rather than silently altered. Teacher expressly confirms anonymization before the handoff.
- The producer uses the canonical **Studio-hosted** `integration/save-to-studio.js` helper (Bridge v2); this helper performs an additional privacy/size gate, pending handoff check and trusted same-origin route to `library/?studioHandoff=1`. Studio's registry determines later targets. No direct routes to other consumers.
- UI action checks the actual `__GHRAB_STUDIO_ACCESS__` signed school permit before prompting. App runtime remains inside the pre-existing protected-script bundle. The prior inbound `25-ai-studio-bridge.js` is left untouched.
- New ESM mapper is included in mandatory service-worker core assets, because the existing `scripts/sw-assets.mjs` rejects unlisted specialist modules.

## Tests performed in an isolated Linux Node 22 environment
- `node --test tests/stage06-outbound.test.mjs tests/stage06-ui.test.mjs` — **16 PASS / 0 FAIL**.
- Includes whitelist-only material mapping, anti-key leakage, explicit privacy consent, empty-content and oversize rejection, single tier, no fabricated tasks, media/XSS/PII rejection, HTTPS/same-origin trusted Studio path, localhost only for HTTP, button accessibility and UI fail-closed without school permit or while editing.
- `node --check` on both new modules — PASS.
- A local headless Chromium smoke experiment was attempted but **timed out** due to container browser/system environment. There is **NO live browser E2E certificate**. Network access to GitHub pages was unavailable in the execution container.

## Production gates / known limitations
1. **Stage 05 AI Studio is still NOT on production main.** Studio candidate `f4404790...` passed P5 twice but failed to obtain the required 6/6 genuine authorized consumer UAT evidence. No signed permit is available to this assistant; do not bypass access or misrepresent blocked real UAT as PASS.
2. This branch is **development code, not a release**. It retains Differentiator's published 1.3.51 identity for review. Before candidate/main promotion, bump and synchronize all app versioned artifacts (including service worker, Platform/GARP manifest) through the official release tooling.
3. Run full Differentiator build and its offline/SW, GARP2.7, Platform 1.1.2, signed permit, PDF, AI Core, mobile/tablet and browser P5 gates on an exact integrated SHA. Node mapper and mocked UI tests alone do not certify the full app.
4. Perform a **real signed-session round trip**: released Studio -> Differentiator inbound (unchanged) -> new Save to Studio -> Studio My Materials persistence -> another allowed consumer. Check one-time consume/TTL, cross-origin, pending cancel, duplicate save and personal-data rejection.
5. Confirm Studio's canonical hosted helper exists at the approved published mount before enabling the button for production. Do not bundle an unofficial duplicate Bridge implementation.
6. No direct merge/deploy to Differentiator `main` or AI Studio `main` until those release conditions and human review have passed. GitHub Actions budget constraints should be respected; run local tests first.

**Decision: GO for isolated Stage06 implementation/review. NO-GO for production promotion.**
