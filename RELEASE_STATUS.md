# Cafeverse 0.9.19 (21) — candidate

Fixes canonical seated guests/occupancy, independent door pickup and arrival retry, synchronized entrance queue and complete balloon reset while retaining Build20 delivery idempotency/timeout controls. Branch `fix/seating-pickup-door-build21`; based on verified TestFlight20.

Tests: **PASS**, full npm test exit0 and expanded acceptance results in task outputs/release-0.9.19-21/npm-test-final.log, acceptance.log and delivery.log. Original artwork hashes preserved. See BUILD_21_REPORT.md for actual coverage and limitations.

TestFlight backend: deployed cafe-secure-stage Edge version21; health contract PASS, unauthorized access401, all non-engine/non-health modules unchanged. No direct player data writes or schema migration. Existing production deletion/revocation prerequisites remain unconfigured; production preflight blocked and no production release performed.

Native Release attempt: BLOCKED by sandboxed Swift macro plugin, exit65. Physical iPhone/Simulator and recording: NOT RUN. Static shared-SVG preview inspected; browser recording runner prepared but Chrome cannot launch in this execution session.

Build21 uploader prepared at task outputs/Cafeverse-0.9.19-Build21-TestFlight-Yukle.command, with automated tests, Sandbox policy, video check, archive codesign and exact0.9.19 /21 guards. No Build21 upload or Apple mail confirmed. Last confirmed TestFlight available remains20.

Git commit/push/PR status is recorded after final validation; no remote success is assumed.
