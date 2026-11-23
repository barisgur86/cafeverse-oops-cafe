# Cafeverse 0.9.11 — release candidate report

Date: 23 November 2026. User superseded 0.9.10 with **0.9.11 /2026112302**.
Branch: release/0.9.11. Main implementation commits: 1e9b34b, 5426304, 9ee7ab9, 178a28b; Sandbox authorization/config: ff559a70414320d6747597e6b24818ee098ee9e1.
**NOT UPLOADED. Not declared stable.** Last verified TestFlight build remains 0.9.9 /2026112201 (0.9.9.1 label).

## Implemented
- Dynamic table service uses existing cafe-interior, table, customer and character assets. Actual 1/2/3/4 party members carry the same IDs as the main scene. A two-person service no longer shows a baked four-person picture.
- Capacity, guest count and ordered items/quantities are separate. Duplicate recipes aggregate quantities; every ordered line produces one icon. Optional guestCount/guestIds support two guests ordering three products, while legacy orders retain their previous definition. Preparation/settlement identity remains bound to order/table/line; no economy reset.
- Main seated/departing and board counts use real party size; restored boards account for guestCount. Shared service readiness, wrong-table rejection and single settlement preserved.
- Central release.json drives package, lockfile, both Xcode configurations and generated UI version. Pre-build/CI consistency check rejects known published/non-increasing builds and existing build tags. Apple history/uniqueness was not independently queried today; the ledger is not a substitute for Apple verification.
- StoreKit direct-call preflight rejects a disabled device, disconnected state, unknown product and an already-pending pack. Clearer disabled store wording replaces the ambiguous test-approval label. Server transaction verification and durable credit-before-finish unchanged.
- User explicitly said “aç artık / test edelim”; Sandbox purchase testing was enabled on isolated cafe-secure-stage, with AppleVerifier fixed to Sandbox. Production JWS remains rejected. This supersedes the earlier request to leave this test gate closed. Trades/market/auction/social remain disabled.

## Tests / verification
| Status | Check | Evidence and limits |
|---|---|---|
| PASS | Baseline npm test | task outputs/qa-0910-baseline.log; npm CLI restored from official registry after stale /tmp path was missing |
| PASS | Final npm test | task outputs/qa-0911.log; exit 0, **87 PASS summary lines**, not 87 individual cases |
| PASS | Guest/order regression | service-presentation, service-restore, service-orders: exact 1–4 rendered guest IDs, quantities/icons, two guests/three products admission, wrong-table and duplicate settlement rejection |
| PASS | 60-minute virtual engine soak | existing suite: 600 guests, 180 table orders and 60 packages, reload/replay; compressed virtual time, not a physical 60-minute run |
| PASS | Wardrobe/decor/save/cloud/account/audio local regressions | existing appearance, collection, upgrade, audio, i18n, account/cloud suites; does not prove native visual/audio or two physical devices |
| PASS | Apple crypto / secure economy targeted rerun | qa-0911-apple-signature.log and qa-0911-secure-economy.log; signed fixtures/private temporary roots and PGlite, not actual Apple payments |
| PASS | Native helper checks | qa-0910/auth-routing.log and audio-native.log; compiled routing/audio helper logic, not full app |
| PASS | Stage deployment | v13 ACTIVE, health ready=true, environment Sandbox, iap=true, coinGifts=true, other economic flags false |
| PASS | Unauthenticated API | GET /api/me returns 401; no account accessed |
| PASS | Deployed DB metadata | nine stage tables RLS=true; anon/authenticated direct table privileges=false; no row contents read or changed |
| PASS | Asset preservation | 38-file SHA-256 inventory at task outputs/qa-0910/assets.json; no existing assets changed |
| BLOCKED | Current Chrome UI automation | subprocess closed at launch under sandbox; no current responsive/visual UI PASS claimed |
| BLOCKED | Simulator/current Release/Archive | CoreSimulator connection invalid; sandbox_apply Operation not permitted prevents Swift macro plugin; current 0.9.11 archive attempted, qa-0911-archive.log |
| BLOCKED | Push / PR | CLI has no authenticated username; GitHub integration create_branch returned 403 Resource not accessible by integration; desktop computer-use tool unavailable in this turn |
| NOT RUN | New remote CI / stable merge/tag | branch could not be pushed; no v0.9.11 release tag created while gates unresolved |
| NOT RUN | Actual Apple 250/750/2000 purchase/refund/pending | catalog/prices demonstrated by user's iPhone screenshot; payment acceptance is pending user device test. Enabling Sandbox does not mean acceptance passed |
| NOT RUN | Physical device / two real accounts / 20-step native UI | no physical-device execution or authenticated Simulator scenario performed |
| NOT RUN | 0.9.11 TestFlight processing / mail | signed archive/upload unavailable; no success claimed |

All evidence paths above are relative to task root outputs, outside the repository. Earlier v10 artifacts are development checkpoints, not shipped v0.9.10.

## Backend / security
Retrieved current stage function and compared every dependency: only tested shared engine changed; wrapper/auth/payment libraries remained unchanged. Deployed v11 then v12 for party handling, then v13 solely to enable user-authorized Sandbox IAP. No schema migration was necessary (optional JSONB save fields); no player rows, balances or accounts were modified by agent tests/deployment. Rollback source snapshot is task outputs/qa-0910/deployed-source.json. JWT platform flag remains the prior false value; handler still authenticates user JWTs before all account/economy operations.

Advisors: no-policy INFO on private stage tables is consistent with direct client grants denied. The legacy public cafe_cloud_push SECURITY DEFINER function explicitly requires auth.uid(), pins empty search_path and scopes updates to that uid; warning is documented, not silently removed. See [Supabase definer advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Leaked-password protection is disabled; account owner configuration remains outstanding: [password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No security grants widened.

## Changed files
release.json, released-builds.json, package.json, package-lock.json, Xcode project, tools/release-version.mjs, tools/build.mjs, CI/testflight workflows; offline-runtime.js; service-state/board/CSS and iso-cafe.js; coin-shop.js/i18n.js; service/order/version/store tests and browser QA runners; baseline/report/changelog/versioning/status docs. Generated iOS Web and server engine are built through tools, not hand-edited. No new bitmap or replacement asset generated.

## Open gates
P0: actual three-package Sandbox purchase/refund/pending/recovery acceptance; current signed/native full gameplay and 0.9.11 TestFlight delivery; two-account/device sync and authorization acceptance. P1: current iPhone/iPad visuals, physical sound routes/background-resume, legacy cloud/password security review. P2: operator confirmation of full Apple build history, final stable merge/tag and production review metadata.

Prepared task outputs/Cafeverse-0.9.11-QA.command and Cafeverse-0.9.11-TestFlight-Yukle.command. Uploader runs version consistency and full tests before archive, targets 0.9.11/2026112302 and uses a separate output directory, so older success markers cannot masquerade as this release. Running it in the normal Mac session is still required; file preparation is not upload success.

1.0.0 production has not been submitted; separate production approval remains required.
