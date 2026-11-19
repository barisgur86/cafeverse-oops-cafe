# Caféverse release status — 19 November 2026

Candidate: **0.9.3 (2026111902)**. Production target: **1.0.0 / 1 December 2026**.

- P0 service identity fixed in source: every batch is bound to one registered order, table/mode and ordered customer IDs. Readiness and single settlement checked inside the same game/database transaction. Standalone unassigned delivery cannot grant rewards.
- Tables fill to four before overflow becomes one takeaway order per customer; active/preparing orders are not enlarged. More overflow waits for the next free takeaway slot.
- Audio and welcome UI fixes verified by automated tests and local browser interaction.
- Current 0.9.3 Release archive is signed and verified; bundled web hash matches source. Earlier unsigned QA was only a historical build-mirror check.
- **0.9.2 uploaded successfully** on 19 November; confirmed by Organizer UI and distribution log.
- **0.9.3 (2026111902) uploaded successfully** at 04:03:37 UTC; Apple ready-to-test email confirmed at 04:05:21 UTC on 19 November.
- Feature commit 524de5809406fc3e703e1ad30e51bee03f8efbcb pushed using GitHub Desktop and remote SHA verified. PR creation blocked: GitHub integration returned 403. No merge/tag or production submission performed.

## Open P0/P1

P0 production gates: live server authority/cloud cutover; actual Apple purchase/refund and agreement readiness; account deletion/Apple revocation; privacy/KVKK/support/App Store review metadata.
P1: physical device sound/routes/silent switch and real-device gameplay acceptance; unfinished social and progression items from the master plan.
Unverified IAP/trade/market/auction flags remain closed. No live database deployment or player-data migration was performed.

## Data compatibility

The new serviceOrders/serviceAdmitted fields are additive JSON save fields initialized lazily. No table/schema migration is required. Existing ready preparations can be adopted into matching orders without charging stock/coins twice. Old financial balances, recipe IDs and saves are preserved. The inactive D1 service endpoints fail closed because they cannot verify this new contract; they must not be used to bypass the authoritative engine.

See qa/2026-11-19-delivery.md and outputs/qa-2026-11-19 for evidence.

## P0 service follow-up

Welcome/arrival/order stages, existing table/takeaway reference artwork, live counters and departure cleanup restored. Asset hashes unchanged. See qa/2026-11-19-service-restore.md for the 15-item acceptance matrix and test scope.
