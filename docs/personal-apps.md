# Shared personal Apps

Five independently loadable local packages extend the Mail and Calendar references. They implement bounded, deterministic personal-App workflows using Core API **1.2.0** and the public runtime **1.5.0**. Each package is version **1.0.0**. No service account or private repository is needed.

## Choose a package

| App | Implemented business operations | Representative need / overlap |
| --- | --- | --- |
| [Files](../apps/files/) | List/search, folders, original-byte reads, immutable file versions, move/rename, trash/restore, provenance text | File retrieval and evidence in #17, #43, #53. A storage building block for #33 Personal Document Records, not its full document workflow. |
| [Messages](../apps/messages/) | Direct/group conversations, send, search/read, explicit read flags, author-only edit/retract, attachments, CloudEvents publish/receive | Shared chat in #35, #36, #38. A candidate foundation for #85 Kinthread; the shared-vault workflow and its contract still require coordination. |
| [Notes](../apps/notes/) | Create/search/read/edit, content revisions, tags/pin, archive/trash/restore, original attachments | Preferences, recipes and durable notes in #36, #38, #49, #52. |
| [Tasks](../apps/tasks/) | Lists, assignment to bound people, due times, priority/tags, blockers, completion/cancellation and explicit reopen | Daily plans and commitments in #29 and #82. A Task scenario decides what counts as an authorized commitment. |
| [Contacts](../apps/contacts/) | Search/read/create/update/archive, stable person references, multiple emails/phones, organizations and groups | Shared identity lookup for Mail, Calendar and Tasks. A display name or email is not an authorization proof. |

These are reusable capabilities, not claims that the linked proposals have adopted these interfaces. Each App runs on its own; the combined example explicitly enables the packages it needs. Mail and Calendar remain under `examples/apps/` and are unchanged.

These packages are submitted directly for code review as maintainer-provided implementations. They are bounded PALE business simulators, not full deployments or API-compatible replacements for the reference products. Passing validation establishes the declared and tested workflows, not coverage of every Task or every feature of those products.

| App | Capabilities not implemented in this version |
| --- | --- |
| Files | File-content/PDF full-text search, OCR, sharing links, WebDAV and a mounted file-preview UI |
| Messages | Threaded replies, reactions, member add/remove operations, scheduled sends and device push |
| Notes | A Markdown editor/rendering UI, collaborative editing and note sharing |
| Tasks | Recurring tasks, hierarchical subtasks and automatic due-time reminders; `due_at` is stored data, not a scheduled callback |
| Contacts | vCard import/export, duplicate-contact merging and CardDAV/device synchronization |

Reminder/push execution also needs a host scheduling/notification capability. No mounted GUI is delivered by these packages. Verify the specific operations and timing semantics a Task needs before treating an App dependency as fulfilled.

## Open-source references and reuse decision

Research checked on November 18, 2026. We use original, dependency-free PALE implementations of the selected workflows. No source files, logos, screenshots or production data from these products are redistributed. Their licenses below identify the reference repositories; this table does not relicense upstream code.

