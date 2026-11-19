# Coin delivery recovery — 20 November 2026

- Isolated unfinished transaction failures: later transactions still receive delivery attempts. Failed transactions remain unfinished and the first error remains visible to the caller.
- Direct purchase invocation now requires both server authority and the IAP feature flag, matching the shop entry gate.
- Added behavioral regression tests for failed-first/successful-second recovery, recovery lock release, and three disabled gate combinations.
- Baseline npm test: PASS. Final npm test: PASS (72 PASS summary lines; these are not 72 physical-device tests). git diff --check: PASS.
- No live wallets, inventories, assets, prices or feature flags changed.
- Real Apple Sandbox purchases/refunds: NOT RUN. Paid Apps Agreement/bank/tax setup is still incomplete; shipped server cutover remains gated. No new TestFlight upload performed for this change.
