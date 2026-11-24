# 0.9.11 — candidate, 23 November 2026

## 0.9.19 — Build20 service delivery

Restore an immediate700ms tray/bag transfer to the service modal. Separate animation and authoritative settlement; remove serial delivery walks and the post-success blocking refresh. Bound uncertain waits, preserve request UUIDs across retries, check order status before resending, and prevent duplicate reward presentation. Add Table2 pair/triple, takeaway, delayed/error/lost response, double-tap and close/reopen regressions. See BUILD_20_REPORT.md for actual tests, video/native build limitations and distribution status.

## 0.9.19 — build19 (2026-11-24)

Supersedes the unpublished0.9.11 performance candidate at the user’s requested version. Includes the full scene/scheduler/preview/read-only-sync and lossless PNG performance changes without changing saves, artwork or verified StoreKit delivery policy. Both iOS configurations and bundled release identity now use0.9.19 /19. See QA_REPORT_0.9.19.md and RELEASE_STATUS.md for final validation and actual distribution status.


## 0.9.11 Performance — build2026112401 (2026-11-24)

Prepared from0.9.15 /18 at the user’s requested marketing version. Not yet uploaded.

- Preserve scene nodes on unchanged/wallet updates; isolate wardrobe/decor layers and reuse observers/frame nodes.
- Schedule animation on demand with absolute-time rAF; stop scene/CSS work in background and menus; coalesce passive sync.
- Reduce Melo movement duration25%, remove serial post-reward wait while retaining independent guest celebration.
- Lazy account-aware preview image cache; avoid hidden/repeated canvas encoding and read-only rollback cloning.
- Lossless generated PNG recompression saves987588bytes; original artwork and decoded pixels preserved.
- Add measured baseline/after reports and regressions; native archive/device validation remains blocked by execution environment.


- Real guest count, table capacity and ordered products separated in main/service scenes and authoritative engine. Two guests may have three ordered lines without admitting a third guest. Old orders keep their legacy definition and remain readable.
- Table service renders actual guest identities using existing assets, with product icons/names/quantities from one model. Fixed four-person illustration no longer misrepresents smaller parties.
- Central release configuration and CI mismatch/reused-build guards.
- StoreKit purchase preflight rejects payment restrictions, disconnected state, unknown products and already-pending packages.
- User authorized Sandbox purchase testing: stage IAP enabled with Sandbox-only signed transaction verifier. Production payment path unchanged; trades remain disabled.
- Current native UI/archive and GitHub write blockers are documented; no 0.9.11 TestFlight success claimed.

