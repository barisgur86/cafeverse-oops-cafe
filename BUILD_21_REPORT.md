# Cafeverse 0.9.19 — Build21

24 November2026. Branch `fix/seating-pickup-door-build21`, based on verified shipped Build20. Marketing stays0.9.19; Debug/Release build21. No source raster artwork changed, no live saves reset, no direct wallet edits. Production App Store publication is not performed.

## Root causes and corrections

1. Scene/service used different chair coordinates; the service layer placed the third guest behind Melo. Seated avatars were standing sprites cropped at the knees. A shared canonical guest/seat model now drives scene and service, with separate guest count and expanded product quantities. All four seats use cushion anchors; upper-body and original shoe art are composed into a bent-leg seated pose. Rear/front/table-surface layers are explicit; Melo renders behind guests. Service count shows actual occupancy (e.g.2/4), not order-line count. Server guest IDs override stale local IDs. Two guests can still order three products.
2. Build20’s700ms one-shot tray/bag handoff,8s pending deadline, authoritative status recovery and saved request UUID are preserved. Both table and package paths now run delayed/error/lost-response/double-tap/reopen regressions. No client-side coin grant. A synchronous local-cache error also releases scene busy state.
3. Package creation previously depended on spare Gel Gel admissions and only rendered in the interior. Package admission now remains independent; one-active-package and existing preparation/stock/atomic settlement checks remain. Legacy total admission counters are preserved; a derived table-only admission count subtracts historical/pending package admissions without resetting saves. A persistent package customer/order appears at the door, survives reentry, gates delivery until arrival/readiness, and has explicit same-order arrival retry on failure. Door delivery keeps the exterior scene and matching customer, sends the bag to that customer, then displays departure after confirmation.
4. Door guests were two unconditional decorative sprites, while the counter read a different model. Door sprites and count now use the same queue, distinct from pickup customers. Entry admits the queue and removes the external guests together. Call progress disables the button and displays coming status; call completion/error restores a cooldown-aware action. Existing60s server cooldown remains. Balloon body text is removed from the existing code artwork; both bases have fixed pumps, bodies inflate upward and deflate completely. Idle body/arm/face/hair/air layers are hidden so no strips remain. Scene exit clears/reset timers; finished balloons also reset on foreground resume.

## Automated acceptance

**PASS:** full `npm test` exited0 after the final application changes, including the expanded acceptance and table/package retry matrix. Build identity check and uploader syntax passed. Status and log are recorded in RELEASE_STATUS.md and task outputs/release-0.9.19-21/npm-test-final.log. Additional results: acceptance.log, delivery.log, simulation.log, appearance.log.

- Table1 pair; Table2 pair with three products; Table2 triple; Table3 four; Table4 one: same guest identities, unique cushion slots, seated pose metadata, actual occupancy and independent product count in scene/modal. Stale local guest IDs do not override the active server session.
- Existing service-order contract tests retain wrong-table/customer rejection, arrival/readiness gating and once-only server settlement. Table and package normal/delayed/failure/timeout/retry/double-tap/close/reopen/pre-commit loss/late response cases are exercised against the actual engine and deterministic DOM.
- Pickup with zero and two waiting Gel Gel guests: same customer/order across exit/reentry, delivery disabled until arrival/readiness, no seat/table/queue contribution. Arrival error exposes same-order retry. Independent pickup still opens after all table guest quota is used; another forged table admission is rejected. Duplicate delivery UUID returns the original settlement.
- Two actual call-controller rounds under deterministic time, with rapid double taps:4 API calls per round (start+3taps), no duplicate groups, exact queue counts, idle hidden balloon bodies, cooldown-aware reactivation, and entry admission. The test clock advances the existing cooldown rather than changing production economy.
- Existing asset hash, save compatibility, StoreKit signature/idempotency/account, appearance, audio, cloud and secure economy regression suites retained.

These are automated fixtures; they are not physical iPhone gameplay or live Sandbox purchases.

## Deployed TestFlight backend

`cafe-secure-stage` Supabase Edge version21 deployed. Only the generated shared game engine and the public health policy marker changed; all13 other deployed modules were verified byte-identical, including Apple certificate verification, authentication and feature configuration. Gateway verification setting preserved; authenticated handler remains in place. Health returned200 with `serviceQueue=independent-pickup-v1`, environmentSandbox, existing feature gates; unauthenticated game probe returned401. No player records modified by these probes. Rollback source preserved at task outputs/release-0.9.19-21/stage-before.json.

Internal TestFlight service check passes. The separate production preflight remains BLOCKED by the existing account-deletion/Apple-revocation configuration prerequisites; these were not enabled, hidden or weakened as part of this service fix. No production release is claimed.

## Visual verification and recording

Static render of the actual shared seat SVG was generated and inspected: task outputs/release-0.9.19-21/seated-poses-preview.png. This is a renderer preview, not a device screenshot. Original PNG source assets remain unchanged.

**Native small-iPhone/Simulator screen recording: NOT RUN/BLOCKED.** Chrome launch in this execution session exits before a browser page can open; native Simulator access is unavailable. A prepared runner, `tools/service-delivery-browser.mjs`, records the actual bundled UI at375×667 with Table1 pair, Table2 pair/triple, door pickup (including reentry during arrival), two calls and deflated balloons. Its recording is explicitly a disposable browser fixture; only its cooldown is advanced between calls. It must not be labelled Simulator/iPhone footage. Intended output: task outputs/release-0.9.19-21/video/build21-seating-pickup-calls-browser.webm. No new video currently exists from this session.

## iOS / TestFlight

Actual Release archive attempted, failed exit65 because sandbox_apply prevents SwiftUIMacros.StateMacro plugin execution. No successful Build21 archive and no archive CFBundleVersion verification yet. Project identity is21 and the prepared normal-Mac uploader verifies archived CFBundleShortVersionString0.9.19 and CFBundleVersion21, codesign, then internal TestFlight upload.

Uploader: task outputs/Cafeverse-0.9.19-Build21-TestFlight-Yukle.command. It requires the full suite, deployed Sandbox policy and browser UI recording check before archive/export. Last confirmed available TestFlight is0.9.19 (20). Apple processing, exact Build21 tester access/mail and physical device acceptance remain unverified until a successful upload. Failed/unverified steps are not marked PASS.

Final source commit: `3e3ebdc`. Public main fetched and remains0.3.7; the shipped Build20 lineage was preserved. Push attempted and failed because HTTPS GitHub credentials are unavailable; no PR/merge created (prepared body: PR_DESCRIPTION_BUILD21.md). Normal Terminal launch was also attempted but LaunchServices returnedkLSNoExecutableErr, so the uploader has not started. A separate rebuild briefly removed Web/index.html during an intermediate test run; builds/tests were then serialized and the full final suite passed.
