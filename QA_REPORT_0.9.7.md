# 0.9.7 / 2026112002 — direct coin gifts

Replaces the ingredient-offer screen/menu with one coin gift flow: café code, amount, explicit confirmation. No recipient acceptance step. Recent incoming/outgoing gifts show separately by sign. Existing ingredient escrow can expire or be cancelled via the ownership-checked legacy endpoint; new ingredient trades are disabled on stage.

Only server-certified coins earned after this upgrade and gifts of those coins are transferable. Existing/imported/initial/purchased balances remain spendable but are not granted transfer provenance. New service earnings repay refund debt first. Recipient refund debt also absorbs incoming gifts before spendable/transferable credit. This prevents purchasing/refunding/forwarding the same value.

Implementation: server-owned giftable_coins column and private RLS ledger; parameterized authenticated endpoints; sorted account locks; one database transaction updates both wallets/allowances and ledger. Stable request IDs prevent duplicate credits after concurrent taps, retry or restart. Failed transactions roll back both accounts. Client reconciles a lost committed response from its own history.

Verification:
- npm test PASS: 75 PASS summary lines; not physical-device tests.
- Disposable PostgreSQL/PGlite tests cover earned-only allowance, paid exclusion, exact debit/credit, repeated ID, changed-payload replay, overspend race, opposite-direction locking, rollback, invalid/self/missing target, authenticated actor scope, private history/RLS, refund debt and actual game earning path. PGlite concurrency is serialized; hosted PostgreSQL CI recorded separately.
- Browser fixture: 25 coins sent, sender 100→75 and receiver 100→125, one history row; Turkish and English screens checked. All accounts/data are disposable local fixtures. Real accounts/devices NOT RUN.
- Stage migration earned_coin_gifts_stage applied; private client table privileges denied. Edge version 10 deployed with coinGifts=true; trades/iap/market/auctions/social=false. Existing public saves not altered.
- Native archive/TestFlight status is tracked separately in outputs/qa-0.9.7. Do not infer upload from source version.

## Verified CI and delivery limitation

Commit cb9f929 pushed to feature/coin-gifts-097; draft PR https://github.com/barisgur86/cafeverse-oops-cafe/pull/5 has four passing checks: native/test on push and pull_request. PR run 44636907921, native job 135957639716 and test job 135957640301. This is CI compilation, not a signed uploaded archive or physical-device acceptance.

Local Xcode window control timed out. The reviewed upload command was launched through Finder instead. Signed Release archive passed codesign deep/strict verification and bundled Web matched source. Apple upload and export succeeded on 20 November 2026 at 02:59:45 Europe/Istanbul. Apple processing and tester mail are separate verification steps. Terminal UI access was denied by the computer-use safety policy; only generated build/distribution logs were read. No passwords or keys were entered by the agent.

## Final TestFlight availability

Verified App Store Connect: 0.9.7 (2026112002) is in Gelistirici Testi, status Testing, expires in 90 days. Signed archive and upload PASS. This resolves the earlier local UI blocker through the reviewed Finder-launched upload script. Physical-device coin gift acceptance remains NOT RUN.
