# Cafeverse 0.3.6 — Six-workstream release readiness

This package is **not** a production-ready release. It adds cloud-conflict safeguards and compact-screen CSS, while preserving existing account, StoreKit, offline game and server API code. Do not publish real-money purchases until server-authoritative accounting is in place.

| Workstream | In source | Still required before claiming complete |
|---|---|---|
| 1. Coin sales | StoreKit 2 verified transactions, idempotent local delivery and recovery | App Store Connect consumable products, paid-app agreements, tax/banking, Sandbox iPhone purchase, **server-side verified coin ledger**, receipt replay tests |
| 2. Accounts | Apple / email Supabase bridge and password reset beta | Apple capability and real-iPhone sign-in, Supabase redirect URLs, SMTP sender, email verification and reset end-to-end tests |
| 3. Cloud saves | Supabase revisioned backup SQL and conflict-aware local sync | Live schema installed and transactional isolation checks passed on 2026-11-14; conflict UI and offline/restart checks added. Still test on two physical devices. Client JSON is NOT authoritative for coin balance |
| 4. Player interactions | `source/server/game-api.mjs` has cafe/trade routes | Deploy backend + database with authenticated identity, rate limits, atomic trade acceptance and integration tests; bundled iPhone game remains offline and intentionally blocks real trades |
| 5. Balance | `source/server/progression.mjs` upgrade curve and game catalog | Instrument retention/economy telemetry; run actual playtests and tune using measured outcomes; do not assert balanced without data |
| 6. Mobile QA | Safe-area, overflow, tap target and reduced-motion CSS improvements | Xcode compile + physical iPhone checks across SE/standard/Pro Max, dynamic text, keyboard, four-seat table delivery and takeaway flows |

## Release gate

- `npm test` must pass.
- On-device Apple sign-in and password reset must pass.
- Verify StoreKit transaction credited once, including crash/relaunch and two-device scenario.
- Confirm cloud save does not silently overwrite divergent local data.
- Validate four-person table delivers together, takeaway order completes exactly once, and no action is hidden by the keyboard or safe area.
- Keep App Store secrets, service-role keys and signing certificates outside the repository.
