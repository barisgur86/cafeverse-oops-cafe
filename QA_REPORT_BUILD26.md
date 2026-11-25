# Build 26 — 26 November 2026

Marketing version **0.9.19**, configured iOS build **26** in both Debug/Release. Base: Build 25 source c17ca4e (feature 908080f), actual Apple tester availability confirmed 25 November 13:50:30 Istanbul. Current branch: fix/build26-visible-delivery-onboarding. Main fetched: 6634ae3; it still contains older sources and was not substituted for the shipped release.

## Animation root cause and fix

Build 25 retained a handoff DOM node but its CSS faded opacity from 1 to 0 during travel; accessibility reduced-motion changed the movement to 1ms. The existing DOM-presence test did not check painted opacity. Archived Build 25 table/pickup screenshots show this fade. New opacity regression fails against the saved Build 25 stylesheet and passes against Build 26.

The handoff stays opaque for one 700ms window with explicit stacking above scene/outfit. Targets in the portrait service coordinate space are table (470,735) and door customer (710,940). Existing drink artwork is cropped onto the existing tray; the bag uses existing takeaway artwork. No source image changed, deleted or regenerated. Reduced-motion uses a stationary handoff for the same visible window.

Status redraw during the handoff now updates text in place and never detaches/restarts the running visual, including fast rejection. Confirmation and animation completion remain independent. Fast success waits for the visual before reward presentation; delayed/lost results expose read-only status recovery, preserving order/request IDs. Original idempotent delivery and exact-receipt reward logic remains in place. The animation does not loop on network delay.

## New player hints

Only a newly created server save has explicit tutorial eligibility. Old saves without that field never enroll. Hints follow prepare → ready/serve → first confirmed reward, plus the first ready pickup at the actual door delivery button. Completed orders suppress replay. TR/EN controls include Skip tips; opt-out is account-scoped locally and idempotently persisted through authenticated /api/tutorial/skip, with no economy mutation. Account deletion removes only that account's hints/cache. Existing player progress and balances are not reset or merged.

## PASS — automatic / browser evidence

- Full npm test suite, including existing auth/cloud/StoreKit/coin-gift/economy/collection/decor/seating/service regression tests, Build 24 lost-response recovery and new Build 26 cases. New tests execute through existing npm test CI step.
- Three table targets and pickup: immediate handoff, same node retained until 700ms despite early confirmation, existing artwork present, correct targets, cleanup, rapid double tap, one settlement/reward. Fast rejection retains visual before check/retry. Existing delayed/lost request, timeout, close/reopen, exact UUID and no-duplicate reward tests pass.
- TR/EN onboarding prepare/serve/reward/pickup, skip/restart, legacy exclusion, account separation. Authenticated PostgreSQL fixture verifies persisted skip, repeated request and untouched other-player/balance.
- Connected Chrome at 375×667: 3 table and 3 pickup handoffs, 58–70 sampled frames each; all opaque with explicit foreground layer and correct arrival. Real tab reload after skip showed zero hints. This is local disposable browser gameplay, NOT physical iPhone.
- Native auth routing, iOS bridge/StoreKit typecheck, native audio gain/mute tests passed. These do not certify a full SwiftUI signed archive or audible phone output.
- Backend deployed as Edge Function revision 25 (not iOS build number); all 15 files downloaded and matched intended bundle. Only generated engine and economy changed; existing Apple validation/auth modules, JWT configuration and feature flags preserved. Health preflight passed; unauthenticated tutorial mutation returned 401. No live player/test purchase data mutated.

## Performance / economy: limited evidence

Synthetic Node history fixture (1,000 orders / 4,000 preparations, 20 reads): median 2.342 ms, p95 2.518 ms. No iPhone timing comparison is claimed. Re-ran deterministic first-20-minute economy simulation; results are in outputs/release-0.9.19-26/economy.json, with assumed input timing. No economy changes based on unmeasured physical play.

## BLOCKED / not performed

- Actual TestFlight/iPhone reproduction and three physical table + three physical pickup deliveries; no physical video. CoreDevice enumeration timed out after 10 seconds. Browser output is not a substitute for physical acceptance.
- Two real accounts/devices: Apple/email registration and verification, recovery links, cloud migration/relogin/second-device balances, actual visits and trade. Existing synthetic account/security tests passed. Ingredient trade stays disabled pending real validation.
- Actual Apple Sandbox purchase, cancellation, pending approval and interrupted delivery on phone. No real starting/package/ending balances to report. Transaction signature, ownership, deduplication and replay tests passed automatically.
- Same-iPhone performance comparison and real new-account 20-minute play.
- Spawned Chrome/video runner failed in the agent sandbox (SIGABRT); connected Chrome fallback acceptance passed. No MP4/WebM for Build 26 was produced.
- Full unsigned Release compile attempted and failed because sandbox-exec denied SwiftUI macro plugin execution; subsequent State/self compiler errors follow that initial failure. Native bridge tests passed. No signed Build 26 archive or archived CFBundleVersion verification is claimed.

## TestFlight release gate

The request explicitly requires visible animations on a real iPhone before archive/upload. This condition is not verified, so Build 26 was **not uploaded**. Build 25 remains the last confirmed distributed release. CI and the prepared upload helper now stop unless a Build-26-specific physical-device acceptance record documents device/OS/video, three table and three pickup deliveries, fast/delayed results and one reward on double tap. Validation fixtures do not create such a record.

Prepared normal-Mac QA and gated upload helpers are outside the repository under task outputs. The upload helper independently checks the signed archived Info.plist equals 0.9.19 / 26 when the gate is eventually satisfied. No release ledger entry was added for unuploaded Build 26.

## Files / delivery

Gameplay: service-board.js/.css, iso-cafe.js, online.js, onboarding.js/.css, play.html, account-cleanup.js. Server: offline-runtime.js and secure/economy.mjs; no schema migration. Tests: build26-acceptance, service-device-gate, account-client, secure-economy, adjusted failure timing in service-delivery/build24-acceptance. Tooling: browser painted-frame assertions, local disposable QA harness, physical acceptance validator, TestFlight workflow gate. Version: release.json and Xcode project; package test list updated.

Commit/push/PR status will be recorded after local commit and remote verification. Physical acceptance and TestFlight distribution remain blocked regardless of GitHub delivery.
