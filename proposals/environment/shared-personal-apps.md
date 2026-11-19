# Environment Track proposal

## 1. App and domains

- **Authors / GitHub handles (required):** @skyve2012.
- **Reference app or website / URL (required):** Files: [File Browser Quantum](https://github.com/gtsteffaniak/filebrowser); Notes: [Memos](https://github.com/usememos/memos); Tasks: [Vikunja](https://github.com/go-vikunja/vikunja); Contacts: [Nextcloud Contacts](https://github.com/nextcloud/contacts); Messages: [Zulip](https://github.com/zulip/zulip). These inform small original PALE implementations rather than deployments or forks of the full products.
- **Primary domain (required):** Work & business.
- **Secondary domains (optional):** Social & communities.

## 2. What you plan to build

Five independent, reusable personal-App packages: **Files, Messages, Notes, Tasks and Contacts**. They complement existing Mail and Calendar and expose explicit business operations over the public MCP/Core interface. Every package includes seed/state/event schemas, bindings, fixture data, optional diagnostic hooks, original-byte media where applicable, standalone business tests and a public-runtime verification path.

The packages support file evidence and versions; household conversations and notifications; personal notes/preferences; lists, deadlines and assignments; and stable person/contact lookup. They do not infer personal authorization or encode a Task's correct answer. A Task author supplies accounts, people, histories, permissions and scenario events.

An implementation is attached for review in this same PR. Scope approval and implementation acceptance remain pending maintainer review; passing tests does not imply adoption by related proposals. [Suite guide](../../docs/personal-apps.md) and [validation evidence](../../docs/validation/personal-apps.md).

## 3. Potential app connections

- **Internal personal apps (required):** Reuse existing Mail attachment tools to move original Files bytes into a draft and then into Notes. Contacts supplies a stable person ID used by Tasks. Messages receives notifications from compatible Apps and can send to a separate Messages account. Calendar remains an independently reusable existing App; no changes to it are needed for this scope.
- **Other apps and websites (required):** A send-only synthetic order notifier illustrates an external App using the Messages receive contract. #33 Personal Document Records could reuse Files storage/versioning; #85 Kinthread could reuse Messages conversations after interface coordination. These are optional reuse candidates, not already approved dependencies. Full document-management and family-vault workflows remain with their respective proposals.

### Integration details

- **Operations and access (required):** Agent-facing stdio MCP tools declared in each `tools.json`; read-only discovery/search/get and explicit write operations. Infra-only `env.load_seed`, `env.reset`, `env.snapshot`, `env.apply_event`, `env.event_status` and `env.validate_bundle` use the unchanged public lifecycle interface. GUI files are escaped read-only reviewer renderers; the promised operational surface is MCP.
- **State and lifecycle (required):** One account per App instance, isolated by run and App ID; use separate instance state directories for two accounts of the same App. The public Core stores data/assets, versions, audit and receipts under the supplied state directory. Infra loads full history, bindings, policy and media; reset restores that loaded baseline. Writes require `expected_version` and `request_id`, return a committed revision, deduplicate retries and reject conflicts.
- **Events and notifications (required):** Every App accepts `<app>.upsert` through `env.apply_event`; update events extend history and retain existing revisions. Task scenarios supply `event.at`; ordinary writes use the run clock. Messages independently declares publish and receive for `channel.chat`, using its pinned CloudEvents JSON profile and `messages.receive` handler. It checks destination account, bound sender and conversation membership, stores text/attachments and returns a receipt through Core. Other new Apps declare no messaging directions. Missing producer `time` remains absent/null; receive and commit observations are retained separately.
- **Shared data and dependencies (required):** People and App accounts are separate IDs, supplied by the task binding. Contact display names never establish identity or permission. Core API 1.2.0 / public runtime 1.5.0 and Node 18+ are required; individual Apps need no other service or npm dependency. The combined workflow pins each new App to 1.0.0 and Mail to 1.3.0. It consumes Mail's existing tools and the Messages-owned `chat-payload.schema.json` / `router-message.schema.json`; publishers do not implement receiver storage. The public media profile handles actual bytes, MIME, SHA-256 and parent relationships with 64 assets / 1 MiB per instance.

## 4. Construction plan and effort

| Workstream | Planned work and scale | Deliverable / quality check | Effort (person-days) |
| :--- | :--- | :--- | :--- |
| Web / app construction | Five separate App packages with domain operations, events, histories and reviewer renderers; reuse public Core/MCP, not full external products | Runnable manifests, complete declared operations, valid success/error states, no changes to Mail/Calendar interfaces | Initial implementation attached; estimate 2–3 days for scope review and revisions |
| Data and image collection | No crawling or external assets in the initial scope; open-source projects are design references | Source/license links and explicit reuse decision; no third-party code/images/data redistributed | N/A: no collection |
| Synthetic data and assets | Six seed business records across the five Apps, one conversation, two people, five account bindings and one original receipt text file; dynamic update examples for each App | Schema, reference, chronological history and byte/hash checks; human review of fixture clarity and intended coverage | Estimate 0.5 day for review/enrichment |
| App integrations | Contacts → Tasks, Files → Mail → Notes, order notifier → Messages and separate Messages account A → B | Real MCP and Messaging calls; inspect destination IDs, actual bytes, source/receive times, committed version and receipt; reject invalid source/account/grant/conversation | Initial workflows attached; estimate 0.5–1 day for reviewer reproduction and revisions |
| Validation and reset | Isolated App-only tests, public-runtime MCP checks, event injection, history loading, reset, restart, authority, version/retry and media checks | Package hashes, reproducible reports, Node 18/22 CI, and base-runtime verification; manual scope/provenance review separately recorded | Estimate 1 day for independent acceptance review |

- **Milestones, owners and dependencies (required):** @skyve2012 maintains this PR and the five initial packages. First confirm the shared foundation scope and overlap with [#33](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/pull/33) and [#85](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/pull/85); then reproduce package and workflow checks and incorporate review. Expected review/revision window: one week after feedback; depends on maintainer availability. Each package remains independently reviewable.
- **Resources and total effort (required):** Estimate 4–5.5 person-days of review/revision/enrichment from the attached implementation, not a claim about elapsed authoring time. No collection or paid model/API costs. Verification uses local Node processes and temporary JSON/asset state; each instance stays within the public media limit.
- **Scope boundary and open questions (required):** Initial scope is the declared local business operations, public MCP integration and bounded media. Reviewers should confirm whether the proposed `channel.chat` payload is suitable for #85 or needs a coordinated next contract version. Files provides storage/version primitives without claiming the full #33 document workflow. Additional product protocols or richer UI can be separate scoped increments; these examples do not impose Task-specific success rules.
- **License and external dependencies (required):** MIT for original implementation and synthetic fixtures. Existing public PALE schema/helpers are reused under MIT. Reference product source/assets are not copied. No externally hosted runtime service is required. Source links and licenses are in the [suite guide](../../docs/personal-apps.md#open-source-references-and-reuse-decision).

Review using [Environment proposal criteria](../../docs/review/environment-proposal.md) and, after scope agreement, [App implementation criteria](../../docs/review/app-implementation.md). Both stages can inspect the attached tests and exact evidence without treating automated success as maintainer approval.
