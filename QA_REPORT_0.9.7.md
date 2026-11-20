# 0.9.7 / 2026112002 — direct coin gifts

Replaces the ingredient-offer screen/menu with one coin gift flow: café code, amount, explicit confirmation. No recipient acceptance step. Recent incoming/outgoing gifts show separately by sign. Existing ingredient escrow can expire or be cancelled via the ownership-checked legacy endpoint; new ingredient trades are disabled on stage.

Only server-certified coins earned after this upgrade and gifts of those coins are transferable. Existing/imported/initial/purchased balances remain spendable but are not granted transfer provenance. New service earnings repay refund debt first. Recipient refund debt also absorbs incoming gifts before spendable/transferable credit. This prevents purchasing/refunding/forwarding the same value.

Implementation: server-owned giftable_coins column and private RLS ledger; parameterized authenticated endpoints; sorted account locks; one database transaction updates both wallets/allowances and ledger. Stable request IDs prevent duplicate credits after concurrent taps, retry or restart. Failed transactions roll back both accounts. Client reconciles a lost committed response from its own history.

Verification:
- npm test PASS: 75 PASS summary lines; not physical-device tests.
- Disposable PostgreSQL/PGlite tests cover earned-only allowance, paid exclusion, exact debit/credit, repeated ID, changed-payload replay, overspend race, opposite-direction locking, rollback, invalid/self/missing target, authenticated actor scope, private history/RLS, refund debt and actual game earning path. PGlite concurrency is serialized; hosted PostgreSQL CI recorded separately.
- Browser fixture: 25 coins sent, sender 100→75 and receiver 100→125, one history row; Turkish and English screens checked. All accounts/data are disposable local fixtures. Real accounts/devices NOT RUN.
- Stage migration earned_coin_gifts_stage applied; private client table privileges denied. Edge version 10 deployed with coinGifts=true; trades/iap/market/auctions/social=false. Existing public saves not altered.
- Native archive/TestFlight status is tracked separately in outputs/qa-0.9.7. Do not infer upload from source version.

## Verified CI and delivery limitation

Commit cb9f929 pushed to feature/coin-gifts-097; draft PR https://github.com/barisgur86/cafeverse-oops-cafe/pull/5 has four passing checks: native/test on push and pull_request. PR run 44636907921, native job 135957639716 and test job 135957640301. This is CI compilation, not a signed uploaded archive or physical-device acceptance.

Local Xcode window control timed out. The reviewed upload command was launched through Finder instead. Signed Release archive passed codesign deep/strict verification and bundled Web matched source. Apple upload and export succeeded on 20 November 2026 at 02:59:45 Europe/Istanbul. Apple processing and tester mail are separate verification steps. Terminal UI access was denied by the computer-use safety policy; only generated build/distribution logs were read. No passwords or keys were entered by the agent.

## Final TestFlight availability

Verified App Store Connect: 0.9.7 (2026112002) is in Gelistirici Testi, status Testing, expires in 90 days. Signed archive and upload PASS. This resolves the earlier local UI blocker through the reviewed Finder-launched upload script. Physical-device coin gift acceptance remains NOT RUN.


## Full regression — 20 November 2026; patched release 0.9.8

### Source identity

The shipped TestFlight build is **0.9.7 (2026112002)**, source commit `cb9f929f4ebd8cc44e87e0e8f7459de4f5cfa0e1`, branch `feature/coin-gifts-097`, PR #5. The signed archive Web SHA-256 is `decaf519ba39f8d68ff892972f1cb0f0d5a5811e6713d3451e31cd3356e75f94`. The subsequent documentation-only commits through `e33a9d879f2f5883be9ea5f55232caf31d23f1e2` changed no game/iOS/package source. Remote main was fetched and still reports **0.3.7**; it was not treated as 0.9.7.

The corrected candidate is **0.9.8 (2026112003)**, source commit `cd4ff83b133611b0aad3d404b5e8538e2f93b6b7`, branch `fix/097-full-regression`, based on the verified 0.9.7 source. Original 0.9.7 remains unchanged.

### Found and fixed

**FAIL before fix / PASS after fix:** main/walking Melo rendered only apron overlays, and the reference service illustrations rendered no equipped cosmetics. Wardrobe head/face selections therefore did not carry into those screens. A shared allowlisted head/face/apron renderer now serves the main moving sprite and table/takeaway illustration overlays. Existing raster images, character positions, economy, save format and accounts were not modified. The new appearance regression failed against the baseline and passes with the patch.

