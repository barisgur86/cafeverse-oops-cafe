# Release status — 24 November 2026

Candidate **Cafeverse0.9.11 Performance /2026112401**, branch `release/0.9.11`, based on shipped0.9.15 /18 (`e2ea065`). Marketing0.9.11 is the explicit current request; main remains an older0.3.7 source. Known published0.9.11 /2026112302 and0.9.15 /18 are recorded; candidate build is higher, but Apple acceptance is unverified.

- PASS: full `npm test` exit0, new performance regressions, native auth routing/audio fixture checks, version sync, source artwork hash checks and lossless PNG equality.
- Measured: unchanged100 full scene replacements→0; hidden/menu scene callbacks→0; concurrent passive100 sync requests→1; generated assets987588bytes smaller. See PERFORMANCE_REPORT_0.9.11.md for scope, full metrics and CPU trade-offs.
- BLOCKED: signed Release archive and Simulator build attempted, exit65: `sandbox-exec: sandbox_apply: Operation not permitted`; Swift State macro plugin unavailable in this execution environment. CoreSimulator also unavailable. No successful archive claimed.
- BLOCKED: Git push credential missing (`could not read Username ... terminal prompts disabled`). Connected GitHub write fallback also returns403 Resource not accessible by integration. PR cannot be created without publishing candidate branch. No merge performed.
- NOT RUN: physical iPhone/Instruments metrics, fresh Sandbox purchase/refund on candidate, Apple processing/group distribution/email. Last confirmed shipped release remains0.9.15 (18).

Dedicated normal-Mac uploader prepared at task outputs/Cafeverse-0.9.11-Performance-TestFlight-Yukle.command. It rebuilds/tests, verifies candidate identity and codesign, archives with the existing secure backend, and uploads only to internal TestFlight. Production publishing is not requested or performed. Build folder is separate from older0.9.11 helpers so a previous success marker cannot skip this candidate.

Delivery implementation commit: `git log -1 --format=%H --grep='^perf: optimize game engine rendering animations assets and startup$'`. Prior baseline commit1ec0e24. Full changed-file list is available in that commit. Review draft is PR_DESCRIPTION_0.9.11.md; physical acceptance checklist is QA_REPORT_0.9.11.md.
