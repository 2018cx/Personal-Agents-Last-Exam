# Refund-only Returns v1 validation

Scope: [PALE #7](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/pull/7), approved proposal commit `eae4dd2625981deb4776fe2ba452717fb4e41e03`. Implementation and maintenance: Xiao Cui (@2018cx). The proposal file is not modified by this implementation.

Verified with PALE Core API 1.2.0 / runtime 1.6.0 from upstream `ae889d2cbbfc72242fc5e70b877f3f2a2f029618` and the pinned reference `61b637164e4abddf81536bb48935cdb688a69ff1` on Node 24.22.3. Optional browser driver uses Playwright and sandbox-enabled Chromium 156.0.8078.79; those are test tools, not dependencies of the App. From this App directory:

```sh
export PALE_RUNTIME_ROOT=/absolute/path/to/pale/runtime
node "$PALE_RUNTIME_ROOT/cli.cjs" verify --app "$PWD"
node tests/core.cjs
node tests/web-http.cjs
# Point CHROMIUM_PATH at sandbox-capable browser if not using Playwright's installed browser.
node tests/browser.cjs
```

- CLI validation checks the standalone package/schema/contracts, seed/reset/persistence, Agent-only business calls and denial of all Infra commands through Agent MCP. Both runtimes report 34 passing checks. Domain tests also run standalone and are included in the CLI validation.
- Live MCP scenario verifies default task permissions and separate read-only policy; custom seed history in the future fails atomically. The cutoff test first confirms an obsolete expected version returns `stale_version`, then a freshly versioned call returns `return_expired`, with exact unchanged business state. The matching pre-cutoff replay returns the original receipt without another write after advancement. Two reset/replays verify clock, receipts, entities and request history. Boundary equality remains eligible.
- Loopback Web Host HTTP plus independent Agent/Infra MCP verifies shared persisted state and that browser access cannot call administrative operations. This is distinct from browser evidence.
- Real browser clicks exercised lookup, details, preview and discard, request status, stale recovery and expiry on two fresh resets, then a pre-expiry confirmation with post-expiry cancellation. A dispatched request had no cancellation control. A separate Infra MCP process read the persisted state after each relevant transition. No money is returned or refunds executed. No external model trials or physical/merchant service was used.

For a custom seed, use `env.load_seed` with a complete synthetic bundle, an explicit `virtual_now`, and `request_id`. Example: reuse the fixture snapshot bundle when replacing only timestamps or policy; if orders or request count changes, set `bundle.dataset.expected_counts.records` to orders plus requests, and supply a binding when the account changes. Orders and historical request creation dates must be on or after 2025-01-01 and no later than the seed's initial time. Deadlines can be in the future. A LifePack task's first session starts on or after 2026-01-01; this is separate from the history floor. Order 3 illustrates allowed 2025 history, while the actual example session starts in January 2026.
