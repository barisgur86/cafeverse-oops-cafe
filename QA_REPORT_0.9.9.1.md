# Cafeverse 0.9.9.1 — Gel Gel Balonu

Date: 22 November 2026. Source branch: feature/gel-gel-balloon-0991.
Implementation commit: 2430edc. Based on shipped 0.9.9 source branch release/0.9.9.
Delivery label: **Cafeverse 0.9.9.1**. iOS marketing version remains **0.9.9**; build **2026112201**. Package version remains the three-part iOS version; cafeverseReleaseLabel and generated menu show the requested four-part delivery label.

## Implemented
- Existing door art and guest call endpoints retained. Inline SVG floor pump, hose, anchor and slender flexible balloon added; no existing raster/SVG/audio assets replaced.
- One button activation performs four inflation/pump stages, then two upper-tip bends, then one existing server round (start and its three original taps). Opening the door starts no call transaction. Existing timing/hit rules still determine guest count; no local coin/guest grant added.
- Balloon scales upward about its fixed ground anchor. Pump and anchor do not inherit body scaling; Melo remains beside the grounded rig and animates pumping, not carrying.
- Duplicate activation is ignored while the controller is active; actual call button is disabled. Exit/navigation/pagehide cancels animation waits and prevents subsequent taps. A request already sent to the authoritative server cannot be undone by local cancellation; its existing server/idempotency behavior is preserved.
- Two-person seating uses existing customer identities, shared arrival clock and order-visibility gate. No order icons until seating finishes. Existing save/economy/wardrobe/decor unchanged.

## Tests
PASS — full npm test exit 0, **81 PASS summary lines**, task outputs/qa-0991.log. Includes pre-existing service, atomic economy, cloud, wardrobe, asset hash and save compatibility regressions.
PASS — new controller test: one activation, four pumps, one two-bend phase, twenty duplicate activations ignored; cancellation during each pump/beckoning wait clears the timer and delivers no guest call.
PASS — simulation regression: automatic one-tap call, two-person arrival gate, both visible when seated, preparation/service and package paths. Exact pair check runs in the actual local engine/DOM harness, not a physical device.
PASS — release identity test: marketing versions, build, package and generated four-part delivery label match.
PASS — in-app browser at **393×852**: pump/anchor visually present above controls; one real UI click auto-completes, balance stays 500 and waiting guests increase from four to six (two new guests). Pump rendering was corrected to remove SVG aspect-ratio letterboxing that raised its base. Screenshot: task outputs/qa-0991/iphone-door.png.
PASS — git diff --check.
BLOCKED — separate Chrome automated 393×852/375×667 recording suite: subprocess closed at launch in sandbox. Script tools/balloon-browser-qa.mjs prepared but not marked passing. No browser recording generated.
BLOCKED — current Simulator build/service and native video: CoreSimulatorService connection invalid; Swift plugin process sandbox restriction. See task outputs/qa-0991/simulators.json and simulator-build.log. Exit 65 does not prove an application source defect. No MP4 generated; no simulated or physical-device gameplay claim.
NOT RUN — physical iPhone and current signed Release archive/TestFlight upload. Existing released 0.9.9 /2026112101 is not this new /2026112201 build.

## Delivery
Code committed locally. CLI push attempted and failed (no authenticated username); GitHub Desktop UI timed out. No PR/remote success claimed. No user data or live backend modified, no new money flow enabled. Source ZIP is provided separately at task outputs/Cafeverse-0.9.9.1-source.zip. QA runner prepared at task outputs/Cafeverse-0.9.9.1-QA.command.
