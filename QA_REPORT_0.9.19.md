# Cafeverse 0.9.19 — build19

24 November2026. Release branch `release/0.9.19`. Includes the full performance implementation `ad06292` prepared on top of shipped0.9.15 (18). Previous0.9.11 /2026112401 was an unpublished candidate; it is superseded by this0.9.19 candidate. No live save, balance, catalog product ID, backend gate or artwork changed for this version update.

Central release.json, package.json/package-lock, both Xcode configurations and generated Web metadata are synchronized to0.9.19 /19. Local published ledger has no0.9.19 /19 entry; App Store Connect availability remains unverified until a real upload. Current remote main fetched successfully and still contains0.3.7; it has not replaced the newer source.

## Validation

**PASS** full `npm test` exit0 for0.9.19 /19. Bundled identity and upload-helper syntax passed. **BLOCKED** signed Release archive exit65 (Swift macro sandbox); no candidate uploaded.

Final results and release blockers are in RELEASE_STATUS.md. Full regression log: task outputs/release-0.9.19-19/npm-test.log. This run rebuilds Web from authoritative sources and includes the new performance regressions plus all existing service, economy, account, StoreKit fixture, appearance, audio and counter suites. Historical before/after measurements are in PERFORMANCE_REPORT_0.9.11.md and performance-evidence/0.9.11; only release identity has changed since those code measurements. They are Node/linkedom work measurements, not physical iPhone FPS.

## Included behavior

- Preserve world/table/Melo DOM nodes for wallet and unchanged updates; isolated wardrobe/decor patches.
- Demand-driven moving frames, absolute elapsed-time positions, suspended background/menu timers and CSS scene animations.
- Melo walking duration1050ms instead of1400ms; no serial1800ms post-reward delay.
- Hidden preview work skipped; bounded account-aware SVG cache, no repeated unchanged PNG encoding.
- Read-only requests avoid redundant rollback cloning; passive concurrent sync coalesces without caching financial writes.
- Generated PNG assets987588bytes smaller with exact filtered pixel bytes/non-IDAT metadata preserved; all38 source asset hashes unchanged.
- Existing server-verified once-only account credit, pending recovery and durable credit-before-finish preserved.

## Phone acceptance after actual distribution

1. About shows0.9.19 (19); test cold/warm start and menu responsiveness.
2. Three-press existing balloon calls once; both customers sit before two-person order appears.
3. Complete three-product table and independent package orders; receive each reward once.
4. Verify2/4+3/4+0/4 gives5/12 seats,2/3 tables; package active/ready/delivery does not change table occupancy.
5. Wardrobe/decor remain correct while walking/serving and after restart; test audio0/10/50/100 and mute/background.
6. Sandbox packages250/750/2000: localized price, one correct account credit, cancel/pending/network/restart/duplicate/account-switch recovery. No manual Check Purchases button.
7. Compare identical device Release builds using Instruments; physical FPS/energy/leaks/thermal and30/60min wall-clock soak remain NOT RUN until performed.

This report does not claim a fresh physical payment, device test or successful TestFlight upload.
