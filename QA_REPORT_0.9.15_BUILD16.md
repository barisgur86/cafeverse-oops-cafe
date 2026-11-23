# Caféverse 0.9.15 (16)

23 November 2026. Candidate includes current table/package occupancy, original three-press balloons, server-verifier compatibility fixes and purchase phase labels. Previously available Build 15 is recorded in released-builds.json; build 16 is synchronized across central config, packages and both iOS configurations.

New client behavior: show server-confirmed coin balance and credited/finalizing state before waiting for StoreKit finish. Keep actual deferred approval, unknown legacy cache and credited finalization distinct. Unknown cache is retained conservatively; an empty unfinished list does not prove Ask to Buy is absent. The player may close the store panel while native finalization waits; the payment lock and background delivery remain active. No fake finish, repeated grant or balance reset.

PASS full npm test, exit 0: task outputs/release-0.9.15-16/npm-test.log. New slow-finish fixture verifies balance 100->2100 before finish, finalizing label, closable panel, retained payment lock and finish once. Existing checkout, server cryptography/OCSP, ownership, service/counter and save regressions pass. Upload helper zsh syntax and git diff checks pass.

BLOCKED signed Release archive: xcodebuild attempted generic/platform=iOS with configured signing; exit 65, sandbox_apply Operation not permitted, SwiftUI StateMacro plugin-server malformed response. Log: task outputs/release-0.9.15-16/archive-agent.log. No signed archive/export/upload/processing or tester email for build 16 is claimed. Physical phone UI and StoreKit native finish not observed in this session.

Prepared normal-Mac helper: task outputs/Cafeverse-0.9.15-Build16-TestFlight-Yukle.command. Runs tests, exact version/build guard, Release signing, archive codesign/plist validation and upload using the existing Xcode account. Separate output/success markers; automatic version renumbering off. Apple processing/internal group availability still require post-upload confirmation.

Server-only fix already deployed as cafe-secure-stage v20. Real Sandbox transactions for 250,750,2000 were previously verified credited once each; last observed balance 3137. This is evidence for server delivery, not physical validation of the new Build 16 UI.
