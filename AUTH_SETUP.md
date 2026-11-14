# Account verification and password recovery (phase 2)

Native iOS account screen supports Supabase email/password registration, confirmation callback, Apple Sign In, password recovery email and new password submission. These are live server requests, not mock accounts.

## Supabase Dashboard

1. Authentication > Providers: enable Email and Apple. Configure Apple according to Supabase's native Apple ID token documentation and match the app's bundle ID / Apple capability.
2. Authentication > URL Configuration: add `cafeverse://auth-callback` to allowed redirect URLs. Confirm email confirmations are enabled.
3. Password recovery: Supabase default recovery emails must redirect to `cafeverse://auth-callback`; the app handles `#access_token=...&type=recovery`. If customizing the template to use `token_hash`, use `cafeverse://auth-callback?token_hash={{ .TokenHash }}&type=recovery` and verify the Supabase project accepts this redirect/template.
4. Ensure the project's URL and **publishable** key in `iOS/App/Info.plist` are correct. Never embed service-role keys.
5. Apple Developer / Xcode: enable Sign in with Apple capability for the matching bundle identifier and configure signing team.

## Device checks (not yet run)

- Register with an email address; confirm email received; tap link on iPhone; sign in.
- Tap Forgot password, enter registered email, open recovery link on same iPhone, choose a new 8+ character password, and log in using it. Check that the old password fails.
- Sign in with Apple on a physical iPhone, log out, and sign in again. Test Hide My Email as well.
- Verify invalid/expired links, rate limits, and offline errors.

`npm test` tests JavaScript and backend only. Swift compilation and real Supabase/Apple device verification require a signed iOS build and are **not** asserted here.

## 0.3.7 login correction — 2026-11-14

- Native iPhone 17e build and launch passed. Empty-email validation and invalid-credentials handling were exercised in the simulator against the live server; no account was created.
- Sign-up now accepts a returned authenticated session where supported. Obfuscated duplicate OAuth sign-up responses no longer claim that a confirmation email was sent.
- Failed login keeps the entered password so it can be corrected. Server error codes have specific Turkish feedback. Apple simulator errors explain the Apple-account requirement.
- The existing owner account is listed with Apple as its provider. Adding a password to that same account requires the owner's recovery/sign-in flow and password entry; it was not done by the agent.
- Custom SMTP is still absent. General-user email delivery and a successful owner login are not asserted. The owner was asked for authorization to send one recovery message to the existing account address.

## Recovery presentation fix

Recovery now takes precedence over an existing signed-in session. A callback arriving during session restoration is queued and replayed. PKCE recovery responses open password entry instead of accepting a game session. Successful password change clears the old local session and returns to login. Cancel preserves an existing account session.

macOS `npm run test:auth-routing` compiles the actual CafeAuth implementation with native routing fixtures. Passed: existing session recovery, busy restore callback, short password rejection, cancel preservation and unrelated URL rejection. Tests use synthetic tokens, make no network calls and write no credentials. The signed iOS simulator build also passed. The owner must still set their password in the updated app; no password has been assigned by the agent.
