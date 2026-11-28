# Synthetic evaluation dataset, version 1.0.0

[Evaluation rows](evaluation-v1.json) · [source/provenance metadata](dataset-v1.json) · [monthly coverage and SHA-256](coverage-v1.json). The separate default fixture is a December 2026 smoke scenario; it does not count toward this distribution.

The source is original fictional data, released under the App's MIT licence. No actual members, catalog rows, media or myTurn backend data were copied. No real-data anchor is needed for this fictional lending workspace, as the implementation review confirms. The public myTurn documentation is a workflow reference only.

`generate.cjs` replays three circulation cycles per month using the App's actual hold, checkout, return, renewal, rejection and FIFO promotion behaviour. Four fictional members rotate among three ordinary cooperative items; borrowers renew before a competing queue join, and occasional declined desk attempts are followed by a newly numbered accepted attempt. The returned copy promotes a waiting member, who can cancel the promoted hold. Each date, outcome and member/copy relationship is reproduced from source, with no live requests or random draws. In the trusted seed, `renewed_at` and terminal `queue_history` retain actual occurrence times. Queue-history participant IDs are Infra-only.

Coverage: 24 of 24 months from 2025-01-01 to 2026-12-31 inclusive, 252 distinct represented days (Asia/Shanghai), 144 holds, 72 loans, 158 desk attempts and 72 archived queue entries. There is no empty month; individual days without activity are normal. Inventory/member definitions are undated. Due dates and scheduled expirations are not counted as events. No claim is made that any of the represented activity took place.

```sh
# From apps/community-lending-library:
node data/generate.cjs --check
node data/coverage.cjs | diff - data/coverage-v1.json
PALE_RUNTIME_ROOT=/absolute/path/to/runtime node tests/history-core.cjs
```

The Core proof loads this exact file with `env.load_seed`, a matching binding and provenance bundle. It verifies pre-2025 denial separately, checks the live seed and its archived queue under Infra, reads the bound member's holds, loans (including returned and renewed items) and accepted/rejected desk activity through a separate Agent MCP, and checks isolation and reset. Use the baseline clock in the fixture (`materialized_at`, 2026-12-31 13:00 local) for the full history. Earlier tasks should select only already-occurred records or replay the desired prefix, preserving active relationships; they must not load the end-of-window seed and reinterpret it as an earlier session.
