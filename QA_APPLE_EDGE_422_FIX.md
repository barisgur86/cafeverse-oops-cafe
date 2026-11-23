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
