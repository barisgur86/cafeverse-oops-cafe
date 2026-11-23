# Apple verification 422 — 23 November 2026

Affected app: TestFlight 0.9.15 (15). Previous app upload succeeded at 21:37 Europe/Istanbul and Apple tester email at 21:39 confirmed availability. This correction is server-only; no new iOS build or upload was made.

## Evidence and cause

Purchase credits and Apple notifications returned 422 around 22:39–22:40. The original verifier swallowed the underlying error. Supabase's hosted runtime has incomplete node:crypto X509Certificate methods; Apple library 3.1.0 uses these for every JWS. Runtime probe after correction confirmed edgeVerified=true, nativeX509Ready=false with the real pinned public Apple root. This reproduces the compatibility problem reported at https://github.com/supabase/edge-runtime/issues/761 .

## Correction

Added apple-edge-verifier.mjs: jsrsasign decodes/verifies certificates and exposes the certificate operations missing on Edge. The inherited official Apple library continues to enforce the pinned root, both certificate signatures, intermediate CA flag, Apple marker OIDs, validity dates, current-date online OCSP and cache. JWT is restricted to ES256. Bundle/environment/account token/product/quantity/transaction checks remain in AppleVerifier. No unsigned fallback or online-check bypass exists. Transient OCSP failures remain unfinished and return retryable 503 for purchase credit.

Pinned already-resolved jsrsasign 11.1.5 and jsonwebtoken 9.0.3 as direct dependencies; lockfile root declarations match existing locked packages. Added bounded error-code-only diagnostics: no receipts, account IDs, signed payloads or raw exception messages logged.

## Validation

PASS full npm test: outputs/qa-apple-edge-full.log (task outputs), exit 0. PASS additional limited-runtime regression: outputs/qa-apple-edge-limited.log. Tests compare official Node and Edge-adapted fixture decisions: all three products, wrong signature, changed payload, wrong root/bundle/environment, missing Apple marker, expired certificates, both OCSP checks invoked, temporary verification failure, and successful full fixture verification with native raw/toString/verify/infoAccess/checkIssued forced to throw ERR_NOT_IMPLEMENTED. Existing atomic credit, duplicate, ownership, cancellation/pending/recovery and refund tests remain passing. These are cryptographic/DB fixtures, not actual Apple purchases.

Hosted deployment: cafe-secure-stage v15 ACTIVE. Ten existing deployed files were preserved byte-for-byte; only verifier, entrypoint/import map and new adapter changed relative to v13. v14 was diagnostics-only. Same Sandbox-only IAP and account authentication gates retained; no user data/migration/manual coin credit performed.

PASS deployed health: ready=true, Sandbox, iap=true. PASS startup pinned-root signature adapter; native X509 methods unavailable. PASS invalid notification HTTP 422. No negative smoke result is represented as proof of a genuine Apple payment. Actual pending receipt delivery/OCSP success still requires the game's recovery request; the user was asked to press Check purchases, without buying again. No receipt is finished without durable credit.

Advisors reviewed: existing private stage RLS-without-client-policies information, legacy authenticated SECURITY DEFINER RPC warning, and leaked-password-protection warning were not changed by this verifier fix. Remediation references: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy , https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable , https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

Rollback: redeploy original v13 file snapshot retained in this session, or revert the verifier commit and deploy the previous manifest. Reverting restores the known verification outage; it does not alter balances.

## Follow-up: complete OCSP responder compatibility (hosted v16)

The first fix (v15) did not resolve the real user's receipt. New requests at 23:11–23:12 still returned ERR_NOT_IMPLEMENTED. The remaining native X509Certificate construction was inside the inherited checkOCSPStatus: the OCSP response signer certificate was still created natively and verify()/toString() failed. The initial test replaced OCSP with a callback and therefore missed this path.

Corrected checkOCSPStatus using Apple's MIT-licensed implementation (APPLE_LIBRARY_NOTICE.txt), replacing its responder certificate objects with EdgeCertificate and using native fetch/AbortSignal. All responder authorization, OCSP purpose, signatures, certificate identity, good/revoked status, time skew and freshness checks remain enforced. Compare direct issuer signing keys by SPKI bytes, not JS object identity. OCSP GeneralizedTime emitted by jsrsasign includes T/Z; date parsing now handles it explicitly and rejects invalid dates instead of permitting NaN freshness comparisons.