Changed source: `source/public/appearance.js`, `iso-cafe.js`, `service-board.js`, `service-board.css`; added `tests/appearance-regression.mjs` and `tools/regression-097-browser.mjs`; updated package test script and version metadata in `package.json`, `package-lock.json`, `iOS/Cafeverse.xcodeproj/project.pbxproj`. Web content is generated by the existing build tool, never edited directly.

### Verification results

| Check | Result | Evidence and limits |
| --- | --- | --- |
| Baseline npm test | PASS | 75 PASS summary lines; `npm-test-baseline.log` |
| Patched final npm test | PASS | 76 PASS summary lines; `npm-test-final-098.log`; not a count of individual assertions |
| Native auth routing helpers | PASS | `auth-routing.log`; compiled Swift helpers, not live Apple login |
| Native audio gain helpers | PASS | `audio-native.log`; compiled Swift gain math, not audible hardware output |
| Wardrobe purchase/equip/main/walking/service | PASS | Isolated browser UI: crown, glasses, mint apron; screenshots 01/03/04/06 and shared renderer tests |
| Decor purchase reflected in café | PASS | Real purchase handler in disposable offline fixture, flower element present in main scene |
| Two called customers remain seated | PASS | One timed call hit + two misses produces two guests; both customer elements persist after seating |
| Three-product order restart at 2/3 | PASS | Actual preparation UI, reload at two ready products, same order restored, third product completes |
| Correct-table delivery / duplicate reward | PASS | Browser double activation credits once; server tests reject wrong-table/customer IDs and empty-table delivery |
| Independent takeaway | PASS | Browser counter order prepares/delivers without table tickets; one reward; existing takeaway artwork and same outfit |
| Restart persistence | PASS | Browser reload preserves look, decor ownership, coins, served count and service-order state; cloud fixture suites also pass |
| Audio 0/10/50/100 and mute | PASS | Actual browser AudioContext gains and OfflineAudioContext rendered PCM on three viewports, six result groups |
| Small iPhone / iPhone / iPad | PASS | 375×667 TR, 393×852 EN, 820×1180 TR; screenshots in browser-existing |
| Coin shop / gift / cloud / account security | PASS automated | Signature, duplicate transaction, refund debt, rollback, account isolation, gift provenance and cloud-recovery suites; no real money or user records changed |
| Existing images | PASS | Existing regression verifies 38 unchanged asset hashes and references; no asset files changed in Git |
| Simulator Release compile | PASS | `simulator-build.log` from normal Mac QA runner |
| Device Release compile | PASS | `release-build.log` from normal Mac QA runner; unsigned validation |
| Isolated Simulator install + launch | PASS limited | Newly created disposable device, native auth screen screenshot `simulator-launch.png`; no live account login/gameplay acceptance |
| Physical iPhone/iPad, real two-account gifts | BLOCKED / NOT RUN | Not exercised on physical devices in this run |
| Real Apple Sandbox purchase/cancel/pending/refund | BLOCKED / NOT RUN | IAP remains feature-flagged off pending Apple sales setup and acceptance |
| Production backend preflight | BLOCKED | Expected gate rejects missing Apple revocation production readiness; stage is not Production |

Evidence root: `outputs/qa-0.9.7-regression-20261120/` at the task root (outside the repository). Browser flow `results.json` contains nine PASS stages and states the synthetic setup / real UI-handler layer explicitly. Disposable local save fixtures provide spending balance and guest counts; no Supabase/live saves are used or altered by these browser checks. Browser reload is not physical iOS process termination.

Environment/harness attempts are retained, not relabelled as product failures: sandbox Chromium/Swift macro/Simulator calls were blocked; the reviewed normal-Mac runner passed browser and both builds. The first flow attempts omitted closing wardrobe preview and decor preview dialogs; the test now follows the actual close/return controls. The first Simulator runtime/device pair was incompatible; a compatible pair installed and launched. Its simulator data-migration warning did not prevent app launch; screenshot initially required selecting display 1, which succeeded. No credentials were entered by the agent.

### Release tracking

0.9.8 signed archive/upload is in progress; completion and App Store Connect availability must be verified independently. This report does not yet claim TestFlight delivery or an email. No production merge or production release was performed; the branch remains stacked on the pending secure-economy work.
