# Caféverse 0.9.19 — Build 22

Date: 24 November 2026 (Europe/Istanbul). Branch: fix/audio-upgrades-decor-gifts-build22.

## Implemented

- Global mute now controls the actual music/FX/speech engines rather than only the legacy call voice. Immediate gain/pause, persistent preferences, current-state icons, page/revision stamps rejecting stale native audio commands, native teardown. One music player; muted effects are discarded.
- Build 21 canonical table guest IDs, seated rendering, quantity totals, pickup identity/arrival, independent queue and bounded once-only delivery retained. Existing balloon artwork retained.
- All 12 upgrade cards show real prices, effects, preparation recipes/times, capacity, balance gates and installation state in TR/EN. Shared UI derives from authoritative catalog.
- Decor ownership and placement saved independently. Legacy owned decorations retain placement. Real artwork previews at the gameplay anchor without changing balance/save. Purchase, free placement, front/back layers, exterior sign and placement highlight implemented.
- Gift form shows total/eligible balances, localized maximum, explicit paste/copy, validated target and confirmation. Uncertain requests persist per account with the original UUID; restart/account switch cannot redirect or duplicate a transfer. Existing eligible incoming-gift rule retained.

## PASS — actually run

- Full npm test suite (including all existing economy, signature, account, save, service, queue, balloon and performance regressions), plus Build 22 acceptance tests.
- Espresso II: 400 coins debited once, 3/12 → 4/12, persisted restart; actual preparation 5 → 4.25 seconds. Blender timing and all 18 recipes/12 upgrade effects covered by existing upgrades test; full capacity 36 products.
- Decor purchase without placement, placement without second charge, repeat placement/restart; actual preview DOM leaves state unchanged and releases input lock. All catalog artwork paths exist.
- Master mute via actual control, gain values, muted FX rejection, reload/background persistence, rapid toggles retaining one player. Native gain math and command revision rejection.
- Actual native WebKit/clipboard/audio/StoreKit/auth bridge code typechecked against iOS SDK. This excludes SwiftUI macro screens and is NOT a full Release archive.
- Disposable PostgreSQL-compatible PGlite integration: 100 coin transfer sender total/eligible 500/382 → 400/282; recipient 500/0 → 600/100. Concurrent same UUID processed once; rollback, lost response, restart and invalid/self/overspend covered. NOT two real authenticated accounts.
- Client pending UUID survives restart, stays isolated per account, committed receipt recovered without another POST.
- Supabase internal Sandbox function deployed as version 22. Exactly generated engine and health handler changed; other 13 deployed files byte-preserved, including Apple verification/auth modules. Download verified all 15 modules match. Health 200, unauthenticated /game 401, owned-placement-v1 policy verified. No live user balances edited.

## BLOCKED / NOT RUN

- Full Release archive attempted: sandbox-exec sandbox_apply Operation not permitted; SwiftUI StateMacro plugin cannot launch. Subsequent binding errors stem from failed macro expansion. No completed signed Build 22 archive exists yet; archive CFBundleVersion cannot yet be certified.
- Browser camera screenshots/video attempted: Chrome process terminates at launch under this session. No Build 22 video or visual layout PASS is claimed. Updated normal-Mac runner records 375×667 service/pickup/balloon/mute and same-camera decor before/preview/after evidence.
- Physical iPhone audible output/routes, real keyboard layout, Simulator playback, two real authenticated test accounts, real StoreKit Sandbox purchase/refund: NOT RUN.
- TestFlight Build 22 upload/processing/internal-group access: NOT RUN. Prepared normal-Mac upload script checks marketing 0.9.19 and archive CFBundleVersion exactly 22 before exporting. Prior Build 21 signing failed errSecInternalComponent; no claim that it shipped.
- Production Apple revocation configuration remains false. Internal Sandbox testing is distinct from production signoff.

## Evidence / next action

Workspace outputs/release-0.9.19-22 contains npm-test-final.log, audio-native.log, native-bridges.log, gift-100.log, archive-attempt.log, browser-video.log and previous deployed-function backup. External script: outputs/Cafeverse-0.9.19-Build22-TestFlight-Yukle.command. It runs the tests, native checks, browser recording, actual Release archive and signed identity validation before upload. It stops on any error.

TestFlight status and Git push result must be checked from actual outputs; this report does not assert completion of either.

Implementation commit: d8a6e50. Push attempted and failed: could not read Username for https://github.com (Device not configured). PR/merge not performed. LaunchServices Terminal launch also failed (Unable to find application named Terminal). No TestFlight email was sent or triggered.
