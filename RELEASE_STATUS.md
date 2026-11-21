# Caféverse release status — 21 November 2026

Candidate: **0.9.9 (2026112101)**, branch release/0.9.9, code b3214bc, QA correction f9d9050.
**HOLD — not uploaded / not verified stable.** Production target 1.0.0 /1 December 2026.

Final npm test: PASS (80 summary lines). Native auth/audio helper checks PASS. One-hour virtual engine soak PASS (600 guests). IAB local four-person table preparation, service, reward, cleanup and reload PASS. Assets and saves preserved.

Chrome automation and native builds BLOCKED by sandbox/process access. GitHub push BLOCKED by missing terminal authentication and inaccessible Desktop UI. Previous build /2026112004 failed codesign errSecInternalComponent. No success marker exists for the new build.

IAP/trades remain disabled pending actual Apple Sandbox and two-account/device acceptance. No production merge, stable tag, player data reset or real transaction performed.

Full evidence and coverage/limitations: QA_REPORT_0.9.9.md. Existing PR #7 is the earlier /2026112004 candidate, not current source.
