# Two-account / two-device trade acceptance

Status: NOT RUN on physical devices. Local secure-economy integration suite rerun on 20 November 2026: PASS. Its accounts are synthetic and PGlite serializes connections; it is not evidence of real-device or multi-connection acceptance.

Prerequisites: two controlled physical devices, two distinct authenticated test accounts, isolated authoritative backend with trades enabled only for the test cohort, and a build pointing to that backend. Current public beta trade flag remains off. Do not migrate or mutate existing player saves for this test.

Record build, device/OS, account aliases (no tokens/passwords), initial ingredient quantities, offer ID, expected/final quantities and actual result for each step:

1. A finds B by café code; unknown/self codes are rejected.
2. A offers 2 milk for 3 berries. Offered stock enters escrow exactly once; coin balances stay unchanged.
3. B sees the offer after reopening the app. Accept it; A receives 3 berries and B receives 2 milk exactly once. Reopen both apps and confirm persistence.
4. Repeat accept/double tap/retry after a dropped response: no second transfer.
5. Reject and cancel separate offers: escrow returns once; unauthorized third account cannot act.
6. Attempt insufficient stock: neither inventory changes.
7. Accept on B while cancelling on A: exactly one final outcome and conserved ingredient totals.
8. Disconnect B before acceptance; reconnect and reload before retry. No local-only transfer; authoritative final state agrees on both devices.
9. Leave B offline across app restart: pending offer remains available until expiration. Verify expiration on a disposable test environment without changing production clock/data.
10. Inject a database failure only in an isolated test harness: neither inventory changes. Production fault injection is forbidden.

Attach actual evidence before marking PASS. Local integration already exercises successful transfer, escrow, replay, insufficient stock, unauthorized settlement, acceptance/cancellation, expiry and rollback. Physical-device results remain pending, and this checklist does not authorize opening public trades.
