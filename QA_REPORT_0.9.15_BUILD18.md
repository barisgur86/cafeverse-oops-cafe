# Caféverse 0.9.15 (18) — responsive store finalization

24 November 2026. Build 17 tester availability was confirmed; new candidate is build 18, same marketing version. Existing graphics, account saves, balances and server-side financial rules remain unchanged.

Changes:
- Purchase completion now waits for durable verified server credit, then returns the credited result immediately. Native StoreKit finish runs in the background, still only after server/cloud acknowledgement. In-flight finish is coalesced per transaction, failures stay pending for automatic retry and duplicate callbacks do not re-credit locally or hydrate stale cached balances.
- UI wallet/success is available before a slow finish. Only the actual purchasing product shows the Apple connection state; all products no longer display a global Processing label. The real payment lock remains until purchase/credit completion. Afterwards unrelated packs and gameplay are available while the affected product waits for finish.
- Automatic recovery's short native-inventory phase is separated from background credit/finalization. Unrelated products are not disabled for the entire recovery task. No manual recovery button returns.
- StoreKit Product values from the catalog are reused for up to 120 seconds in the account-scoped native store; localized Apple prices and Apple confirmation remain authoritative. Before starting another purchase, native preflight recovers a same-account matching unfinished transaction, or returns a known deferred approval, rather than opening a duplicate payment.

Validation already completed: targeted checkout/recovery/account-isolation tests pass. New held-finish regression proves the purchase result resolves and unrelated pack can be bought without releasing the held finish; both grants remain once. While actual Apple purchase UI is pending, only that product has the connection label and repeated payment requests remain rejected. Isolated actual CafeStore class typecheck against iPhoneOS SDK/arm64 iOS16 target passed (store-typecheck.log, exit 0). No physical iPhone timing measurement is claimed; Apple confirmation/network latency cannot be eliminated by this code.

Full suite: task outputs/release-0.9.15-18/npm-test.log. Final result and signed archive/upload status recorded below after completion. Upload helper: task outputs/Cafeverse-0.9.15-Build18-TestFlight-Yukle.command, isolated build18 paths, exact version/build validation, automatic renumbering disabled.

Final automated result: complete npm test exit 0. StoreKit isolated typecheck exit 0; upload helper syntax and git diff checks pass. Physical-device latency and App Store UI response time remain NOT RUN.

Signed Release archive attempted with the normal configured team/profile; Xcode exited 65 because this tool session could not load the Cafeverse App Store Distribution provisioning profile. Its security utility also reported zero accessible signing identities and could not decode the previous archive's embedded profile. This session-level signing access failure is not evidence that the previously successful profile/certificate should be replaced. No new credentials were imported or signing controls disabled.

No successful signed archive, export, TestFlight upload, processing result or tester notification for build 18 is claimed. The prepared normal-Mac helper runs tests, archive/signature/plist checks and upload using the Mac user's existing signing session and separate build18 output markers. Latest previously confirmed available TestFlight build remains 0.9.15 (17).

## Distribution verified — 24 November 2026

Normal Mac archive/export/upload succeeded at 00:39:01 Europe/Istanbul. Archived CFBundleVersion is 18. Archived Web/index.html SHA-256 f344c8457e35755fc1d838bb75cca66f0f3e5a4bde1701844fbb92d3d37b1c2b exactly matches the tested generated web bundle. Apple's TestFlight email to barisgur@gmail.com at 00:42:23 confirms Cafeverse OOPS Cafe 0.9.15 (18) is available to test. This verifies tester access for that recipient; phone installation and perceived purchase latency remain unobserved.
