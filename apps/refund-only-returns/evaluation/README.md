# Refund-only Returns evaluation history v1
This deterministic, all-synthetic seed is distinct from the small January smoke scenario. It contains 48 single-item fictional orders over a two-year span, plus 26 return requests representing cancelled, dispatched, confirmed, and discarded outcomes. Catalog labels, prices, eligibility, return-window lengths, and request delays vary. No real merchant, shopper, or media data was used. The designated human provenance and licence reviewer is Xiao Cui (@2018cx); its status is not asserted as accepted.

[Coverage](coverage.json) reports month, source, real versus synthetic, distinct dates and gaps using UTC and only `ordered_at` / `created_at`. All 24 months are present, earliest date 2025-01-01 and last date 2026-12-31, for 74 distinct dates. There are intentionally unoccupied days; the coverage file is not a daily data claim. The record count is for those two entity types, excluding account, merchant, and policy configuration.

```sh
node evaluation/recount.cjs            # rederive, verify committed seed and print coverage
node evaluation/recount.cjs --generate # identical byte-for-byte re-generation
node tests/core.cjs                    # independently load and read via separate Infra and Agent MCP
```

Use the package's binding, policies and catalog and replace the bundle's dataset metadata with [evaluation/dataset.json](dataset.json). As demonstrated by the test, load [seed.json](seed.json) with `env.load_seed` and a seed clock of 2026-12-31T23:59:59Z. Read a representative case from each month through the public tools, as well as both coverage boundaries. For an earlier task starting point, use the smoke data or a task-specific truncated history; do not preload records beyond the task's own initial time. No real data anchor is applicable to fictional private purchase histories.
