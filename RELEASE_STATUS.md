# Caféverse release status — 19 November 2026

Candidate: **0.9.3 (2026111902)**. Production target: **1.0.0 / 1 December 2026**.

- P0 service identity fixed in source: every batch is bound to one registered order, table/mode and ordered customer IDs. Readiness and single settlement checked inside the same game/database transaction. Standalone unassigned delivery cannot grant rewards.
- Tables fill to four before overflow becomes one takeaway order per customer; active/preparing orders are not enlarged. More overflow waits for the next free takeaway slot.
- Audio and welcome UI fixes verified by automated tests and local browser interaction.
- Release archive succeeded **without signing**; bundled web file hash matches the final generated file. Signing was disabled only in the temporary build mirror for QA; distribution signing configuration has been restored. Repository signing settings were not weakened.
- **0.9.2 uploaded successfully** on 19 November; confirmed by Organizer UI and distribution log.
- 0.9.3 signed Release archive succeeded. Upload status is recorded in outputs/qa-service-2026-11-19/delivery.json; do not infer TestFlight readiness from an archive alone.
- GitHub push/PR blocked by missing authenticated write credentials. No merge/tag or production submission performed.

## Open P0/P1

P0 production gates: live server authority/cloud cutover; actual Apple purchase/refund and agreement readiness; account deletion/Apple revocation; privacy/KVKK/support/App Store review metadata.
P1: physical device sound/routes/silent switch and real-device gameplay acceptance; unfinished social and progression items from the master plan.
Unverified IAP/trade/market/auction flags remain closed. No live database deployment or player-data migration was performed.

## Data compatibility

The new serviceOrders/serviceAdmitted fields are additive JSON save fields initialized lazily. No table/schema migration is required. Existing ready preparations can be adopted into matching orders without charging stock/coins twice. Old financial balances, recipe IDs and saves are preserved. The inactive D1 service endpoints fail closed because they cannot verify this new contract; they must not be used to bypass the authoritative engine.

See qa/2026-11-19-delivery.md and outputs/qa-2026-11-19 for evidence.

## P0 service follow-up

Welcome/arrival/order stages, existing table/takeaway reference artwork, live counters and departure cleanup restored. Asset hashes unchanged. See qa/2026-11-19-service-restore.md for the 15-item acceptance matrix and test scope.
