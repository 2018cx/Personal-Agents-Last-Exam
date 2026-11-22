# Research Library: first runnable milestone

Local implementation of the standalone first milestone from PALE [Environment PR #4](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/pull/4), based on approval of `74892fc606cff01f398424134ade3f0165a72351`. The original proposal is unchanged. The package declares App ID `library` (its tool namespace), version 0.1.0, and no external App or service dependencies.

Implementation lead: **Xiao Cui (@2018cx)**. This does not assign ongoing maintenance.

## Run the first milestone

Requires Node 18+ and the public PALE runtime 1.6.0 / Core API 1.2.0 in a separate checkout pinned at commit `61b637164e4abddf81536bb48935cdb688a69ff1`. The approved proposal branch predates that runtime and intentionally does not vendor it.

From the root of the proposal branch, set `PALE_RUNTIME_ROOT` to the upstream checkout's absolute `runtime/` directory. Then run:

```sh
node --test apps/research-library/tests/business.test.cjs
node "$PALE_RUNTIME_ROOT/cli.cjs" verify --app apps/research-library --output /tmp/research-library-verify.json
node apps/research-library/tests/core-demo.cjs
```

The first command tests App handlers. The second uses the real public PALE verifier; confirm that the JSON report says `passed: true`. The third runs a deterministic synthetic scenario via the upstream `Client` against separate Agent and Infra stdio connections over the same temporary App instance. There is no network service, install step, external model call, or live customer data. For manual inspection, the App's `service.cjs` is a launcher for the upstream runtime; consult that runtime's supported flags and choose a synthetic state directory.

### Scope and expected evidence

- Agent business tools: `library.search`, `library.get`, `library.catalog_search`, `library.import`, `library.save_record`, and `library.save_note`. Reads return observed Core versions. Writes take `expected_version` plus a retry-stable `request_id`; edits also require the record revision. To retry a lost reply, send the exact same arguments. A fresh action must use a fresh ID; stale writes require read-back and renewed user intent where relevant rather than blind retries.
- Account actor is derived from the Infra identity binding, never from an Agent tool parameter. An editor grant for one library does not authorize other libraries. Reads of shared records show only the bound actor's own private notes. Imports create one record per library/catalog item. Agent tools cannot seed, grant, snapshot, reset or advance virtual time.
- The seed binds one actor as a viewer of a group library. The Agent reads authorized records, is denied an import, and cannot read a different private library or another author's note. Infra applies the offset-bearing `library.permission_change` event between calls, after which a pre-event version is stale. With the refreshed version, the Agent imports and edits a synthetic record, writes its own private note, and verifies via Agent read-back. The scenario also confirms exact replay, conflicting replay, duplicate import denial and session expiry.
- Infra uses an evaluator-only snapshot for evidence. Reset on the latest version restores seeded data/resources/virtual clock while creating a new epoch and not retaining prior request/event receipts. No whole-run restore or other App state is implied.
- This first milestone is a backend runnable slice, not full approved scope or merge readiness. No Web Host GUI/browser acceptance, collections, citations/export, trash/restore, catalog correction event, optional personal-App integrations, model evaluation, or independent replication is claimed. Those belong to later milestones in the approved plan.

## Provenance and licensing boundary

Newly authored App business logic, Tool schemas, seed data, demo and tests are released under [MIT](LICENSE). The two seeded bibliographic records, their catalog entries, role grants and note were authored as fictional examples; none were scraped or copied. The package compatibility envelopes `app.json`, `contribution/{contribution,dataset}.json`, `schemas/state.schema.json` and the bundle/resource/asset-catalog/asset-descriptor/dataset/quality schema files are derived from the pinned upstream App template or copied from its Contacts package for compatibility; see `UPSTREAM-MIT-NOTICE` for their original MatrAIx.ai MIT notice. No upstream licensing is changed. The synthetic data source is marked MIT and permitted; human review of dataset quality remains pending. No production hosting, maintenance appointment, or final acceptance is claimed.
