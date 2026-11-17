# Mail App example

A synthetic App contribution package using the current reference manifest, tool schemas and contribution declarations. Business code is in `src/`; `plugin.cjs` exports the functions consumed by the platform.

## Run locally

Requires Node.js 18 or later; no package installation, credentials or platform source is needed.

```sh
cd examples/apps/mail
npm test
npm run example
```

Tests call the real App business functions with an in-memory fixture. They check domain behavior and errors. They do not implement or certify platform permissions, persistence, reset, concurrency, MCP transport or cross-App routing. `tests/cases.json` supplies a valid tool call for platform validation.

## Platform execution

`service.cjs` is the platform-provided entrypoint, used when this package is assembled under `apps/mail/` by the platform runner. Contributors use the local commands above; the platform executes the entrypoint and performs full integration checks. Its runtime dependency is intentionally not distributed here.

The manifest and contribution declarations retain the reference format, including host-provided lifecycle behavior. A declaration is not proof that the local fixture implements that behavior. Public sample checks and platform integration evidence are reported separately.

## Files to follow

- `app.json`, `tools.json`, `schemas/`: identity, business interfaces and data formats.
- `plugin.cjs`, `src/`: domain validation, operations, event handlers and record relationships.
- `contribution/`: capabilities, renderer, asset catalog and data provenance.
- `fixtures/`: minimal synthetic records and bindings. Policy samples are supplied with the template.
- `assets/`, `gui/`: media bytes and optional renderer.
- `examples/`, `tests/`: a local event demonstration, unit tests and platform input examples.

Data and media provenance is recorded in `contribution/dataset.json`; the inherited synthetic media review remains pending. Review asset reuse before final merge. See [the contribution guide](../../../docs/app-contribution.md).

## Business results and step diagnostics

`handleTool` still returns `{ data, result }`. The host validates and commits the data, then returns the business result through MCP. Diagnostic steps are not part of the result, tool schema or App state.

Key operations and incoming events call the optional `ctx.log(step, details)` hook through `src/diagnostics.cjs`. The helper tolerates a missing or failing hook so older hosts and standalone business use keep the same behavior. App steps describe checks and prepared changes; only the host can confirm a persisted commit. Use fixed step names and minimal IDs/counts, not message text, addresses, credentials, codes or complete records.

The local test fixture exposes `fixture().logs`. `npm run example` prints a separate `diagnostic_steps` section, and `npm test` checks successful and failed paths, unchanged results/state, and absent/failing log hooks. This collector is in-memory only: it is not the platform log service or proof of persistence.

The platform owns correlation IDs, timestamps, storage, access and retention. See [the contributor logging contract](../../../docs/app-contribution.md#business-results-and-step-diagnostics) for the division of responsibilities. Diagnostic persistence requires the host logging extension; a host without that optional extension can still run the business operations.
