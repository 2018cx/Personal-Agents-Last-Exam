# Contributing an App

Build an App package that tasks can populate and use. Start from the complete [Mail](../examples/apps/mail/) or [Calendar](../examples/apps/calendar/) example, implement your business behavior, and submit the package with reproducible tests. The examples use the proposed reference format; the final platform interface is subject to maintainer review.

## Start with a proposal

Complete the [Environment proposal](../proposals/templates/environment-proposal.md) with the App workflows, connections, data, dependencies and construction plan. Follow the repository's [review and implementation process](../CONTRIBUTING.md#review-and-implementation). After design approval, add implementation and evidence to the same PR.

App authors define what their app does and which data it accepts. A task supplies its particular user records and scenario events. The platform loads the package and runs integration checks. You do not need the platform's Core or Infra source to write or locally test your App.

## Repository location

Reference implementations live in `examples/apps/<app-id>/`. This directory can accept additional complete examples. Copy the closest example into a new App directory and update the App ID, file references, schemas, fixtures, handlers and tests together. Maintainers confirm the final delivery location for an accepted environment before merge.

```text
examples/apps/<app-id>/
├── app.json                  # Package identity, versions and entrypoint/file references
├── package.json              # Local test and example commands
├── tools.json                # Business operations, input/output schemas and read/write effects
├── service.cjs               # Platform-provided launch bridge; used by the platform runner
├── plugin.cjs                # Exports the App functions expected by the host
├── src/                      # Your domain model, business operations and event handlers
│   └── diagnostics.cjs       # Optional ctx.log wrapper; no storage or private platform dependency
├── schemas/                  # Seed, state, events, resources and optional messaging formats
├── contribution/
│   ├── contribution.json     # App capabilities, dependencies and independent send/receive declarations
│   ├── gui.json              # Optional renderer and media slots
│   ├── assets.catalog.json   # Asset IDs, files, MIME types and parent-record relationships
│   └── dataset.json          # Data/media sources, generation method and quality checks
├── fixtures/                 # Minimal synthetic data and references for reproducible checks
├── assets/                   # Actual image, audio, video or observation bytes used by the fixtures
├── gui/                      # Optional App renderer; layout and connections are supplied by its host
├── examples/                 # Executable local walkthrough and valid event/message inputs
├── tests/                    # Business tests and sample inputs for platform validation
├── README.md                 # Setup, commands, workflows, dependencies and limitations
└── LICENSE                   # Code license; record data/media reuse terms in dataset.json
```

The examples retain host-supplied policy samples and lifecycle declarations from the reference format. Contributors describe business effects and object relationships. The platform supplies credentials and applies access policies.

## Implement the App

Keep `plugin.cjs` small and place business logic under `src/`. The reference entrypoint exports `validateSeed`, `handleTool`, `applyEvent`, `records`, `objects` and `references`; Apps with attachments also export `assetReferences`. Internal folders may grow with the App.

`handleTool` receives a context, a working copy of the App data, an operation name and arguments. Return the resulting data and business result. `applyEvent` applies a declared event to the working copy. `validateSeed` checks domain consistency, such as account ownership, unique record IDs, calendar ranges and cross-App references. The host validates the declared interfaces and controls persistence.

Describe the operations accurately in `tools.json`, including what each operation reads or changes. Keep the seed and event examples consistent with their schemas. Provide relevant failure cases, such as editing a sent email, scheduling an overlapping event or receiving data for the wrong account.

For messaging, declare `publishes` and `receives` separately. Mail implements both directions for text email. Calendar has neither direction, while still accepting a calendar update event. A sender uses the receiver's versioned message format; the platform resolves recipients and performs delivery. The examples use MCP for platform calls and CloudEvents for the message envelope. Neither declaration by itself grants access.

## Business results and step diagnostics

Keep two channels separate:

- **Business result:** the App returns `{ data, result }`; the platform validates and commits data, adds its existing status/version fields and returns the result through MCP. Existing `tools.json` output schemas remain the contract for Agent observations.
- **Step diagnostics:** App code reports selected checks and prepared changes through an optional host hook. The platform records these separately for maintainers and Infra; they are not returned to the Agent or added to business state.

```js
const { log } = require('./diagnostics.cjs');

log(ctx, 'mail.send.validated', { message_id: message.id });
// Prepare changes to the working data copy.
log(ctx, 'mail.send.prepared', { message_id: message.id });
return { data, result: { id: message.id, simulated_delivery: true } };
```

