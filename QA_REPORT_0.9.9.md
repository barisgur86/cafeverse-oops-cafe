# Caféverse 0.9.9 — final stabilization QA

Date: 21 November 2026 (Europe/Istanbul).
Candidate: **0.9.9 / 2026112101**. Branch: `release/0.9.9`.
Code commit: `b3214bc037f2caffed1de994322e10e4e987fe9c`; QA artifact metadata correction: `f9d9050`.
**Disposition: HOLD. Not a verified final Release Candidate; not uploaded.**

## Baseline and changes
See QA_BASELINE_0.9.9.md. Remote main is still 0.3.7; newer 0.9.7–0.9.9 work was preserved.
- Invalid table coordinate arrays, NaN and Infinity now reject before movement instead of generating invalid actor coordinates. Existing prepare/serve finally blocks clear busy state on thrown errors. Does not invent delivery or grant a reward.
- Package, Debug/Release build and generated menu release identity are synchronized. Menu displays 0.9.9 /2026112101.
- Added real-engine one-hour virtual soak: 600 guests, three three-product tables and independent takeaway each round, readiness, restart, wrong-route and duplicate/replay checks.
- Browser gameplay output path/build metadata are configurable; catalog reports derive actual project identity instead of old hardcoded build.
- Existing read-only StoreKit preview remains; purchase/trade gates remain closed. No new paid or social feature enabled.

## Validation on this candidate
| Status | Check | Evidence / limits |
|---|---|---|
| PASS | Baseline npm test | task outputs/qa-0.9.9/npm-test-20261121.log, exit 0 |
| PASS | Final npm test | task outputs/qa-0.9.9/npm-test-20261121-final.log, exit 0; **80 PASS summary lines**, not 80 individual assertions |
| PASS | Regression red/green | invalid-coordinate test failed before fix (route-red.log), passes in full suite |
| PASS | 60-minute virtual engine soak | 600 customers, 180 three-product table orders, 60 packages; compressed simulated time, not 60 wall-clock minutes |
| PASS | Native auth routing / audio helpers | final/checks.tsv auth=0, audio=0; compiled helper tests, not complete iOS app |
| PASS | Local in-app browser smoke | four guests arrive/seat; four products reach 4/4; real UI service 462→702 coins/+140 XP; table empties; reload preserves 702/140; menu identity correct. Isolated localhost engine, no live user account. final/iab-smoke.txt and menu-build.png |
| PASS | Assets / save compatibility regressions | service-restore and appearance tests passed; no source/public/assets changes relative to baseline; no live save or economy reset |
| PASS | Diff whitespace | git diff --check |
| BLOCKED | Automated Chrome gameplay + 3 viewport suites | Chrome subprocess closed at launch in sandbox; tests did not reach application assertions. Previous-day PASS evidence is historical, not this build |
| BLOCKED | Xcode Simulator build | CoreSimulator unavailable and restricted process access; see final/simulator.log |
| BLOCKED | Xcode unsigned Release | sandbox-exec sandbox_apply Operation not permitted; SwiftUIMacros.StateMacro plugin unavailable. Subsequent immutable-self diagnostics are cascading macro failures, not independently confirmed source defects |
| BLOCKED | Signed archive/upload | prior /2026112004 failed codesign errSecInternalComponent. New candidate not archived/uploaded because native checks/access blocked |
| BLOCKED | GitHub push | terminal has no authenticated username; Desktop UI cgWindowNotFound / timed out |
| NOT RUN | New remote CI | candidate could not be pushed |
| NOT RUN | Native Simulator authenticated full 20-step UI flow | build unavailable; browser subset cannot substitute |
| NOT RUN | Physical iPhone/iPad smoke, audio routes, background/resume, two-device sync/gifts | no physical-device execution performed |
| NOT RUN | Apple Sandbox purchase/pending/refund for all three packs | IAP disabled; no real money or player balance tested |
| NOT RUN | Two real accounts / devices trade acceptance | trades disabled; previous earned-coin gifts remain distinct from premium coin transfer |

Evidence prefixes above: task `outputs/qa-0.9.9/` and `outputs/qa-0.9.9-final/`, outside repository.

## Coverage mapping (automated local scope)
- Customers/three tables/package/movement: customer-lifecycle, seating, simulation, service-orders, service-restore, service-soak.
- 2/3 preparation and restart: simulation, store-flow, service-orders; full three-product browser flow implemented in tools/regression-097-browser.mjs but this candidate run blocked at launch.
- Wardrobe/decor: appearance-regression, collections, offline, upgrades; current full native visual acceptance not run.
- Economy/JWS/replay/refund: secure-economy, apple-signature, store-delivery, store-catalog, release-gates; synthetic signed fixtures and local DB do not prove Apple Sandbox.
- Trades/atomicity: secure-economy, marketplace; local PGlite serializes connections; current multi-connection PostgreSQL CI not run.
- Cloud/account/isolation/migration: cloud-save, cloud-sync, secure-client, account-lifecycle/client, coin-gifts/client; local fixtures do not prove two live devices or deployed RLS.
- Audio/i18n/layout: audio, i18n and compiled audio helpers passed; current responsive browser suite blocked. Only desktop-size IAB smoke completed.

## Files changed
`iOS/Cafeverse.xcodeproj/project.pbxproj`, `package.json`, `source/public/screens.js`, `source/public/service-state.js`, `tests/customer-lifecycle.mjs`, `tests/service-soak.mjs`, `tests/release-identity.mjs`, `tools/build.mjs`, `tools/regression-097-browser.mjs`, `tools/store-catalog-browser-qa.mjs`; baseline/report/status documents.
Existing PNG/SVG/audio assets unchanged. No schema/migration changes required for these source changes; no deployed database writes performed.

## Git and distribution
Code committed locally. Push attempted and failed due missing authentication. Existing **PR #7** https://github.com/barisgur86/cafeverse-oops-cafe/pull/7 covers the prior /2026112004 source, **not this new commit**. New branch PR not created; merge and v0.9.9 stable tag deliberately not performed while gates remain unresolved. No TestFlight processing, tester distribution or email success claimed for /2026112101.
Reviewed upload runner updated at task outputs/Cafeverse-0.9.9-TestFlight-Yukle.command; checks build identity and uses separate release-0.9.9-2026112101 output to prevent stale success reuse. Normal-Mac QA runner: outputs/Cafeverse-0.9.9-Final-QA.command. Runner preparation is not execution success.

## Open issues and 1.0.0 gates
P0 release gates: authenticated push/CI; current signed/native builds and full native gameplay; real Sandbox signed transaction/refund acceptance; deployed authorization/RLS verification and two-account/device isolation/sync; trade acceptance before enabling trades. No confirmed failing local service assertion remains, but blocked UI/native paths prevent a stability guarantee.
P1: physical audio/background/resume, iPhone/iPad visuals, full wardrobe/decor scene checks and full native 20-step scenario; stable release merge/tag/distribution.
P2: Apple-side processing/email and beta notes after upload; remaining production privacy/review/support readiness must be checked rather than inferred.
1.0.0 production remains separately authorized for 1 December 2026; nothing was submitted to production.
