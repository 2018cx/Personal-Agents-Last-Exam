# Environment Track proposal

**Proposed PR title:** `[Environment Proposal] [Learning & research] Research Library (Zotero-inspired)`

Draft proposal prepared 2026-11-16. This is a proposed environment, not an implemented or accepted contribution. Implementation ownership, budget, and maintenance arrangements remain open; publication of this draft does not commit to them. Product names identify workflow references only; no affiliation is claimed.

## 1. App and domains

- **Authors / GitHub handles (required):** @2018cx (proposal contributor). Implementation and maintenance owners are TBD and must be agreed separately before an implementation commitment.
- **Reference app or website / URL (required):** Zotero; https://www.zotero.org/ and https://www.zotero.org/support/collections_and_tags. Build an independently branded web environment inspired by its library, collections, tags, and recoverable item-management workflows, not a full clone.
- **Primary domain (required):** Learning & research
- **Secondary domains (optional):** None

## 2. What you plan to build

**✍️ Your answer (required):** A persistent research library whose correct state depends on a person's evolving project, prior annotations, and permission to share. The initial slice has six complete workflows: (1) search/filter synthetic bibliographic records; (2) add/import a record from an included catalog; (3) edit metadata, notes, tags, and reading status; (4) create/rename collections and add/remove membership without deleting the underlying record; (5) preview and export selected citations; (6) move an item to trash and restore it. Edits have explicit save/cancel states. Empty results, duplicate imports, malformed records, stale revisions, missing attachments, and expired simulated sessions are represented visibly and through the action surface.

The environment includes personal and group libraries with viewer/editor roles. A private note and an exportable citation are distinct resources: a citation-only export must not leak a private note or attachment. Permission changes and catalog corrections can be injected by a deterministic event timeline. Illustrative tasks include updating a literature collection after a research question changes while retaining earlier notes, or preparing a collaborator's citation list without exporting private annotations. These are potential uses, not separate Task Track submissions or claims of model difficulty.

## 3. Potential app connections

- **Internal personal apps (required):** Initial scope: a fixture-backed Mail inbox supplies a request or corrected bibliographic information; a Calendar fixture supplies a reading-group deadline. The library emits a local export artifact and confirmation event, not a real email. Contacts supply synthetic collaborator IDs and roles. Prefer existing PALE fixtures if released; otherwise propose thin replayable fixture adapters for review.
- **Other apps and websites (required):** Initial scope: a local synthetic paper catalog and static document previews. Deferred: live scholarly search, publisher accounts, reference-manager synchronization, and external messaging. No live paper scraping or private account data is required.

## 4. Construction plan and effort

**✍️ Work breakdown (required):**

| Workstream | Planned work and scale | Deliverable / quality check | Effort (person-days) |
| :--- | :--- | :--- | :--- |
| Web / app construction | About 7 screens/panels, 6 workflows, persistent records/notes/memberships/roles/export jobs, shared accessible form and list components. Use one transaction layer for UI and adapter. | Navigable browser app; each declared workflow has happy-path, edit/cancel, confirmation, and error evidence. UI state and action results agree. | 4–5 |
| Data and image collection | No crawling. Consult public reference documentation; record URLs/date and any reused component license. No product screenshots, logos, or paper PDFs redistributed. | Provenance manifest; dependency/license review; zero unidentified media assets. | 0.5 |
| Synthetic data and assets | 100 invented bibliographic records, 20 short document previews, 4 collections, 3 fictional collaborators, 20 request/context messages, 6 timeline variations. Include duplicates, corrected metadata, and private notes. | Seeded fixtures; unique IDs, valid cross-links, role checks, realistic distractors, and a manual realism/privacy review. No real people or claimed real publications. | 1.5–2 |
| App integrations | Mail/Calendar/Contacts fixtures plus a documented internal action/observation contract; map to the official PALE interface only after release and approval. | Replayable input/output events; export content verification; adapter/UI parity tests. Contract and adapter remain explicitly provisional until maintainers approve. | 1.5–2 |
| Validation and reset | At least 24 state/permission/error assertions, 6 browser workflow tests, 3 independent reset/replay cycles, and 2 fresh-state agent trials with failure analysis. | Snapshot hashes cover records, permissions, clock, inbox, export artifacts, and pending events. Reference traces succeed; no-op and wrong-item/private-note-export controls fail. Grader files stay outside agent-visible state. Independent reviewer reproduces one trace. | 2.5–3 |

- **Milestones, owners and dependencies (required):** Proposed order: (M1) owner and maintainer scope review; (M2) schema, fixtures, and core UI; (M3) fixture connections and documented interface; (M4) official adapter, tests, demo, and independent reproduction. Owner/implementer and independent reviewer are TBD and must be named before committing to delivery. Estimated active work is 10–12.5 person-days, approximately 3 working weeks for one implementer plus reviewer time, excluding maintainer and infrastructure waits. No related Environment PR was found in the public PR list checked on 2026-11-16. At the latest check, the proposal registry listed zero Environment proposals and Task PR #3, a cycling reading-list task rather than a research-library environment. Recheck before submission.
- **Resources and total effort (required):** 10–12.5 person-days. A local container with approximately 2 CPU cores, 4 GB RAM, and under 1 GB of fixtures/artifacts should suffice; validate this during M2. No paid datasets or hosted service required. Allow a provisional USD 25–75 for optional model trials, to be re-estimated after the official runtime/model access is known; no expenditure is authorized by this draft. Prefer MIT for newly authored code and synthetic fixtures, subject to owner approval and dependency review.
- **Scope boundary and open questions (required):** Exclude full PDF annotation, desktop extensions, live sync, public publication, real credentials, and real collaborator messaging. Preserve the useful distinction between removing a collection membership and deleting an item. Decide exact PALE adapter methods and permission fixtures with maintainers after infrastructure release; do not invent a claim of compatibility. If the proposed private-note visibility model differs from Zotero, document it as a synthetic benchmark design, not product behavior. Implementation ownership, scope, effort, and code/fixture license must be agreed before implementation; this draft does not make a maintenance or expenditure commitment.
