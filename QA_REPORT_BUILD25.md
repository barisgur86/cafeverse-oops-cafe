# Build 25 QA — 2026-11-25

Marketing version: 0.9.19. Target CFBundleVersion: 25. Branch: fix/accounts-cloud-regression-build25. Build 24 software baseline: 1136c6d; Build 24 was not uploaded. Last confirmed TestFlight release: Build 23.

## PASS — automated checks

- Complete npm test suite, including Build 24 delivery recovery and Build 25 account migration fixtures.
- Native auth routing and iOS bridge/StoreKit/audio type checking; these are not a full signed archive.
- Existing progress, quests, recipes, cosmetics, upgrades and wallet preserved in server-backed migration fixtures. Divergent saves require explicit selection; unverified device balances are preserved as recovery copies, never minted or summed.
- Independent simulated account caches recover the same verified save. Expired authentication callback and cancellation preserve existing sessions.
- Read-only café visits expose public cosmetics without private inventory, wallet or user IDs; reciprocal synthetic-account tests pass.
- Delivery status recovery uses read-only checks, persistent order IDs and exact reward receipts. Duplicate requests cannot award twice. Existing independent table/pickup regression suites pass.
- Live auth configuration and negative probes: Apple/email enabled, confirmation required; unauthenticated and invalid login requests rejected. No test accounts or real purchase transactions created.
- Backend deployed and downloaded again: all 15 files match intended bundle. Only generated engine, economy and HTTP modules changed; Apple verifier/auth modules preserved. Function revision 24 serves Build 25 code; backend revision is not the iOS build number. Live service preflight passed.

## Performance / economy evidence

Synthetic Node CPU fixture: 1,000 historical orders / 4,000 preparations, 20 reads. Median 93.416 ms → 2.282 ms; p95 98.987 ms → 2.622 ms. Active preparations are indexed once instead of rescanning all history per item. This is not an iPhone frame-rate measurement.

20-minute simulated session: starting 500 coins, ingredient cost 1,051, rewards 2,705, first upgrade cost 250, final 1,904; 63 deliveries and 2,205 XP. Input timing is simulated; this is not 20 minutes of actual human play. No economy rebalance inferred from this fixture.

## BLOCKED / not performed

- Physical iPhone and second-device authentication, recovery emails/expired links, actual Apple login and cloud restoration. CoreDevice service is unavailable to this session.
- Real TestFlight/Sandbox purchase, cancellation, pending approval and interruption recovery. No real before/after purchase balances to report; automated fixtures cannot substitute for Apple testing.
- Two actual account/device visits and trades. Ingredient trading remains disabled pending validation.
- Same-iPhone Build 24 versus Build 25 performance comparison; Build 24 was not distributed.
- Full browser/video acceptance and signed Release archive/upload require the normal Mac runner. No Build 25 archive CFBundleVersion verification or TestFlight availability is claimed yet.

## Delivery runner

Prepared executable: outputs/Cafeverse-0.9.19-Build25-TestFlight-Yukle.command (task output directory, outside repository). It runs tests and browser recording, then archives Release, verifies signing and archived marketing version/CFBundleVersion 25, and uploads for internal TestFlight testing. It stops on failure. Upload and Apple processing remain unconfirmed.

Phone checklist after confirmed availability: verify Build 25; sign in and compare progress on second device; purchase one Sandbox pack and record balances; reconnect/relaunch without duplicate credit; Table 1 four-item delivery and lost-response recovery; three consecutive independent pickup deliveries; wardrobe/decor/mute and balloon regression.
