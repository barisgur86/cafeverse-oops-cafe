# 0.6.2 delivery status — 2026-11-17

## Version / source

- Last shipped: 0.6.1 (2026111707).
- Candidate: package.json / both Xcode configurations **0.6.2 (2026111708)**.
- Remote main was actually 0.3.7 at `6634ae3823d2ca1b156308c6016b4ee2f36b5184`, with a later TestFlight workflow commit. Local shipped 0.6.1 was newer and had unrelated history. Remote main was fetched; both histories were joined without replacing shipped sources with the old version.
- Feature branch: `feature/secure-store-trades-062`.

## Changes

- `source/server/secure/{apple,economy,engine,http,start}.mjs`: authenticated Node/PostgreSQL API, official Apple JWS verification, pinned deployed Apple G3 root, exact product/account/bundle/environment validation, durable coin ledger, replay/crash recovery, refunds/debt/reversal and signed notification handling; atomic ingredient escrow and trade settlement with deterministic account locks.
- `supabase/migrations/2026111701_authoritative_economy.sql`: transactional migration preserving existing backup rows and wallets, new server tables/RLS, no direct authenticated-client writes, freezes legacy arbitrary snapshot pushes. **Not applied live.**
- `iOS/App/CafeverseApp.swift`: JWS forwarding, native bearer-authenticated game requests/refresh, server acknowledgement required before StoreKit finish. `Info.plist`: configurable secure backend origin.
- `source/public/secure-client.js`: server-only economic requests/cache hydration, persistent request IDs across network failure/restart, metadata-only board writes. Related client/board/cloud scripts route correctly and disable device coin grants.
- `offline-runtime.js`: a client-supplied transaction can no longer grant native coins. Existing save/history formats preserved.
- Locked npm dependencies, 3 new security suites, updated device-boundary/cloud fixtures. Existing recipes, save IDs, accounts and balances are not erased.
- GitHub test/PostgreSQL/native jobs, manual gated TestFlight workflow, missing export plist and deployment preflight. `SECURE_ECONOMY_SETUP.md` contains deployment, cutover, device matrix and operational gaps.

## Observed tests

- Baseline npm-test-equivalent: all existing stages passed before changes.
- Final `npm test`: regression, device credit denial, legacy cloud sync, collection/seating/upgrades, PostgreSQL/PGlite economy, Apple signed-fixture cryptography and secure-client tests passed locally.
- Successful transaction, wrong bundle/product/environment/account, malformed IDs, invalid JWS, repeat ID/concurrent retries, lost response/restart, database rollback, refund/reversal/debt/out-of-order notification and migrated-history no-double-credit covered.
- Ingredient offer/escrow/accept/reject/cancel, insufficient stock, repeat acceptance, acceptance/cancellation race, expiry, rollback after stock writes, unauthorized actor and direct-table RLS privileges covered.
- `npm run test:auth-routing`: passed; native recovery/session routing uses fixtures, not live Apple login.
- Native DeviceCafe/CafeCloud/CafeStore bridge extracted and type-checked for arm64 iOS 16 successfully.
- `npm audit` during locked install: zero known vulnerabilities at execution time.
- `git diff --check`: passed.

## Failed / unavailable checks (not passed)

- Full unsigned Xcode Release build failed in this sandbox: SwiftUI `StateMacro` plugin returned malformed response; subsequent `$register/$username/...` errors follow that failure. Native bridge itself type-checks. Full build still needs normal macOS/Xcode CI or Mac session.
- Release preflight correctly blocks absent `CAFE_GAME_SERVER_URL`; backend/migration are not deployed. No TestFlight upload attempted for 0.6.2.
- PGlite executes real PostgreSQL on one connection; local race calls are serialized by the test adapter. Real multi-connection PostgreSQL 17 CI is configured but has not run because the branch cannot be pushed.
- Git CLI push failed: no HTTPS credentials. Connected GitHub blob write also failed with **403 Resource not accessible by integration**. No branch pushed, PR URL, merge or CI result exists. Local commits and a Git bundle/source ZIP preserve the work.
- Live App Store Connect product records, secret presence, signing/provisioning assets and paid agreement status were not reverified. Product IDs in Swift/server match. Earlier banking/tax blocker is unresolved by this work.

## Still required before release/merge

1. Enable GitHub integration write permission or authenticate Git locally; push branch, create draft PR, run all CI including native Release and real multi-connection PostgreSQL; review the large diff (it also carries previously unpushed 0.6.1 changes).
2. Stage and deploy backend, rehearse migration and maintenance cutover, preserve any device-only progress, configure certificates/HTTPS/ingress limits/secrets and backend origin. No production data was changed here.
3. Reconcile historic paid receipts, configure/test Apple V2 notifications and missed-notification recovery/periodic App Store Server API reconciliation; production reconciliation is not implemented as a scheduled worker in this candidate.
4. Complete App Store Connect bank/tax/Paid Apps Agreement and product review metadata. Validate actual prices and consumable availability.
5. Physical iPhone/iPad Apple/email login, real Sandbox/TestFlight 250/750/2000 payments including pending/cancel/offline/kill/recovery/refund, two-device cloud sync and two-account trade races. None were performed in this task.
6. Only then merge and upload a newly numbered build if needed. This candidate is deliberately not reported as production-ready or already distributed.
