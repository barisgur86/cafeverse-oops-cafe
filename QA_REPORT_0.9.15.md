# Caféverse 0.9.15 — Build 15

Date: 23 November 2026 (Europe/Istanbul). Branch: fix/original-door-balloons-0911. Source commit: the commit containing this report (see git log -1).

## Implemented

- Marketing version 0.9.15, build 15 in central release config, package/lock and Debug/Release iOS configurations. New iOS version train uses its own build sequence; same-version duplicates/non-increasing builds and legacy unversioned history still reject. This local guard does not certify App Store Connect availability.
- Existing StoreKit 2 product.displayPrice is retained. Native and server mappings: com.cafeverse.oopscafe.coins250=250; coins750=750; coins2000=2000. No hardcoded storefront prices. Current ASC catalog metadata could not be queried; historical evidence is not a new live confirmation.
- Existing verified appAccountToken ownership, signed JWS validation, unique environment/transaction identity, atomic server ledger/wallet writes, replay responses and durable-credit-before-finish are retained. Added checks before purchase and before/after credit response so a replacement login cannot hydrate or finish the original account's late response. Unknown ownership remains unfinished; native verification and server account validation reject it.
- Explicit TR/EN pending-payment notice states no coins have been added. Existing cancellation, success and transient-error/retry notices remain translated.
- Shared model supplies actual seats/table occupancy, individual scene and selector occupancy, doorway count and active/ready package counts. Package waiting/preparing/ready details remain visible on selection. Existing counter destination and assets retained. Product preparation capacity never becomes an order-capacity denominator.

## Automated PASS

Full npm test completed with exit 0: task outputs/qa-0915.log. Generated web build also completed. Includes:

- All three package amounts/catalog-localized price strings; cancellation; pending then approval; rapid taps only one native invocation; duplicate delivery; lost committed response retry; delivery failure; finish failure; recovery isolation; late response after account change.
- Signed fixture cryptography, signature/bundle/environment/account rejection, server atomic credit/replay/refunds and persistence rollback. These are fixture/PGlite tests, not live Apple payments; serialized PGlite is not real multi-device concurrency.
- 2/4 + 3/4 + 0/4 gives 5/12 seats and 2/3 occupied tables, both scene and selectors. Pair service retains two guest identities. Package active -> ready -> served/cancelled, ready included in active and table counts unchanged; package counter route and save restore.
- TR/EN occupancy, package summary/detail and pending-payment strings. zsh syntax check of upload helper and git diff --check.

## Native / Apple / TestFlight — BLOCKED / NOT RUN

- Real Release signed archive was attempted with Xcode 27.2, generic/platform=iOS, normal signing configuration, version 0.9.15/build 15. Exit 65; ARCHIVE FAILED. Log: task outputs/release-0.9.15-15/archive.log. Root failure: sandbox-exec sandbox_apply Operation not permitted; SwiftUI StateMacro plugin-server malformed response. No signed .xcarchive exists for this build; signature verification/export/upload could not run.
- Browser small-screen TR/EN visual run attempted: task outputs/qa-0915-browser.log; Chrome subprocess closed during browserType.launch before any page test. No visual overflow or Simulator success is claimed.
- No usable App Store Connect API credential/browser-control tool exists in this session. Build 15 occupancy, current version record, live product consumable status and internal tester group availability remain unverified. No Apple build-number rejection was actually received; a local historical 0.9.11 build does not establish rejection for the new 0.9.15 train.
- No live Sandbox payment, pending Ask to Buy approval, physical iPhone restart/account switch or refund was performed. No TestFlight upload, processing completion or new tester mail is claimed.
- Read-only backend health checked: ready=true, environment=Sandbox, iap=true, appleRevocation=false. Production money remains outside this test endpoint. No backend/player data was changed.

## Prepared release handoff

Task outputs/Cafeverse-0.9.15-Build15-TestFlight-Yukle.command runs full tests, exact build guard, signed Release archive, codesign/plist validation, and export/upload using the existing normal Mac Xcode session. It preserves version/build (automatic renumbering disabled), uses a dedicated 0.9.15-15 output folder and does not reuse old upload-success markers. The helper itself has not been executed successfully. After upload, Apple processing and internal group access still require actual confirmation.

## Phone checklist (after build becomes available)

1. Confirm TestFlight shows 0.9.15 (15); sign in to the intended game account and note balance.
2. Check Apple's localized prices for 250/750/2000; buy each in Sandbox, verify the exact amount once and after relaunch. Cancel another purchase; balance must not change.
3. Test pending approval, rapid taps, connectivity loss and account switch; approval belongs to the original account and never the replacement account. Reopen original account to recover unfinished delivery.
4. Set tables to 2/4, 3/4, 0/4. Check 5/12 seats and 2/3 occupied in TR/EN on small iPhone. Prepare/serve a two-guest party; only its own order settles.
5. Take a package order while a table is selected. Active 1, then active 1/ready 1, then both 0 after delivery. All table counts stay unchanged and customer walks to the package counter.
