# Caféverse 0.9.15 (17) — automatic purchase recovery

Build 16 tester availability was verified by Apple's email. Candidate build 17 retains marketing 0.9.15 and records build 16 as published. No data or artwork reset.

## Changes

Removed the manual Check purchases button and its explanatory text from the store. Recovery runs on store open, initial feature-ready startup, foreground/visibility/focus/pageshow, online connectivity and StoreKit updates. Native/JS payment locks and transaction idempotency remain.

Catalog loads and renders before awaiting recovery. It therefore does not stay on the catalog loading screen while receipt recovery waits. Panel remains closable during finalization; durable balance updates precede native finish as in build 16.

Native account-scoped payment intent journal records requested/approval states before/after StoreKit results and survives relaunch. Verified receipt discovery clears the corresponding intent. Complete native pending inventory v2 includes verified receipts, approval products and unresolved products.

Legacy product-only UI flags are retired only when complete native inventory has no corresponding receipt/intent, there is no known JS deferred approval, the authenticated server save confirms a credit for that product, and account/payment generation remains unchanged. A bounded account-local audit is written first. No Apple transaction is cancelled/finished by this cleanup and no coins are added or removed. Later genuine approval is still handled by the verified transaction pipeline. Missing proof, known approval, unresolved native intent, incomplete inventory, offline errors or account switches preserve the flag. One bounded follow-up handles unrelated legacy state after a receipt successfully finishes without another tap.

## Validation

PASS full npm test exit 0: task outputs/release-0.9.15-17/npm-test.log. New store-auto-recovery test exercises absent button, products visible during held native recovery, automatic focus/online handling, legacy 750 cleanup/audit without economic writes, incomplete protocol/no proof/real approval/unresolved/errors/account switch preservation, and bounded post-delivery follow-up. Existing signed JWS/OCSP, atomic purchase, native-finish ordering, service/table/package and save regressions pass.

PASS isolated CafeStore Swift typecheck with real iPhoneOS SDK, arm64 iOS16 target, exit 0: task outputs/release-0.9.15-17/store-typecheck.log. This is the actual extracted StoreKit class; it is not a full app build or a physical payment test.

PASS upload helper zsh syntax and git diff check. BLOCKED full signed Release archive: Xcode exit 65, sandbox_apply Operation not permitted and SwiftUI StateMacro plugin-server malformed response. Log: task outputs/release-0.9.15-17/archive-agent.log. No archive/export/upload, Apple processing, tester email or physical iPhone UI success for build 17 is claimed.

Normal Mac handoff: task outputs/Cafeverse-0.9.15-Build17-TestFlight-Yukle.command performs full tests, exact build check, Release archive, signature/plist checks and TestFlight upload, using independent build17 output/success markers and no auto-renumbering. Current installed build16 does not contain these changes until the new binary is uploaded and installed.

## Verified distribution — 24 November 2026

Normal Mac signing/archive/upload succeeded: archive.log ARCHIVE SUCCEEDED; upload.log Upload succeeded / EXPORT SUCCEEDED at 00:06:22 Europe/Istanbul. Archived CFBundleVersion is 17; archived Web/index.html contains no manual recovery button. Apple's email to barisgur@gmail.com at 00:08:05 confirms Cafeverse OOPS Cafe 0.9.15 (17) is available to test. Physical installation and automatic legacy-flag cleanup on the user's iPhone remain unobserved.
