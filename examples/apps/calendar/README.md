# Calendar App example

A synthetic App contribution package using the current reference manifest, tool schemas and contribution declarations. Business code is in `src/`; `plugin.cjs` exports the functions consumed by the platform.

## Run locally

Requires Node.js 18 or later; no package installation, credentials or platform source is needed.

```sh
cd examples/apps/calendar
npm test
npm run example
```

Tests call the real App business functions with an in-memory fixture. They check domain behavior and errors. They do not implement or certify platform permissions, persistence, reset, concurrency, MCP transport or cross-App routing. `tests/cases.json` supplies a valid tool call for platform validation.

## Platform execution

`service.cjs` is the platform-provided entrypoint, used when this package is assembled under `apps/calendar/` by the platform runner. Contributors use the local commands above; the platform executes the entrypoint and performs full integration checks. Its runtime dependency is intentionally not distributed here.

The manifest and contribution declarations retain the reference format, including host-provided lifecycle behavior. A declaration is not proof that the local fixture implements that behavior. Public sample checks and platform integration evidence are reported separately.

## Files to follow

- `app.json`, `tools.json`, `schemas/`: identity, business interfaces and data formats.
- `plugin.cjs`, `src/`: domain validation, operations, event handlers and record relationships.
- `contribution/`: capabilities, renderer, asset catalog and data provenance.
- `fixtures/`: minimal synthetic records and bindings. Policy samples are supplied with the template.
- `assets/`, `gui/`: media bytes and optional renderer.
- `examples/`, `tests/`: a local event demonstration, unit tests and platform input examples.

Data and media provenance is recorded in `contribution/dataset.json`; the inherited synthetic media review remains pending. Review asset reuse before final merge. See [the contribution guide](../../../docs/app-contribution.md).
