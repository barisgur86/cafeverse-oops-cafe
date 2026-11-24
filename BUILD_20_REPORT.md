# Cafeverse0.9.19 — Build20 service delivery

24 November2026. Based on confirmed TestFlight0.9.19 (19), branch `fix/service-delivery-build20`. Marketing version stays0.9.19; both iOS build configurations use build20. Build19 is recorded in published history. No backend migration, live wallet mutation, save reset or artwork replacement.

## Root causes and fixes

Previously Serve waited for registration, two sequential1050ms Melo walks, delivery POST and the return-home walk. The dialog then additionally awaited `/api/me` before leaving Delivering. A stalled request had no delivery-specific deadline; retries used a newly generated request UUID, and the existing `.ticket-delivering .ticket-tray` animation was disconnected from the newer reference-art DOM.

The service modal now starts a single700ms tray/bag transfer synchronously on tap. Table deliveries target the selected table (including Table2); takeaway uses the existing bag artwork cropped from takeaway-service.png and targets the package counter. Table products become visible on the table only after confirmation/animation. Existing illustrations, customers, outfits, décor and recipe indices are preserved. Reduced-motion uses a minimal visual effect.

Economic result and animation completion are tracked separately. The API begins without serial Melo walks. The modal waits only for the animation if the API already succeeded; it does not await an extra post-success `/api/me`. A delayed API does not repeat the animation. An8s deadline exits Delivering, enables retry and retains order/request identity. The scene busy flag also releases on deadline. Closing the modal clears its animation timer/listener while an in-flight economic operation continues safely. Reopening an uncertain order checks authoritative `/api/me` before sending again. If served, recover success without POST; if not served, safely resend the same saved UUID and identical order/table/customer/preparation body. Existing server transaction/receipt idempotency remains authoritative. Late confirmation is handled once; no local coin grant or skipped server validation.

## Automated evidence

**PASS:** full `npm test` exit0, including the delivery cases. After the final synchronous-save error cleanup, targeted service simulation and the expanded delivery suite were rerun successfully and the bundle regenerated. **PASS:** Build20 version guard and uploader shell syntax.

Run `npm test` and `node tests/service-delivery.mjs`. Final full-suite log: task outputs/release-0.9.19-20/npm-test-final.log. Delivery-specific log: delivery-regression.log.

The new deterministic DOM + real engine tests exercise:

- Table2 with two guests: immediate transfer,700ms visual completion, one POST and one reward.
- Table2 with three guests: same, correct guest/order quantity.
- Takeaway: package-counter target, independent order and one reward.
- Rapid double tap: only one settlement.
- Response delayed after server commit: deadline exits, retry queries same order, no second POST; late response does not duplicate reward.
- Network error before commit: retry uses identical saved UUID and order.
- Request lost before server commit: status checked, same UUID resent, one atomic settlement.
- Closing/reopening during animation: detached animation timer cleaned, committed delivery recovered once.
- Status read never resolves: bounded wait, zero accidental delivery mutation.
- Synchronous local save failure: catches the error and releases Melo busy state; no stuck action.

Existing service restore/simulation,38 original artwork hashes, table/takeaway counters, appearance, economy/security/StoreKit fixtures and account/audio regressions remain in the full suite. These are automated fixtures, not physical iPhone gameplay or real payments.

## Screen recording

**BLOCKED / no recording produced in this session.** Actual browser launch was attempted with the real bundled UI, iPhone-sized viewport and disposable local engine fixture. Chrome exited with SIGABRT/EPERM before a page could be recorded. Log: task outputs/release-0.9.19-20/browser-video.log. No generated illustration or synthetic video is presented as a gameplay recording.

Recording runner: `node tools/service-delivery-browser.mjs`. On a normal Mac it records the actual Table2 pair, Table2 triple and takeaway service UI to task outputs/release-0.9.19-20/video/build20-service-delivery-browser.webm, with handoff screenshots. This is explicitly browser gameplay with isolated fixtures, not Simulator/physical iPhone. The Build20 uploader runs this check before archive/export, so a failed browser check does not silently pass.

## Native build and distribution

Release archive attempted; exit65 at sandboxed Swift macro process (`sandbox_apply: Operation not permitted`, SwiftUIMacros.StateMacro malformed response). No successful Build20 native archive or TestFlight upload is claimed. Logs: archive-attempt.log. Last confirmed available TestFlight build remains19. Physical iPhone/Sandbox and actual device playback/latency: NOT RUN.

Prepared uploader: task outputs/Cafeverse-0.9.19-Build20-TestFlight-Yukle.command. It runs the full suite and browser recording, then archives, verifies codesign and exact0.9.19 /20 before internal TestFlight upload. Production publishing is not performed.

GitHub push attempted: failed because terminal credential is unavailable (`could not read Username`). No remote PR/merge created; PR_DESCRIPTION_BUILD20.md is prepared.

Follow-up: normal-Mac uploader passed full npm test, then browser recording stopped because Playwright FFmpeg1011 was missing. Installed FFmpeg1011 into task outputs/tooling/playwright-browsers (no source binary committed), configured the runner/uploader to use that path and auto-install if missing. Native upload has not begun; rerun prepared uploader from normal Mac Terminal.
