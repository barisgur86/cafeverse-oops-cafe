# Caféverse 0.9.19 — Build 23

24 November 2026, Europe/Istanbul. Branch: fix/continuous-service-and-collections-build23.

## Root causes and changes

- `transact` previously silently returned undefined when another request was active. Automatic pickup registration could collide with table registration/preparation and show “guest order not confirmed” for a valid table. Actions now serialize and return their own result. Account identity is checked both before sending and before hydration. Fetch timeout releases a failed request; no previous-account response hydrates a new account.
- Authoritative order snapshots include each preparation ID and ready time, including joins for existing saved orders. Reconciliation recovers missing active sessions and committed preparation responses without charging again. Existing active guest IDs, quantities, seated chair layers and once-only 700 ms delivery retained. Table switching while preparing is allowed; work remains bound to the captured order, never the newly selected table.
- Pickup no longer depends on selecting the Paket tab or calling table guests. One active pickup and a persisted next-customer identity continue independently. After confirmation the queued identity becomes active and another next customer joins. Pickup admissions are excluded from table welcome quota and occupancy. Registration failures show retry for the same order; no 16 ms failure redraw loop. Door action prepares an unready order or hands over a ready bag.
- Call control explicitly says Call table guests / Masa misafiri çağır. Existing pink/mint artwork remains text-free, with fixed pumps, continuous different sway rhythms during calling and full layer cleanup after deflation.
- Shared mute and + Coin have distinct header grid cells. Modal dialogs use the top layer and hide the background mute hit target. Audio mute persistence/revision protection from Build 22 retained.
- Six characters now use a shared proportional SVG renderer for selection, café and service. Melo/Pufi use the existing full-size transparent atlas; Boba/Zuzu/Nori/Piks use their existing full, correctly proportioned screen-2 portraits (no new art). A one-shot selection reaction replaces the previous reaction. Existing saved name and balance are preserved. Storage text reflects actual account/device/demo mode.
- World cards use the actual existing isometric café scene with the same palette filter used by the active scene. No new world art was fabricated. Active world is saved through the authoritative endpoint; thresholds 0/3/6 serves retained.
- Quests use authoritative operations, persisted one-time claims and existing legacy claimed flag. Chains cover table batches (1/3), pickups (1/3), unique recipes (6/12) and placed decor (1/3), with 10/15 coin rewards. The old 3-cup/50-coin reward remains the same claim, never a new reward. Gift-eligible earnings follow the existing debt/earning policy.
- Recipe book uses unique valid discovery IDs / actual catalog total, four equal cards in a 2×2 grid, five pages for 18 recipes, last page two cards, all/discovered/undiscovered filters and ingredient details. Cards reuse the existing finished-product service illustration. No duplicate section heading.
- Build 22 upgrades, separate decor ownership/placement, previews and durable coin gift request IDs retained.

## Automated evidence

PASS: table 0/4→4/4 preparations, once-only 140 coin batch, active-session recovery, table/guest vs quantity separation and existing seated scene/service tests.

PASS: three full tables and three consecutive pickup deliveries with no calls. One active pickup at a time; queued customer ID promoted; +35 once per pickup; table occupancy remains 12 and attracted total unchanged.

PASS: all existing delivery delay, timeout, failure, double tap, close/reopen and uncertain-result recovery cases.

PASS: actual request serialization and rejection of in-flight previous-account responses.

PASS: actual recipe DOM 18 unique /18, 4 cards, 5 pages, final 2, filter page reset; claimed legacy quest has no claim action.

PASS: two concurrent authoritative quest claims in disposable PostgreSQL-compatible PGlite award 10 once. Sender/recipient synthetic 100-coin transfer remains 500/382→400/282 and 500/0→600/100; duplicate UUID once. These are NOT real authenticated users.

PASS: native bridge/audio typecheck and native audio policy/gain tests. Full archive is separate.

PASS: 38 existing service asset hashes unchanged. Source images not deleted or regenerated.

Supabase Sandbox function version 23 deployed and downloaded for byte verification. Three files changed: generated engine, two-route economy allowlist addition, health marker. Remaining 12 modules preserved, including Apple signature verification/auth. No database schema changes or live balance edits. Internal Sandbox is distinct from production approval.

## Pending physical / release evidence

