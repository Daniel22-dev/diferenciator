# Stage06 producer dependency: GHRAB Platform 1.1.3 (2026-10-25)

**Status:** isolated review only. Diff release version remains 1.3.51 on this branch; do not deploy without controlled version bump and full P5.

### Why Stage06 cannot ship using Platform 1.1.2
The shared Platform v1.1.2 `createHandoff()` validates the *target* versionRange against the *sender's* appVersion during creation. Differentiator 1.3.51 -> Studio 0.21.255 (`>=0.21.6 <1.0.0`) is rejected with `version-range` before the Studio helper can navigate. The same root cause blocks Studio Stage05 producer handoffs.

### Dependency fix
- Adopt **immutable vendor GHRAB Platform 1.1.3** (source hash `97972aa79fa420e10549b16a46a59d8a99fd13d066b037a2d2fd56e537b225c4`, 58,421 bytes), byte-identical to Studio's review PR #312. Original 1.1.2 is untouched for rollback.
- Patch only semantic target-version validation so it executes on the receiver (`appId === packet.target.appId`). Sender still validates packet schema, size, expiry, target, checksums and pending.
- Update `ghrab-platform.consumer.json` and source platform-manifest to 1.1.3.
- Add direct runtime test `tests/stage06-bridge-cross-app.test.mjs` for real vendored JS: both cross-version directions, incompatible receiver, pending protection, checksum and one-time consumption.
- Existing Stage06 mapper and UI tests remain (16 tests). No GARP guards or signed permits disabled.
- Independent Stage06 PR-only lightweight CI runs Node tests and verifies immutable SHA256 manifest; full P5 still required before promotion.

**Blocking release dependency:** Studio Stage05 platform PR #312 must be proven and integrated in the correct order, then its candidate updated and real authorized E2E completed. Stage06 must not be promoted while Stage05 hub is not released/available. Do not bypass GitHub main/candidate policy.