| Reference | What informed this design | License source | Decision |
| --- | --- | --- | --- |
| [File Browser Quantum](https://github.com/gtsteffaniak/filebrowser) | Browse/manage file records and preview/read original files | [Apache-2.0](https://github.com/gtsteffaniak/filebrowser/blob/main/LICENSE) | Implement ID-based folders and bounded versioned assets using PALE storage. |
| [Memos](https://github.com/usememos/memos) | Personal note timeline, content and tags | [MIT](https://github.com/usememos/memos/blob/main/LICENSE) | Implement local notes and explicit revisions; no Memos server dependency. |
| [Vikunja](https://vikunja.io/features/) | Lists, assignees, due dates and task relations | [AGPLv3 repository](https://github.com/go-vikunja/vikunja) | Implement a small state machine and dependency checks; no upstream code copied. |
| [Nextcloud Contacts](https://github.com/nextcloud/contacts) | Separate contacts/address book from Mail and Calendar | [AGPL-3.0](https://github.com/nextcloud/contacts/blob/main/COPYING) | Implement bound identities and contact methods; no CardDAV server or upstream code copied. |
| [Zulip](https://zulip.com/api/send-message) | Separate send, edit, history and read-receipt operations | [Apache-2.0](https://github.com/zulip/zulip/blob/main/LICENSE) | Implement local conversation operations and a Messages-owned receiving contract. |

The public PALE schema validator and helper patterns are reused under the repository's MIT license. App-only copies of the validator are checked against the canonical public file in the suite. Common media schema copies are checked by `npm run contracts:check`.

## Reproduce validation

Use Node.js 18 or newer from the repository root. No `npm install` is needed.

```sh
# All five packages, including isolated-folder tests and real MCP verification
npm run test:personal-apps

# Inspect the cross-App workflow report
npm run example:personal-apps

# Existing Mail/Calendar/Core/Messaging tests plus the new suite
npm test

# One package alone
node --test apps/files/tests/business.test.cjs
node apps/files/examples/run.cjs
node runtime/cli.cjs verify --app apps/files --output .artifacts/files.json
```

`runtime/verify.cjs` copies each package to a temporary location before running its business tests and event example. It then launches actual Agent and Infra MCP processes, checks discovery and restrictions, loads history, applies/retries an event, resets, and checks a second run and restarted process. This is distinct from the in-memory unit harness.

The [combined workflow](../examples/workflows/personal-apps/) verifies business writes for every App, stale/conflicting requests, original file bytes across Files → Mail → Notes, Contacts → Tasks assignment, a send-only order notifier → Messages and Messages account A → account B. It inspects the destination's real records/bytes and the Messaging receipt, including missing producer time and refused delivery.

CI runs the existing Node 18/22 matrix and the base revision's independent package validator. Reports are saved as CI artifacts. The [validation report](validation/personal-apps.md) records the local evidence. Human scope, provenance and workflow acceptance remain reviewer decisions.

## Author and operate an App

Every package follows the [contribution layout](app-contribution.md). `src/` is App-owned business logic; Core supplies persistence, MCP wrapping, optimistic version checks, policy enforcement and optional diagnostics. New Files/Notes/Messages resource registrations connect their parent object types to their read tools. They are platform-maintained registrations, not grants chosen by an Agent.

`apps.registry.json` is an opt-in local assembly of these packages and the Mail reference. Its paths are relative to the repository root; package paths cannot escape the approved registry directory. It does not change the default Mail/Calendar registry. Use it explicitly when starting a combined run:

```sh
node apps/notes/service.cjs --role agent --run demo --state-dir .state --registry apps.registry.json
node apps/notes/service.cjs --role infra --run demo --state-dir .state --registry apps.registry.json
```

Both processes use the same App state. The default `scenario` profile permits only reads. Infra can select the example `sandbox` profile with `env.reset` to enable declared writes. Real Task policies replace these examples.

All records carry creation/update times and business history. App writes use `ctx.virtual_now`; event updates use `event.at`. Infra controls advancement. Messages preserves producer `time` as `sent_at`; absent producer time is stored as `null`, while `received_at` and Core/Messaging receipts retain observed application/processing/commit times. The clocks are explicitly named, not assumed synchronized.

### Messages integration contract

Messages maintains `schemas/chat-payload.schema.json` and the self-contained `schemas/router-message.schema.json` CloudEvents profile. `messaging.publishes` and `messaging.receives` declare `channel.chat` independently. Other Apps can copy the pinned receive schema, declare publishing, and send through Messaging with a trusted account binding and explicit recipient grant.

The payload names a target Messages account and an existing conversation. Sender identity is fixed by the launch configuration; the receiver resolves its bound person and checks conversation participation. The source supplies text and optional bounded attachment transfers containing original bytes, MIME and SHA-256. Messages owns storing the resulting message and assets. Do not implement a second mailbox/chat store inside a sending App.

`messages.send` writes local outgoing state. `messages.outbound` returns a stable CloudEvent derived from that record. The host explicitly calls `router.publish` and inspects its receipt; generating an event is not delivery confirmation. The ordinary CRUD APIs and `.upsert` events of Files, Notes, Tasks and Contacts do not imply messaging support; their messaging arrays are empty.

Read-status changes preserve the outbound event ID and original `sent_at`. Content revisions or another destination produce a new event identity. Received Messages records retain optional `delivery_source` provenance, which cannot be removed by a later update event. An external notification remains received content even when its source account belongs to the same person: local edit, retract, attachment-write and outbound tools reject it. Task authors should include this provenance when seeding external historical messages.

The working surface is local MCP plus escaped reviewer renderers. This foundation intentionally stays smaller than the referenced full products; proposed extensions such as additional protocol adapters should have their own scope and tests.
