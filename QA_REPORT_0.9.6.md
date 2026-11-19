# 0.9.6 — trade beta / 20 November 2026

Build: 2026112001. Internal TestFlight candidate; not a production release.

## Changes
- Connect the iOS game to the authenticated isolated authoritative test backend; ingredient trades enabled there. IAP, market, auctions and social remain disabled.
- First use reads only the authenticated account's existing public cloud backup through a server-owned, parameterized reader. New authoritative state is stored in the isolated schema; legacy backups are not overwritten. Subsequent opens use the authoritative record without repeating import.
- Client migration protection keeps a recovery copy and refuses to overwrite newer/different local progress. Such a conflict requires review; no client wallet upload bypass was added.
- Includes purchase recovery isolation and fail-closed direct purchase entry fix.

## Verification
- npm test: PASS, 73 PASS summary lines (not 73 device tests).
- Added deployment-reader regression: own-account backup only, exact wallet/inventory preserved, source and other account unchanged, retry never resets progress.
- Signed Xcode GUI Release archive: PASS; 0.9.6 / 2026112001, bundled Web matches source; codesign deep/strict PASS.
- CLI build: BLOCKED by sandbox Swift macro/plugin process restrictions; GUI archive succeeds.
- Stage edge version 9: ACTIVE; health ready=true, trades=true, other paid/social flags=false. No live player data modified by test execution.
- Physical two-device/two-account trade acceptance: NOT RUN. Apple purchase/refund: NOT RUN. Apple revocation credentials remain unavailable; production gate stays closed.
- Distribution status is recorded in outputs/qa-0.9.6; upload and Apple processing are separate states.

## Verified distribution

Xcode upload SUCCESS. App Store Connect shows 0.9.6 (2026112001) in Gelistirici Testi with status Testing and 90 days availability. Build ID 03c68efe-a9c6-406c-b2a2-e1e6b94f90a6. PR #4 has four passing checks (native and PostgreSQL/game suites on push and PR). Tester email delivery is tracked separately and is not implied by upload success.
