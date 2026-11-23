# 0.9.11 — candidate, 23 November 2026

- Real guest count, table capacity and ordered products separated in main/service scenes and authoritative engine. Two guests may have three ordered lines without admitting a third guest. Old orders keep their legacy definition and remain readable.
- Table service renders actual guest identities using existing assets, with product icons/names/quantities from one model. Fixed four-person illustration no longer misrepresents smaller parties.
- Central release configuration and CI mismatch/reused-build guards.
- StoreKit purchase preflight rejects payment restrictions, disconnected state, unknown products and already-pending packages.
- User authorized Sandbox purchase testing: stage IAP enabled with Sandbox-only signed transaction verifier. Production payment path unchanged; trades remain disabled.
- Current native UI/archive and GitHub write blockers are documented; no 0.9.11 TestFlight success claimed.

