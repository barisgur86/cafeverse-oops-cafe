# QA — 0.9.11 Performance /2026112401

24 November2026. Baseline shipped source e2ea065 (0.9.15 /18). Branch release/0.9.11; performance baseline commit1ec0e24. Implementation commit: `ad06292b0c6b325d8b0d98c3f7977e7d21312aa7`. It is also available from `git log -1 --format=%H --grep='^perf: optimize game engine rendering animations assets and startup$'` after delivery commit. No physical device result inferred from a VM test.

## Executed

- **PASS** `npm test` (exit0): complete configured suite, including build/version guards, original asset manifest, offline/preparation/catalog, durable StoreKit delivery and recovery/idempotency/account ownership, cloud save/sync, service restore/orders/soak, simulation, TR/EN, weekly collections, appearance, store checkout/catalog, seating/lifecycle/upgrades, server economy/authorization, account deletion/lifecycle, coin gifts, actual signed Apple JWS/OCSP fixtures including invalid/revoked cases, secure client, audio, marketplace gates, balloon, presentation, version history and table/takeaway counters.
- **PASS** new performance regression: unchanged100 refreshes preserve scene; wallet updates preserve world/Melo; outfit/decor use isolated layers; background/menu callbacks zero;100 navigation transitions retain at most one scheduler;12 arriving guests become seated; read-only saved economy unchanged; preview allocation/encode/fetch elimination;100 passive sync calls coalesce; PNG filtered data and every non-IDAT chunk identical,987588 bytes saved.
- **PASS** `node tools/test-auth-routing.mjs`: native Swift account-recovery/deletion URL routing fixtures. No keychain or real login executed.
- **PASS** `node tools/test-audio-native.mjs`: Swift gain/clamp/mute fixture. Not audible output.
- **PASS** Node/linkedom before/after performance profiles with committed JSON evidence. These are DOM API work counts and host CPU timings, not layout/GPU/device FPS.
- **PASS** `zsh -n` dedicated performance upload helper; identity checks require0.9.11 /2026112401, existing0.9.11 build2302 helper remains separate. Generated bundle version matches central release config.

Logs: task outputs/performance/npm-test-final.log, auth-routing.log, audio-native.log, scene-after.log and committed performance-evidence/0.9.11.

## Blocked / NOT RUN

| Check | Status | Evidence / reason |
|---|---|---|
| Xcode signed Release archive | BLOCKED | Attempt exit65; sandbox_apply denied; SwiftUIMacros.StateMacro plugin malformed response. No archive success claimed. |
| Xcode Simulator Release build | BLOCKED | Attempt exit65, same Swift plugin restriction; CoreSimulator service/runtime unavailable. |
| Actual Simulator gameplay / MP4 | NOT RUN | No running simulator. |
| Browser real layout/profile | BLOCKED | Chrome process exited on launch before page load. |
| TestFlight upload/processing/group/email | NOT RUN | No valid new archive from this session; no upload or email sent. |
| Apple acceptance of lower marketing version0.9.11 | NOT RUN | Freshbuild2026112401 is greater than known0.9.11 history; server acceptance unverified. |
| Actual Sandbox purchase/refund this build | NOT RUN | Signed fixtures pass; no new Apple payment performed. Prior purchases are not retested results for this build. |
| Two accounts / two physical iPhones | NOT RUN | No device test session. |
| Physical cold/warm launch, frame times, battery, thermal, memory, Leaks | NOT RUN | Instruments/device access unavailable; Node heap samples are not a leak/texture measurement. |
|30/60-minute wall-clock gameplay | NOT RUN | Virtual soak is not wall-clock hardware soak. |

No open failing automated regression remains. Release cannot be labelled fully device-verified until the blocked native/device checks pass. StoreKit signature checks, account-scoped credits, durable delivery-before-finish, refund policy and feature gates were not weakened. No live saves/balances altered.

## Phone checklist after upload

1. Confirm About0.9.11 /2026112401; cold/warm startup, menus and background/resume.
2. Call guests using existing three-press balloon; two guests sit before order appears. Complete three-item order and independent takeaway; no duplicate reward.
3. Check2/4+3/4+0/4 =5/12 seats and2/3 tables; package active→ready→delivered leaves table totals unchanged.
4. Change wardrobe/decor, verify walking/service appearance and persistence after restart.
5. Verify music/effects0/10/50/100, mute, headphones and background.
6. Sandbox250/750/2000: correct localized price, one credit only, cancel/pending/retry/network loss/restart/account switch; no manual purchase-recovery button.
7. Profile identical before/after devices for30/60min; export Instruments FPS/frame/CPU/memory/energy/thermal captures.
