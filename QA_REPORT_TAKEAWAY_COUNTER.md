# Takeaway live counter

2026-11-23. Current source candidate: 0.9.11 / 2026112303 (includes requested 0.9.9.1 flow enhancement; no version downgrade).

Paket tab always shows active orders, including when a table is selected. Top card and package details derive counts from CafeService.view: waiting (arriving/ordered), preparing, ready. Ready is a subset of active. Terminal served/left/cancelled states are excluded. No product-capacity value is reused as an order limit; no separate concurrent package order capacity exists in current configuration, so no denominator is shown.

Existing customer motion already targets the dedicated package counter [1050,350], with chef delivery point [960,300]. Retained unchanged and covered by route regression. Admission removes that guest from the doorway count; packages never enter seated/occupied-table counts. Existing assets and saves are preserved.

PASS: full npm test (outputs/qa-takeaway-counter.log in task outputs). Added model and actual-render harness acceptance checks: 2/4, 3/4, 0/4 tables remain 5/12 seats and 2/3 occupied; package active 1 -> ready 1 (active stays 1) -> served/cancelled 0; all selected-tab variants, preparation transitions, restart and separate customer destination.

NOT RUN: physical iPhone visual test, Simulator/video, signed native build and TestFlight upload for this change. Automated tests do not substitute for these checks.
