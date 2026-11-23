# Confirmed update — 0.9.19 (19) available in TestFlight

24 November 2026: normal-Mac uploader completed ARCHIVE SUCCEEDED and EXPORT SUCCEEDED; upload-succeeded.txt confirms 0.9.19 (19). Archived Info.plist verified. Apple TestFlight email to barisgur@gmail.com confirms this exact build is now available to test (message 1a20a9102b74b08d). Previous execution-session blockers below are historical; upload/distribution is now successful. Physical gameplay/Sandbox checks remain NOT RUN for this build.

# Release status — Cafeverse0.9.19 (19)

24 November2026. Candidate branch `release/0.9.19` includes performance commit `ad06292` and all shipped0.9.15 (18) StoreKit fixes. Supersedes the unpublished0.9.11 performance candidate. Main fetched successfully and still contains0.3.7; newer code was preserved.

## Completed

- **PASS** full `npm test`, exit0, including new performance regressions and all existing service/economy/Apple signature fixtures/account/audio/appearance/table/takeaway suites. Log: task outputs/release-0.9.19-19/npm-test.log.
- **PASS** central release config, package/lock, Debug/Release Xcode and rebuilt bundled Web all identify0.9.19 /19.
- **PASS** dedicated uploader shell syntax and archive identity guards. Prepared at task outputs/Cafeverse-0.9.19-TestFlight-Yukle.command. Separate output folder prevents an old success marker skipping this version.
- Existing measured gains retained: unchanged100 root replacements100→0; background/menu callbacks750→0; passive concurrent sync100→1; generated PNGs987588bytes smaller with unchanged filtered pixels/metadata/source hashes. Melo movement duration reduced25%. See PERFORMANCE_REPORT_0.9.11.md for measurement limits; same implementation, release identity changed.

## Distribution blockers

- **BLOCKED** actual Release archive attempted for0.9.19 /19, exit65. `sandbox-exec: sandbox_apply: Operation not permitted` prevents Swift macro plugins; `SwiftUIMacros.StateMacro` responds malformed. No successful signed archive or installable IPA was produced. Log: task outputs/release-0.9.19-19/archive-attempt.log.
- Distribution identities are visible in this turn, but that does not resolve the Swift plugin process restriction. Earlier normal Terminal launch failed with LaunchServices kLSNoExecutableErr; no normal-Mac upload is running from this session.
- GitHub CLI writes require an authenticated credential; connected fallback previously confirmed403 Resource not accessible by integration. Actual push result is recorded separately; no remote PR/merge success is assumed.
- **NOT RUN** Apple server acceptance/processing, group assignment and TestFlight email. Build19 absent from the local published ledger, but live App Store Connect uniqueness is unverified. Last confirmed shipped release remains0.9.15 (18).
- **NOT RUN** physical iPhone/Instruments, fresh Sandbox purchase/refund on candidate, actual frame rate/energy/leaks/thermal and30/60min wall-clock soak. Automated signed fixture tests are not live Sandbox purchases.

No production deployment, backend migration, wallet mutation, save reset, replacement artwork or security gate relaxation. Prepared uploader runs tests, Release archive, codesign and exact0.9.19 /19 checks before internal TestFlight export/upload. It cannot complete while the native build process remains blocked in this environment.

See QA_REPORT_0.9.19.md for phone acceptance checklist. Find release commit using `git log -1 --format=%H --grep='^release: prepare Cafeverse 0.9.19 build 19$'`.