New regression fixtures generate signed OCSP responses with ephemeral delegated responders and issuer keys, never shipped or committed. PASS: good delegated and direct issuer signatures; revoked/unknown/expired/bad signature/wrong certificate reject; malformed dates reject. The complete JWT + pinned certificate chain + both signed OCSP responses passes while native X509 raw/toString/verify/infoAccess/checkIssued all throw ERR_NOT_IMPLEMENTED. No OCSP stub is used for this full-path test. This validates generated fixtures, not a live Apple payment.

Full npm test exit 0: outputs/qa-apple-ocsp-full.log. Targeted fixture log: outputs/qa-apple-ocsp.log. Hosted v16 ACTIVE, hash 4574b3ed194d7b6036b362faf6bafeed5dbb264fa38d6876ce670cc60d9afda6; health ready=true / Sandbox / iap=true. Only adapter plus upstream license notice changed from v15; no iOS update, player data or coin balance mutation. Asked user to recover existing pending purchases again. Actual receipt success remains unconfirmed until a new recovery request succeeds.

## Follow-up: complete hosted-runtime signature verification (v20)

At 23:23 the user's next recovery requests still returned 422, now without ERR_NOT_IMPLEMENTED. A fixed-input temporary diagnostic (no account/receipt input and no economy access) reproduced a complete generated JWS + certificate chain + two signed OCSP responses in the actual hosted runtime. v18 failed in jsonwebtoken verification (stack frames module.exports/getSecret); v19 with Web Crypto signature verification passed the identical fixture. This is stronger runtime evidence than a local Node test or an invalid-signature smoke test.

ES256 signatures are now verified using Web Crypto ECDSA/P-256/SHA-256 against the SPKI key from the fully validated pinned certificate chain. Exactly 64-byte P1363 signatures are required; algorithms other than ES256 are rejected. Official payload schema, account/bundle/environment/product checks and live signed OCSP checks remain enforced. jsonwebtoken is no longer a direct dependency/import of our adapter (still an upstream transitive dependency). Error diagnostics log bounded function names, not stack paths, messages, JWS or identities. OCSP network timeout is 8 seconds, below the app's 20-second request timeout; a timeout never credits or finishes a purchase.

A second independent live probe checks the real, public Apple WWDR G6 certificate against the pinned Apple root and Apple's live signed OCSP response. It passed under both Node and the actual hosted Edge runtime. Public certificate health accepts no input and is cached per worker; it cannot authorize purchases or access wallets.

Final deployment cafe-secure-stage v20 ACTIVE, hash aa6bb67f18d6adb9b4c463a79929dfb5bcf6e0a91040758fba3ec4c6aa3de604. Temporary synthetic fixture route and fixture bundle were removed after proving the runtime fix. No private fixture keys were deployed/committed. Saved generated public probe data is only in task outputs/apple-runtime-public-fixture.json and is not a real Apple receipt. Root/certificate, account, economy and feature gates unchanged. Full npm test exit 0: outputs/qa-apple-webcrypto-full.log. Hosted public Apple OCSP probe returned ready=true after final deployment. No new iOS build is required for these server changes.

The shop in the existing iOS build loads pending deliveries before its catalog, so failed verification can prolong its initial loading state. The server signature failure is corrected; real pending-purchase delivery and the phone UI still require a new recovery attempt. Requested that the user close/reopen the shop and check existing purchases without buying again. No genuine Apple transaction is marked successful in this report without observed successful delivery.

## Genuine Sandbox recovery confirmed

After the user pressed Check purchases, authenticated ios-store-credit requests returned HTTP 200 at 23:29:18 and 23:29:41 Europe/Istanbul. A read-only aggregate ledger check of that recovery window confirmed exactly one credited Sandbox coins250 transaction and exactly one credited Sandbox coins750 transaction (250 + 750 = 1,000 coins). No transaction IDs, JWS, personal identifiers or account data were printed. These are real Apple-signed Sandbox recoveries, separate from fixture tests. StoreKit native finish and phone-rendered balance were not directly observed from this session.
