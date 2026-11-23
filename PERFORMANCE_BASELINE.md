# Performance baseline

Source e2ea065, marketing 0.9.15 / build 18; measured before performance edits on 24 November 2026. Remote main remains an older source line (6634ae3); it is not treated as the shipped source.

Measurement scope: Node v24.22.3 and linkedom, deterministic synthetic 12-guest scenes. These are actual JS/DOM API work counts and host JS CPU timings, not WKWebView layout, GPU, physical device FPS or wall-clock soak. A virtual minute executes without sleeping. Timing instrumentation overhead applies to both before/after.

## Twenty measured work sites

Prioritized investigation list; not an Instruments ranking of the twenty highest device CPU stacks.

| Work site | Baseline |
|---|---|
| Position scheduler | 80 ms / 12.5 updates per second (source; not display FPS) |
| Idle 12 guests | 750 timer callbacks / 60 virtual s |
| Background 12 guests | 750 timer callbacks / 60 virtual s |
| Menu | 750 idle callbacks / 60 virtual s |
| Idle selectors | 20279 element querySelector calls |
| Idle SVG attributes | 37550 setAttribute calls |
| Idle board access | 7523 serviceBoard reads |
| Idle service views | 757 view calls |
| 100 unchanged refreshes | 100 complete root replacements |
| 100 wallet refreshes | 100 complete root replacements |
| Unchanged markup | 947500 bytes reparsed |
| Observers | 100 ResizeObserver constructions |
| Geometry API | 100 mocked geometry reads |
| Hidden legacy render | 100 prior-render invocations |
| 100 read-only engine calls | 200 structuredClone calls; 173.25 ms total |
| Hidden preview canvas | 100 canvas allocations / 100 refreshes |
| Hidden preview images | 200 Image allocations |
| Hidden preview fetch | 200 SVG fetch calls (stub transport) |
| Visible unchanged preview | 100 PNG encode API calls |
| Original assets | 49472491 bytes / 38 files; no byte duplicates |

Unchanged-render JS p50/p95/p99: 0.832 / 1.962 / 3.675 ms in this DOM harness. Engine fixture contains 3,000 receipt records (208239 saved bytes); no live account modified.

## Device metrics NOT RUN / BLOCKED

FPS/frame-time/dropped frames, cold/warm WKWebView startup, actual menu/touch/service latency, device CPU/GPU/Allocations/Leaks/Energy Log, memory leak certification, battery/thermal/low-power, slow real network, old/new physical iPhone classes and 30/60-minute wall-clock sessions are NOT RUN. Browser automation was attempted after network permission; Chrome exited during launch before a page could be profiled (task outputs/perf-baseline-browser.log). No device result is inferred from Node timings or virtual soak tests.

Evidence: task outputs/performance/scene-before.json, support-before.json; commands tools/perf-scene.mjs and tools/perf-support.mjs. Scene and engine baseline source snapshots are in task outputs/performance/baseline-*.js. Asset originals are hashed in support-before.json and remain unchanged.
