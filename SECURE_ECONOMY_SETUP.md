# 0.6.2 authoritative economy — deployment and test gate

This branch is a deployment candidate, not a live payment certification. Last shipped build was 0.6.1 (2026111707). Candidate: 0.6.2 (2026111708).

## Architecture

`source/server/secure/start.mjs` is a Node 24 HTTPS-behind-proxy backend using PostgreSQL in the existing Supabase project. Supabase `/auth/v1/user` validates each bearer token; actor IDs are never taken from JSON, cafe codes or the old prototype's `oai-authenticated-user-id` header. Swift retains bearer tokens in Keychain/native memory and sends API requests through `cafeGame`. The device engine is a display cache when `CafeGameServerURL` is configured. Offline economic mutations fail and retry; they never fall back to device coin grants.

Apple's official `@apple/app-store-server-library` verifies certificate chains, signatures, bundle/environment, and production app Apple ID. Online revocation checks remain enabled in the deployed verifier. Only the three exact consumables are accepted: `com.cafeverse.oopscafe.coins250`, `coins750`, `coins2000` with the full same prefix. Verified appAccountToken must equal the authenticated Supabase UUID. Transaction/original IDs, type, quantity and purchase date are checked. Environment is configured by the operator, never guessed from client input; Xcode unsigned transactions cannot buy server coins. Sandbox and production must use separate databases/deployments.

Transaction ID + environment is globally unique. Credit and ledger insert commit together. A lost HTTP response can be retried after restart without another credit. Native `finish` also requires the HTTPS server acknowledgement recorded inside Swift. Unfinished StoreKit transactions keep their JWS and are retried. Pending/cancelled purchases grant nothing.

V2 notifications are independently signed/verified. Refund/revoke removes the credited amount; spent coins create non-transferable refund debt, repaid by later earnings or purchases. Wallet never goes negative. Duplicate and out-of-order notifications are ignored. Refund-before-delivery creates a tombstone. Refund reversal is idempotent. Test/irrelevant verified notifications are acknowledged without credits.

Trades contain ingredients only; paid or earned coins cannot be offered. Sender stock is held when the offer is created, for 24 hours. Acceptance locks the trade and both accounts in UUID order and updates both inventories in one SQL transaction. Rejection/cancellation/expiry returns escrow once. All actions enforce actor ownership, amounts, item allowlists and request fingerprints. An offline recipient needs no live connection: pending offers persist in PostgreSQL. Expired offers settle lazily when either party opens their list or acts. Run an operational expiry job for timely returns when neither player reconnects.

## Migration — stage first; do not paste secrets into chat

1. Back up `cafe_cloud_saves`, auth accounts and configuration. Record row counts and wallets before/after. No migration has been run against the live database by this branch.
2. Apply `supabase/migrations/2026111701_authoritative_economy.sql` with an administrative database connection in staging. It copies **existing server backups**, not client-imported wallets, into new tables and leaves original backup rows intact. Public cafe codes become stable 10-character codes; the internal save code is retained so imports remain compatible. Already credited device-history entries are preserved, but cannot be cryptographically attested retroactively; reconcile any legacy paid transactions with Apple before opening production sales.
3. This migration intentionally freezes the legacy `cafe_cloud_push` RPC. Old builds keep local progress but cannot upload after cutover. Coordinate an upgrade/maintenance window; do not run it while expecting old builds to keep syncing. Preserve device-only progress by completing existing cloud uploads before the window. Do not delete old caches/saves. New server accounts must not be initialized from arbitrary HTTP JSON.
4. Configure a backend-only database login with the required table privileges and RLS bypass/ownership, scoped to these tables; anon/authenticated roles have no direct access. Use TLS with CA verification. Never put the database URL, Apple signing key or service-role token in the app, GitHub source or logs.
5. Deploy the Node service (`npm ci --omit=dev`, `npm run server`) behind TLS, strict request/body/rate limits at the ingress, and managed secrets from `.env.example`. The included process limiter is not a distributed abuse-control service. Monitor 5xx, expired escrow and notification delivery.
6. Download the real Apple DER root certificates from https://www.apple.com/certificateauthority/ into read-only runtime storage. Configure `APPLE_ROOT_CERTIFICATES` and `APPLE_ENVIRONMENT=Sandbox` for staging. Production uses its own database and `Production` verifier. Do not substitute test roots in production.
7. Configure App Store Server Notifications V2 to `https://BACKEND/apple/notifications`; test delivery and Apple's notification-history recovery. Add periodic App Store transaction reconciliation before production rollout: notifications alone are not a guarantee that every missed refund is recovered automatically. No App Store Server API signing credentials are embedded in this implementation.
8. Set Xcode build setting `CAFE_GAME_SERVER_URL=https://BACKEND` (origin only). The Info.plist expands it to `CafeGameServerURL`. Set GitHub environment `testflight` variable `CAFE_GAME_SERVER_URL` to the same staging origin. `npm run preflight` must pass before archive/upload. Unconfigured builds refuse real purchases; do not distribute them as the secure online release.

## App Store Connect

Cross-check all three identifiers in the app's In-App Purchases page against the exact allowlist. The local identifiers are consistent; this branch has not re-read current App Store Connect product records. Complete banking, tax and Paid Apps Agreement. Prior banking error was `Bank key doesn't exist`; it is not fixed by code. Add review screenshots/availability/prices and test with sandbox accounts. StoreKit provides displayed prices; prototype `coinPacks.examplePrice` is never a real charge.

## Required physical-device test matrix

- Apple sign-in + email login, sign out/in, token refresh and account isolation on iPhone/iPad.
- Each of 250/750/2000: real TestFlight/Sandbox sheet, approve, correct price/coin amount; refresh/relaunch and second device show one credit.
- Cancel, Ask to Buy/pending, flight mode before approval/after approval/after server commit, kill/relaunch before finish, then recover once.
- Refund via Apple testing tools, duplicate notification, refund after spending, refund reversal, and recovery of missed notifications. Review debt wording with players.
- Two real accounts: cafe-code lookup, create/receive/accept/reject/cancel, offline recipient, insufficient stock, simultaneous actions, 24-hour expiry and restart. Coins must not be tradeable.
- Three/four tables, four-person batch service, music, TR/EN, wardrobe/decor and stored balances after migration.

Automated tests distinguish generated signed certificate fixtures from Apple-issued receipts. PGlite tests use the PostgreSQL engine on one connection; GitHub CI additionally runs the same suite against disposable PostgreSQL 17 with real concurrent connections. Neither is a physical-device certification.

## CI / distribution

`test.yml` installs the locked dependencies and runs regression + secure tests with PostgreSQL. `testflight.yml` is manual, serialized and gated by backend health. It requires environment secrets `IOS_DISTRIBUTION_P12_BASE64`, `IOS_DISTRIBUTION_P12_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`, `CI_KEYCHAIN_PASSWORD`, `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_BASE64`. Their values are never printed. It installs temporary signing assets, archives, exports with `.github/ExportOptions.plist`, uploads, then removes temporary keys. Secret existence/values have not been verified through the local session.

Do not merge or distribute as complete until backend staging, migration rehearsal, live Apple products/agreements, physical-device matrix, notification/reconciliation operations and CI all pass. Local XCTest/Release limitations and actual push/PR results belong in the delivery report, not assumed successes.

Reference: https://github.com/apple/app-store-server-library-node and https://apple.github.io/app-store-server-library-node/classes/SignedDataVerifier.html
