# Performance report — Cafeverse 0.9.11 (2026112401)

24 November 2026. Based on shipped 0.9.15 (18), commit e2ea065, with its StoreKit delivery fixes retained. The user explicitly requested marketing version 0.9.11; a fresh build exceeds the prior 0.9.11 /2026112302. Apple acceptance of this lower marketing version is not yet verified. Main 6634ae3 remains the older 0.3.7 source and was not substituted.

## Method

Same Node v24.22.3, deterministic synthetic account, linkedom, fixture and scenario before/after; see PERFORMANCE_BASELINE.md. Actual CPU timings and DOM API call counts; **not device layout, GPU, FPS, touch latency or battery measurements**. Virtual 60-second idle/background/menu; 2.4-second moving group; 100 unchanged/wallet refreshes. Timings are single instrumented host runs and can vary; call counts are regression assertions. Positive change below means reduction.

| Metric | Before | After | Reduction |
|---|---:|---:|---:|
| Idle timer callbacks | 750.000 | 60.000 | 92.0% |
| Background callbacks | 750.000 | 0.000 | 100.0% |
| Menu callbacks | 750.000 | 0.000 | 100.0% |
| Idle selectors | 20279.000 | 1.000 | 100.0% |
| Idle SVG attribute writes | 37550.000 | 0.000 | 100.0% |
| Idle service view calls | 757.000 | 1.000 | 99.9% |
| Unchanged full root replacements | 100.000 | 0.000 | 100.0% |
| Wallet full root replacements | 100.000 | 0.000 | 100.0% |
| Wallet reparsed markup bytes | 947500.000 | 205800.000 | 78.3% |
| Unchanged ResizeObservers created | 100.000 | 0.000 | 100.0% |
| Unchanged mocked geometry reads | 100.000 | 0.000 | 100.0% |
| Unchanged legacy renderer calls | 100.000 | 1.000 | 99.0% |
| Idle JS CPU ms | 116.607 | 4.531 | 96.1% |
| Unchanged JS CPU ms | 99.614 | 10.358 | 89.6% |
| Wallet JS CPU ms | 98.282 | 50.623 | 48.5% |
| Moving JS CPU ms | 9.426 | 10.909 | -15.7% |

Moving positions now use requestAnimationFrame while moving, rather than an 80ms interval. The moving CPU total reflects a different number of position updates (30 → 133); do not interpret this as reduced total moving CPU or physical 60 FPS. Actual display cadence/dropped frames remain NOT RUN. Idle scheduling uses the next known deadline, capped at one second; menu/background suspend it entirely. Hidden CSS scene animations are paused. Motion uses absolute elapsed time, not accumulated frame steps.

## Engine, previews, network, assets

- Read-only `/api/me` 100 calls with 3,000 receipt records: 200 → 100 clones, 173.248 → 1.869 ms host CPU (98.9% reduction). Zero storage writes; full saved content compared equal. Mutating requests retain rollback snapshots; receipt history is not truncated.
- Hidden preview /100 refreshes: canvas allocations100 →0, Image allocations200 →0, SVG fetch API calls200 →0. Visible unchanged preview PNG encode calls100 →0. Decode/canvas/network in this harness are stubs: only call counts, **not execution latency**. First visible preview still renders, cache invalidates by account/decor/upgrades, revision guards reject stale completions.
- Concurrent passive sync100 →1 network call; hidden100 →0. No economic write, Apple verification or coin delivery was cached/skipped by this change.
- Generated PNG compression saves **987,588 bytes**; original total asset bytes49,472,491 → generated48,484,903 (2.00%). Every PNG filtered byte stream and non-IDAT chunk is compared exactly; width, height, alpha and source files unchanged. Compressed package bytes are reduced, **decoded texture memory is not**. All38 source asset hashes preserved. No replacement artwork, font, CDN or lossy conversion.
- Melo movement1,400 →1,050ms (25% less duration /33.3% faster movement). Removed an unnecessary1,800ms serial post-reward wait; guest celebration/departure remains independent and reward settlement unchanged.
- Wardrobe/decor patch their own SVG layers, wallet changes only the HUD; table/world/Melo node identity preserved. SVG progress changes scale instead of width. ResizeObserver is reused unless footer changes, disconnected when hidden.

## Reviewed without speculative changes

Native WKWebView is already created once per account screen; updateUIView does not reload it. Native audio caches its player, caps effects and pauses on background. No physical profile identified a justified blur/shadow quality reduction, GPU hint, texture downscale or audio re-encode, so these were preserved. No backend migration, new index, live wallet mutation or feature activation is part of this performance release.

## Validation limits

Full JS regression results are in QA_REPORT_0.9.11.md. Simulator and signed Release archive were attempted but Swift macro plugins fail under this execution sandbox (`sandbox_apply: Operation not permitted`, SwiftUIMacros.StateMacro malformed response). CoreSimulator also reports unavailable runtime service. Chrome baseline launch exited before a page could be profiled. Physical iPhone old/new hardware, Instruments Time Profiler/Allocations/Leaks/Energy, real cold/warm startup, actual menu/touch latency, memory peaks, thermal/low-power and30/60-minute wall-clock soak: **NOT RUN/BLOCKED**. No claim of leak-free memory, battery savings or stable60FPS.

## Reproduction

Run `npm test`, `node tools/perf-scene.mjs`, `node tools/perf-support.mjs`, `node tools/perf-sync.mjs`. Baseline implementation is commit1ec0e24's parent for scene/engine/preview; baseline snapshots were saved before editing. Compact before/after evidence is committed under performance-evidence/0.9.11. Helpers default output to the original task outputs/performance directory. For a different checkout set CAFE_PERF_OUT /CAFE_PERF_SUPPORT_OUT /CAFE_PERF_SYNC_OUT.

## Physical acceptance still required

On identical device/Release configuration: cold launch x5 and warm launch x5; 100 menu opens; walking/service with 12 guests; balloon first/second/third tap; wardrobe/decor switches; table2/4+3/4+0/4 with independent package; 30/60min gameplay; app background/resume; music0/10/50/100 and mute; account restart; pending StoreKit recovery/duplicate callback/account switch. Capture FPS p50/p95/p99 frame time, drops, CPU/GPU, resident/peak memory, power and thermal state before/after. Do not label these PASS until run on device.
