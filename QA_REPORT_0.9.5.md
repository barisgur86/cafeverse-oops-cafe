# 0.9.5 /2026111906 stabilization

Rear customers were drawn before the chair artwork and could be covered. The SVG draw order now puts seated faces above the existing asset. No asset was edited.

Movement used enteredAt while status used server arrives_at. Both now use the same arrival/motion model, clamped progress and fully opaque seated customers. Departures were closure-only and vanished after restart; served_at and board.departures now preserve the remaining departure and table reservation. Selecting takeaway previously welcomed guests into free tables first; the selected package flow now plans only a package, with table=null and its separate counter destination. The DOM test harness also stopped retaining removed customer nodes.

Baseline and final npm test PASS; final run has 71 PASS summary lines. Existing 19 service contracts, 16 lifecycle cases and 38 unchanged asset hashes remain covered. New 1/2/3/4-person arrival, delayed registration, departure restart and 30-minute VIRTUAL soak (180 parties) PASS. This is not a physical 30-minute gameplay test.

Local browser 375x667: four seated characters visible, full preparation/delivery/single reward, package customer at (1050,350) while table remains empty. Native/physical iPhone/iPad acceptance NOT RUN. Audio 0/10/50/100 gain, mute/unmute and persistence regression PASS; Bluetooth, speaker output and physical background behavior NOT RUN.

The current 300-case coverage matrix is qa/0.9.5-cases.json. It reports 91 PASS, 94 BLOCKED, 114 NOT RUN and one FAIL production gate. It does not claim all 300 cases were executed. Actual Apple Sandbox purchases/refunds and two-device trades remain NOT RUN. IAP/trade/market/social flags remain closed. Live saves, balances and assets were preserved.

Release branch: release/0.9.5. The earlier 2026111905 archive does not include these service fixes. Current signed archive/upload/CI results must be recorded after verification. Production 1.0.0 was not published; production merge/tag stays gated by open P0 acceptance.
