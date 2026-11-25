# Subscription Exit v1 validation

- Reviewed proposal: [PALE #20, approved scope](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/blob/118a5f0665b5c0c9d542a722b4ed73cf371be147/proposals/environment/subscription-exit.md). Implementation and maintenance: Xiao Cui (@2018cx). No changes to the approved proposal.
- The shared runtime baseline is upstream commit `61b637164e4abddf81536bb48935cdb688a69ff1`; the current-main test snapshot is `7a05aa958c824143ab9eee1aa21c2dfacd8be31a`. Both publish Runtime 1.6.0 / Core API 1.2.0.
- Run from the App directory with Node 18, 22 or 24 and an official PALE checkout:

```sh
export PALE_RUNTIME_ROOT=/absolute/path/to/pale/runtime
node "$PALE_RUNTIME_ROOT/cli.cjs" verify --app "$PWD"
npm test
node examples/run.cjs
node tests/core.cjs
# With Playwright available to this test and a sandbox-capable Chromium:
# set PLAYWRIGHT_MODULE to a local Playwright module path if needed.
# Set CHROMIUM_PATH to an explicit binary if not using Playwright's browser.
node tests/browser.cjs
```

The public verifier covers package, schema, Agent/Infra discovery and permissions, seed policies, persistence and reset, and runs both the business suite and example. The separate Core MCP trace tests a task-supplied pending fixture, distinct read and write sessions, identity and read-only denials, exact-boundary stale revision and stale preview as separate cases, receipt replay/conflict, and two reset/replays. Business data, receipt set and revision are stable after reads and rejected writes. The clock write itself changes the Core revision; test baselines are taken after that write. Core audit may record observations and denials without changing the business revision.

The browser test uses genuine sandboxed Chromium Headless Shell 156.0.8078.79 with Playwright 1.62.1 (test tools only). It opens an account, reads plan and status, discards both action types without changing the entitlement, confirms a cancellation, reads its receipt, confirms a timely revocation, and verifies one active period transition. It twice resets, confirms a cancel, moves time to one second before period end, opens a revocation preview, advances to exact end, checks a rejected stale confirmation, refreshes to free access and confirms all three saved entries remain. An independent Infra MCP process reads Core state. No live payments, messages, external models or services are used.

Custom seeds use `schemas/seed.schema.json` plus the trusted binding and complete synthetic bundle in `env.load_seed`. When records change count, update `bundle.dataset.expected_counts.records` to saved entries plus history, previews and domain receipts. The default clock is in 2026 and original synthetic history begins on 2025-01-01. Set `policies.scenario` to the bundled read-only policy to exercise the observer case; start a fresh client for UI controls. The model-side role cannot inject clock changes or load fixtures.
