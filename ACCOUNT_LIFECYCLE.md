# Account deletion and protected cutover

Implemented in the 0.9.5 beta candidate. Not a claim of real Apple revocation or production cutover acceptance.

## Account deletion

Native Menu → Account → Delete my account opens a native confirmation sheet. Password users reauthenticate with the server-owned email. Apple users provide a fresh authorization code/nonce; the exchanged Apple ID token is verified by Supabase and must identify the currently authenticated user. Linked Apple identities cannot bypass revocation by choosing password auth.

`POST /api/account/deletion/start` requires a valid bearer, fresh proof and literal `DELETE` confirmation. It returns a random 256-bit recovery receipt. Only its hash is stored. Provider tokens are AES-256-GCM encrypted, bound to the user UUID; passwords and raw authorization codes are never stored. Native stores the receipt in device-only Keychain before proceeding.

`POST /api/account/deletion/finish` uses the receipt, so a lost response remains recoverable after Auth invalidates the session. A per-user advisory lease prevents concurrent starts/completions; completed receipts return only `deleted:true`, without player data. Expired pending receipts require a new authenticated confirmation. Completed receipts can finish local cache cleanup even after expiry.

Steps persist independently: Apple revoke → atomic escrow cleanup → global Auth sign-out → Auth admin deletion → erase encrypted provider tokens. Network calls stay outside SQL transactions. Cleanup uses ordered offer/auction/account locks and finite timeouts. Incoming trades to a deleting user are rejected under account locks. Counterparty ingredients/bids are refunded once; the deleted user's own inventory is intentionally removed only following their confirmation. Failure rolls refunds back. Historical Apple transaction identity/status remains anonymous to prevent replay, with owner link/JWS removed. Late Apple notifications update that tombstone without recreating the user or paying another player.

Web cache removal is account-scoped, idempotent and happens only after server completion. Other accounts and shared audio/language preferences remain. A pending journal resumes after restart. No agent test deletes a live Auth user.

## Server-only cutover

`adoptBackup` reads an account-owned database backup under the same advisory lock used by legacy CAS writes. It validates the complete save with the existing engine, preserving balances, inventory, recipes, preparations and board. Import failure rolls back; no fresh 500-coin café replaces an invalid backup. Unmarked existing server accounts require review instead of being overwritten. Once marked, legacy backup writes reject and the server is authoritative.

The native secure client saves a recovery copy before first import. A newer/divergent offline save blocks cutover instead of silently losing progress. It never uploads an arbitrary client wallet to the secure API. This can intentionally require review of unsynced legacy progress; it is not a completed live-user migration.

## Deployment

- `CAFE_ACCOUNT_LIFECYCLE=enabled`, `CAFE_DELETION_KEY` (64 hex characters), server-only `SUPABASE_SERVICE_ROLE_KEY`, and the lifecycle migrations enable the standalone server.
- `APPLE_AUTH_CLIENT_SECRET` must be a valid Sign in with Apple client secret for `com.cafeverse.oopscafe`; an App Store Connect API key is not interchangeable. Without it, Apple deletion remains closed. No key is embedded in native/web code or logs.
- Keep the deletion encryption key stable while receipts are pending. Rotation must retain a decryption path for outstanding jobs. Isolated stage derives its fallback from an existing managed server secret; production requires the dedicated key.
- Apply the marketplace migration before its cleanup constraints/indexes when that feature is deployed. Existing optional tables are detected; no economic client grants are added.
- Production needs a reviewed backend/cutover plus Apple revocation readiness. `npm run preflight` fails closed otherwise. Production channel also rejects the isolated stage URL/Sandbox.

The deployed free `cafe-secure-stage` uses **only cafe_stage_062 tables**, including its own empty backup table. It does not adopt/freeze the public live backup. The beta account endpoint can report availability independently from the disabled game-server cutover. All IAP/trade/market/auction/social flags remain false. Public `rls_auto_enable` RPC permissions were removed without disabling its event trigger.

## Validation

`npm test` includes account lifecycle, client cutover and cache tests. The lifecycle suite runs against PGlite locally and a disposable isolated schema in localhost PostgreSQL in CI. It covers rollback, interruption/restart, concurrent completion/cancel, wrong account, expired/rotated receipts, Apple revocation failure, anonymous refund handling, all existing asset hashes, and preserving the other account. Native auth/recovery compilation includes the deletion helper and receipt checks. Release compile validates the SwiftUI sheet.

Still requires: actual password/Apple deletion with dedicated disposable Auth accounts on a real device, Apple revocation credentials and test, existing offline-save reconciliation, real three-pack purchases/refunds, two-device trades, physical sound routes, production privacy/review metadata. Do not mark these PASS from unit tests or health probes.
