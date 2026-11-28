# Subscription Exit evaluation history (v2)

Origin: **100% original synthetic, MIT**. No external account data or media; explanation derived from public product documentation only. Synthetic December 2026 records are simulated, not observed. A November real-data anchor does not apply to these fictional private accounts (see #20 delivery review).

- Source: `accounts-v1.json`, SHA-256 `84a499704d9e49b1a5aebbd290f3e342c42eb54bd207a2d1da030e6d98f6acb1`. Six independently bound, overlapping subscriber histories with distinct billing anniversaries, load clocks, saved-entry times and varied cancel/withdrawal patterns. Three start active, one starts with revocable cancellation, and two start shortly after documented paid access ended. The smoke defaults are not counted.
- Occurrence fields: `history.at`, `saved.saved_at`, `action_receipts.confirmed_at` (UTC); 80 dated records; 70 global distinct days; 2025-01-01–2026-12-31. Distinct dates by record source: history 53, saved 18, action_receipts 9.
- 24/24 months. No missing months, malformed or out-of-window counted dates. Preview creation is an intermediate action and excluded; scenario clocks, future period/renewal boundaries and receipt effective dates do not count again.
- Before each independent run, load only that account through `env.load_seed` with its exact `binding`, `seed`, and `virtual_now`. Keep the run policy and replace the old smoke bundle's dataset expected count (saved + history + previews + receipts). `node tests/core.cjs` verifies all six loads and reads via real public Agent MCP; no later records are exposed to an earlier first session.
- Recount actual delivered bytes: `node evaluation/build.cjs --check`. Deterministically rebuild the dataset and report: `node evaluation/build.cjs`.

| Month | Subscription history | Saved entries | Confirmation receipts | Distinct dates (dedup) |
| --- | ---: | ---: | ---: | ---: |
| 2025-01 | 1 | 1 | 0 | 2 |
| 2025-02 | 1 | 0 | 0 | 1 |
| 2025-03 | 1 | 1 | 0 | 2 |
| 2025-04 | 2 | 1 | 0 | 3 |
| 2025-05 | 2 | 1 | 0 | 3 |
| 2025-06 | 2 | 0 | 0 | 2 |
| 2025-07 | 2 | 0 | 0 | 2 |
| 2025-08 | 2 | 0 | 0 | 2 |
| 2025-09 | 2 | 0 | 0 | 2 |
| 2025-10 | 4 | 0 | 2 | 4 |
| 2025-11 | 3 | 2 | 0 | 4 |
| 2025-12 | 4 | 2 | 1 | 6 |
| 2026-01 | 5 | 2 | 1 | 7 |
| 2026-02 | 1 | 1 | 0 | 2 |
| 2026-03 | 1 | 0 | 0 | 1 |
| 2026-04 | 4 | 1 | 2 | 5 |
| 2026-05 | 2 | 1 | 0 | 3 |
| 2026-06 | 1 | 1 | 0 | 2 |
| 2026-07 | 1 | 0 | 0 | 1 |
| 2026-08 | 2 | 1 | 0 | 3 |
| 2026-09 | 2 | 1 | 0 | 3 |
| 2026-10 | 4 | 1 | 2 | 5 |
| 2026-11 | 3 | 0 | 1 | 3 |
| 2026-12 | 1 | 1 | 0 | 2 |
