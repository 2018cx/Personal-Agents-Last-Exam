# Synthetic evaluation dataset, version 1.1.0

[Evaluation rows](evaluation-v1.json) · [source/provenance metadata](dataset-v1.json) · [monthly coverage and SHA-256](coverage-v1.json). The separate default fixture is a December 2026 smoke scenario; it does not count toward this distribution.

The source is original fictional data, released under the App's MIT licence. No actual members, catalog rows, media or myTurn backend data were copied. No real-data anchor is needed for this fictional lending workspace, as the implementation review confirms. The public myTurn documentation is a workflow reference only.

The generator replays the App's actual rules for holds, desk checkout and return, renewal, rejection and FIFO promotions. The fixed history has quiet weeks and summer/holiday pickup bursts, varied morning/afternoon visits and handover delays, and four members borrowing seven of eight item types. All ten serviceable copies circulate; the remaining distinct item (the knit guide) has only a maintenance copy. Loans are returned after 1 to 12 full days, including nine late returns. Some holds are cancelled or never collected. Of six waitlist promotions, four are collected and two expire. One open loan and one open hold continue across the load point, with deadlines in the future. There is no live access or inference; the only pseudorandom choice source is the generator's checked-in seed. Terminal queue member IDs are Infra-only.

The report covers 24 of 24 months from January 2025 through December 2026, 106 distinct represented days (Asia/Shanghai), 61 holds, 43 loans and 89 desk attempts. Monthly activity and the distribution of lending outcomes are independently recounted. Undated inventory/member definitions, derived due dates and scheduled expiration dates do not count as activity. These are fictional dates and events.

```sh
# From apps/community-lending-library:
node data/generate.cjs --check
node data/coverage.cjs | diff - data/coverage-v1.json
PALE_RUNTIME_ROOT=/absolute/path/to/runtime node tests/history-core.cjs
```

The Core proof loads this exact file with `env.load_seed`, a matching binding and provenance bundle. It verifies pre-2025 denial separately, checks the live seed and its archived queue under Infra, reads the bound member's holds, loans (including returned and renewed items) and accepted/rejected desk activity through a separate Agent MCP, and checks isolation and reset. Use the baseline clock in the fixture (`materialized_at`, 2026-12-31 15:51 local) for the full history. Earlier tasks should select only already-occurred records or replay the desired prefix, preserving active relationships; they must not load the end-of-window seed and reinterpret it as an earlier session.
