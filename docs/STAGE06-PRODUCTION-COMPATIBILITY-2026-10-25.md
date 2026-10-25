# Stage06 production / Stage05 dependency cross-version audit
Date: 2026-10-25 (Czech local time)

## Current verified GitHub state
- Diferenciátor Stage06 is **already promoted and deployed** on production `main` commit `afc9a94156c37bc4fec26947f32491118a0d6476` via merged Safe Promotion PR #47. P5 run #40172975800 succeeded; deploy workflow #40173066804 succeeded. The production release identity remains 1.3.51.
- AI Studio production `main` is still `501d7086a94adf4d6f8abeb145efc81465fcfd8a` (0.21.253, Platform 1.1.2), whereas candidate is `5d5b55fadd0075b88d698c4cc2d3592ef93e8fc6` (Platform 1.1.3) and is not promoted, PR #305 is Draft.
- AI Studio production contains `src/integration/save-to-studio.js`, `src/library/library.js` with `?studioHandoff=1` and `G.takeHandoff('ai-studio')`, `G.validateMaterialPackage` and local `saveWorkspaceMaterial`. So its *basic receiving/saving workflow* already exists; the new Stage05 advanced material-flow controller and stronger inbound privacy gate do not exist on production yet.

## Critical compatibility matrix
| Direction | Sender | Receiver | Source status / operational claim |
|---|---|---|---|
| Diferenciátor -> Studio (basic My Materials) | Platform 1.1.3, app 1.3.51 | Platform 1.1.2, Studio 0.21.253 | Existing source structurally supports it; add executable mixed-platform replay/regression test; authenticated browser still NOT certified |
| Studio -> Diferenciátor | Platform 1.1.2, Studio 0.21.253 | Platform 1.1.3, app 1.3.51 | **Known old sender version-range bug:** Studio v1.1.2 validates target range against sender 0.21.253; with recipient range >=1.3.51 it fails to create. Must wait for Studio Platform 1.1.3 promotion |
| Studio candidate -> Diferenciátor | Platform 1.1.3, Studio 0.21.255 | Platform 1.1.3, app 1.3.51 | Unit-tested architecture, but **NOT** a live school-authorized 6/6 E2E certification |

The old Studio production 1.1.2 runtime JS Git blob SHA `d8a36f023e2930b0b3c0bb045e5ed6b2e464bd2a` is **byte-identical** to the read-only immutable `vendor/ghrab-platform-1.1.2/ghrab-platform.js` in Diferenciátor. Stage06 regression tests use that exact fixture, not an approximation.

## Release and safety decision
**Stage06 development: STARTED and code ALREADY DEPLOYED, on 2026-10-25.** Do not restart it or claim waiting for Stage05 is a prerequisite to begin developing it.

However, automated P5 and deployment success prove the package and pipeline, not a teacher's actual end-to-end handoff. To call the **whole Material Flow ecosystem released**, the school-authorized browser test must demonstrate import, privacy rejection, one-time consume and persistence for both directions after Studio is upgraded. Never bypass signed authorization, conceal missing UAT, or invent a success report.

Only add mixed-version regression test and documentation in this review change; no app runtime, school permit, production version or release workflow modifications. Keep subsequent test-review PR in Draft pending checks and do not re-deploy solely for a documentation/test change without a deliberate release decision.