The template helper calls `ctx.log(step, details)` when provided and ignores logger failures. It does not store logs or implement Core. The hook is an optional additive extension: the App/Core API version, manifests, tool results and existing JSON schemas are unchanged. Hosts without the extension run the same business logic without collecting internal steps.

### What the App records

Use fixed, App-prefixed step names such as `mail.send.validated`, `mail.deliver.prepared`, `calendar.update.conflict_checked` and `calendar.upsert.prepared`. Report the key decision points needed to explain a result, not every line of code. Record only minimal, non-sensitive metadata:

- Stable object identifiers using `*_id` keys and a controlled `operation` name.
- Nonnegative integer counters using `*_count` keys.
- Boolean `found` / `conflict`, and `changed_fields` containing field names without values.

Do not log message bodies, subject lines, email addresses, event descriptions, authentication codes, tokens, raw requests/results or full state. Do not copy private content into an ID field. The platform bounds and filters metadata; this does not replace the author's responsibility to select safe diagnostic information.

A `prepared` step is not proof of success. Later schema validation or persistence can reject a change. The host records the final outcome. App errors should keep their earlier diagnostic steps; diagnostics must not alter the business return or turn a rejected operation into a success.

### What the platform supplies

The platform attaches trusted App/run/call identity, request/event correlation where available, real timestamps, virtual time and an ordered sequence within a call. It records a separate outcome after persistence, including rejection and duplicate attempts. Repeated requests must not rerun business steps merely to generate logs.

In the local reference host, valid MCP tool calls write separate per-App JSONL diagnostic files under the configured run state directory. They are not exposed by Agent tools or resource discovery. Infra/maintainers access the files through the host. App reset does not erase them; deleting the run directory does. Central collection, retention/rotation, remote access control, dashboards and alerts remain deployment responsibilities. The sink is best-effort: a diagnostic storage error emits a host warning without changing an already determined business result. This is not a transactional audit archive or automatic tracing of every internal function.

### Local verification

`tests/harness.cjs` supplies an in-memory `ctx.log` and exposes `fixture().logs`; `fixture({ logging: false })` exercises compatibility without the hook. The fixture does not manufacture platform commit receipts. `npm run example` displays the event's diagnostic steps separately from before/after business data. Tests compare logging-on/off results and state, retain partial steps on failure and verify that log-hook errors do not affect business behavior.

For an Environment proposal, use the existing **Validation and reset** workstream to identify key success/error scenarios and the diagnostic evidence reviewers should be able to inspect. Authors do not need to propose logging infrastructure, token policies or retention settings.

## Data and media

Put minimal reusable App records in `fixtures/`. A task can replace them with its own scenario data. A fixture is an example, not the full evaluation task.

Records reference attachments by asset ID. Declare file paths, MIME types, integrity information and record associations in the catalog; store the actual bytes in `assets/`. Distinguish UI assets from content attachments. Record sources, reuse terms and generation methods in `dataset.json`. Synthetic or collected example data needs the same consistency and provenance checks.

## Check your App locally

The reference examples require Node.js 18 or later and no external packages:

```sh
cd examples/apps/mail
npm test
npm run example
```

Run the same commands in `examples/apps/calendar`. The tests call the real App business functions using small in-memory fixtures. The example command applies one sample event and prints the before/after data. Both commands exit unsuccessfully when an assertion or operation fails.

Use the included tests as a pattern for your App. Cover successful workflows, representative invalid inputs, missing records, duplicate IDs, domain constraints, event handling and record/media associations. Keep source fixtures unchanged between runs. Document additional dependencies and commands in the App README.

Passing local tests establishes that the tested business behavior works. It does not establish that the package is accepted or that platform permissions, persistence, isolation, retries, lifecycle operations or MCP transport have passed validation.

## What to submit

Submit the App directory, its README, license/provenance records, declared interfaces and schemas, minimal fixtures, examples and tests. Include the exact local commands, runtime version and test output. Provide valid operation/event inputs and expected outcomes so the platform can reproduce your workflows. Use the Mail and Calendar `tests/cases.json` and `examples/scenario.json` as small examples.

The platform review runs the submitted package with the internal host. It checks startup and tool discovery, actual calls, initial data loading, state changes, reset/snapshot, event application, access boundaries, retries and concurrency where required by the approved scope. Messaging Apps also need delivery and receipt checks. When the logging extension is enabled, reviewers also verify separate diagnostics for successful, failed and duplicate calls, correct run/App correlation, and unchanged MCP results and business state schemas. Reviewers return results against the submitted revision through the existing PR review process.

The repository's acceptance criteria remain the source of truth. Local checks and platform validation evidence are separate parts of the delivery.
