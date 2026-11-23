# Cafeverse 0.9.11 balloon correction — build 2026112303

Date: 2026-11-23
Base source: 97ea37d; branch: fix/original-door-balloons-0911.

Existing pink and mint tube-dancer markup is reused unchanged, including faces, arms, lettering and fan bases. Only fabric inflates upwards; bases remain anchored. Each deliberate press pumps once. Presses one and two cannot call guests. Press three starts two beckoning bends, then the existing call round. In-flight duplicate presses are ignored; completed rounds cannot replay; navigation cancels pending waits and resets progress.

PASS: full npm test, including three-press timing, duplicate presses, cancellation in each pumping/beckoning stage, original-art identity, seating/order simulation, service/economy regressions and release identity. Log: outputs/qa-original-balloon.log in task root. Prior source fails the new original-art assertion (qa-original-balloon-red.log).

BLOCKED: actual browser visual playback, Simulator recording and physical iPhone verification. Browser subprocess launch is blocked in this execution sandbox. No new gameplay video or native-device success is claimed.

TestFlight: this build has NOT been uploaded. Previous available build is 2026112302. A separate upload helper for 2026112303 is prepared in task outputs; old success markers are not reused. No live user data or raster assets changed.