- Physical iPhone audible output, hardware routes, real keyboard interaction: NOT RUN.
- Two actual authenticated test accounts sending 100 coins: NOT RUN (no dedicated test-account credentials available). No live player balances seeded or changed.
- Actual StoreKit Sandbox purchase/refund on a device: NOT RUN in this build.
- Browser recording, screenshots and full signed archive/TestFlight are verified only when their normal-Mac runner outputs exist. At report creation they are pending; no upload/Apple availability claim is made.
- New world illustrations beyond the existing scene/palette variants were not provided/created. Four secondary characters use original portrait art rather than fabricated full-body sprites.

## Release runner

outputs/Cafeverse-0.9.19-Build23-TestFlight-Yukle.command runs full npm tests, native checks, Sandbox contract, real browser UI/375×667 recording (four-item preparation with table switching, three pickup deliveries, calls, decor, mute, character, worlds, recipe pages and quest claim), then Release archive, signature verification and exact Info.plist 0.9.19 /23 before upload. It stops on any failure. Browser output is a disposable fixture, not physical iPhone or Simulator.

Evidence logs: outputs/release-0.9.19-23/. Full test log npm-test-final.log. Short focused tests build23-acceptance.log, secure-gifts-quests.log, delivery.log, native-bridges.log, audio-native.log. Browser expected video build23-seating-pickup-calls-decor-audio-browser.webm under video/ plus before/after PNGs.

## Final status of this agent session

Full final npm test completed successfully (npm-test-final.log, including Build 23 acceptance). Implementation commit: 3e8e5f2. Git push attempted and failed: HTTPS credential unavailable (`could not read Username`). PR/merge not performed.

Full Build 23 Release archive attempted and failed in this execution sandbox: `sandbox-exec: sandbox_apply: Operation not permitted`, followed by SwiftUI StateMacro plugin launch/expansion errors (exit 65). Browser recording attempted and Chrome exited at launch. LaunchServices attempt to open normal Terminal failed with kLSNoExecutableErr. These are actual recorded failures; no successful signed Build 23 archive, archive CFBundleVersion verification, video or TestFlight upload is claimed yet. The normal-Mac runner performs and gates all remaining checks. No new TestFlight email has been verified for Build 23.

## Normal-Mac runner follow-up

Normal-Mac full tests passed. Browser checks completed Table1 pair, Table2 pair/triple and pickup handoff screenshots, then stopped at call completion (30-second timeout). Video final frame confirmed zero guests despite three pump presses. Root cause: `call()` retained a separate `netBusy` early-return even after transaction serialization was fixed, so an overlapping pickup registration could still discard the call. Removed that redundant gate; callingBusy still prevents duplicate calls. Regression now deliberately runs both call rounds with netBusy=true and passes. Entire npm test rerun passed (npm-test-retry.log). Browser/archiving/upload must resume from the normal-Mac runner; no Build 23 upload yet.

Second normal-Mac browser run reproduced the same call timeout after the netBusy gate fix. Further analysis found a stale event closure: paintDoor rebuilt the call handler during pumping with isCalling=true; when the controller later enabled the button, its handler still refused every subsequent press. Handler now reads current balloon.active/callingBusy/round/cooldown at tap time. Regression deliberately redraws the door during every pump. Restoring the old handler makes the test fail (old-handler-reproduced.log); live-state handler passes both rounds (call-redraw-regression.log). Full suite passed again (npm-test-redraw.log). Browser and TestFlight upload remain unconfirmed until the normal-Mac runner resumes.

Third normal-Mac run: full npm tests passed; actual browser passed table pairs/triples, two call rounds (redraw fix confirmed), decor previews/placement, mute, Table1 actual 0/4→4/4 with table switching, three continuous pickup deliveries, and book 4-card/last-page checks. Preserved recording: video/build23-verified-service-calls-decor-browser.webm. Next assertion read the world card immediately after clicking Visit, before the async request completed; fixed harness to wait for state.world=1 and café navigation before returning to the list. No application change required for this test race. Prepared Build23-Devam.command resumes remaining book/world/quest/profile/header checks in a fresh disposable fixture, then archives/verifies/uploads. It reuses the already-passed full suite; device/Sandbox financial tests still not claimed. TestFlight remains pending until actual upload.
