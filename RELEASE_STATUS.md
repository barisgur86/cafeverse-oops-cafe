# Caféverse release status — 19 November 2026

Candidate: **0.9.5 (2026111906)**. Production target: **1.0.0 / 1 December 2026**.

- P0 service identity fixed in source: every batch is bound to one registered order, table/mode and ordered customer IDs. Readiness and single settlement checked inside the same game/database transaction. Standalone unassigned delivery cannot grant rewards.
- Tables have four seats and accept parties of 1–4 before overflow becomes one takeaway order per customer; active/preparing orders are not enlarged. More overflow waits for the next free takeaway slot.
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

## Master stability follow-up

Partial-party seating, world-layer arrival/departure, arriving-slot reservation and dedicated takeaway handoff fixed. Three-pack signed fixtures, UI audio handlers and translations covered. npm test PASS (49 PASS summary lines); native audio/auth math/routing PASS. See qa/2026-11-19-master-fix.md for scoped PASS/BLOCKED and remaining production gates. Final build/upload evidence is recorded separately; no production submission.

## Verified 0.9.4 delivery

0.9.4 (2026111904) signed Release + matched Web SHA PASS. Uploaded 19 November 2026 10:02:40 Europe/Istanbul; Apple ready-to-test email 10:04:29. Code SHA 96950aaa3188c0b016360852b8b96f7df6b5018e pushed. Draft PR https://github.com/barisgur86/cafeverse-oops-cafe/pull/1 has four passing checks. Xcode UI simulator build/run reached Running on iPhone 17e; simulator gameplay/login and all physical-device acceptance remain NOT RUN. Production preflight remains blocked by missing configured backend URL/cutover; native account deletion/revocation and real purchase/two-device trading remain P0.

## 0.9.5 lifecycle follow-up

Native recoverable account deletion, server reauthentication/Apple code exchange/revoke adapter, atomic escrow cleanup, anonymous refund/replay handling and guarded server-backup cutover implemented. Local account lifecycle suite has 16 scenarios; all game tests and native helper compilation pass. Free isolated stage is deployed with lifecycle metadata/RLS; public live backup is unchanged. Apple revocation is NOT configured, real Auth deletion/physical-device/real-purchase acceptance remains NOT RUN; game-server cutover and IAP/trade flags remain off. See qa/2026-11-19-account-cutover.md and ACCOUNT_LIFECYCLE.md. Current iOS/CI/distribution outcome is recorded separately after verification.

## Day 2 service stabilization

Customer/chair layer ordering, shared arrival motion, persisted departures and package-only welcome fixed without asset changes. npm test PASS (71 summary lines); virtual 30-minute lifecycle soak PASS. See QA_REPORT_0.9.5.md and qa/0.9.5-cases.json. Current signed archive/upload and physical QA not yet certified. Production closed.
