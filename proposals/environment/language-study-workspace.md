# Environment Track proposal

**PR title:** `[Environment Proposal] [Learning & research] Language Study Workspace`

## 1. App and domains

- **Authors / GitHub handles (required):** @2018cx
- **Reference app or website / URL (required):** Anki, https://docs.ankiweb.net/manual/studying, as an interaction reference for decks, answer reveal and review history. This independently branded simulator does not reproduce Anki's scheduler or import its code, branding or decks.
- **Primary domain (required):** Learning & research
- **Secondary domains (optional):** None.

## 2. What you plan to build

**✍️ Your answer (required):** A language-study workspace connecting editable vocabulary cards, a personal study plan and an auditable review schedule. Five complete workflows cover preparation through follow-up:

1. Create and edit text-only cards, organize them into decks, and suspend or restore a card without deleting its review history.
2. Select decks, target date, daily review limit and new-card limit; preview the resulting workload, then save or discard the plan.
3. Open the due queue, reveal an answer and record a learner-provided Again or Good rating; pause and resume without losing the session position.
4. Inspect history, undo the latest eligible review, correct a card and resume against its current version without duplicate counts.
5. Compare remaining cards and due work with the current plan; revise it after a changed target date or report that the requested coverage exceeds the available daily slots.

The agent manages the learner's workflow, never invents recall ratings or claims proficiency. Ratings come from explicit user input or scenario-controlled synthetic learner responses. A changed deadline must not justify silently increasing a remembered daily limit. A corrected card must not erase earlier activity or permit submitting an already-open obsolete answer form.

Scheduling is synthetic and deterministic. Each card starts at stage zero. Good advances the stage up to three and schedules the next review after 1, 3 or 7 simulated days respectively; Again resets stage zero and schedules tomorrow. One effective review per card per simulated day is allowed. Due cards precede new cards, ordered by due date then stable ID. The daily review limit includes both; the new-card limit additionally bounds first reviews. Suspension excludes a card without changing its history or due date. A target date changes plan projections, not historical results or due dates. These are test rules, not an educational efficacy claim.

Unlike research-record organization in #4, provenance reporting in #34 or general routine adaptation in #29, correctness here depends on card-level recall inputs, undo semantics, content versions and conserved daily capacity across sessions.

## 3. Potential app connections

- **Internal personal apps (required):** None. Study dates and notifications remain inside this app; no Mail, Calendar or Contacts connection.
- **Other apps and websites (required):** None. Anki is only a public workflow reference, not a runtime dependency.

### Integration details

- **Operations and access (required):** Browser GUI for decks/cards, plan preview/confirmation, review sessions and history/undo. A proposed same-state action boundary would expose equivalent operations, not a separate state store. The learner may edit their workspace; a read-only observer cannot mutate it. Platform-only setup, snapshot, reset and event injection are separate from agent operations. Exact official hooks and transport are TBD pending infrastructure release and design agreement; no API schema is promised.
- **State and lifecycle (required):** Separate reusable scheduling rules, synthetic account permissions and per-run cards, plans, review ledger, session position and clock. Reset restores the selected fixture and event cursor. Version checks reject stale writes; repeated operation IDs return the original result. Plan changes require preview/confirmation. Undo reverses only the latest effective review with no later dependent review, restores its previous stage/due date and releases its daily slot once; an audit record remains. A content correction preserves history and invalidates stale review forms.
- **Events and notifications (required):** Two platform-controlled local events: a target-date change, for example plan P1 moving from day 14 to day 9; and a content correction, for example card C12 receiving revised answer text and a higher version. In-app notices identify the affected object and change. Task scenarios choose event timing; no email, push service or external notification. Event replay must not apply a revision twice.
- **Shared data and dependencies (required):** Stable account, deck, card, plan, review and event IDs; UTF-8 text, integer simulated days and local structured fixtures. No images, attachments, real learner data or shared external accounts. A local datastore and reusable form/list components are sufficient; package choices and platform adapter contracts remain TBD.

## 4. Construction plan and effort

**✍️ Work breakdown (required):**

| Workstream | Planned work and scale | Deliverable / quality check | Effort (person-days) |
| :--- | :--- | :--- | :--- |
| Web / app construction | Four views: decks/cards, plan, review queue, history; five workflows and deterministic scheduling | Completed and aborted plans; pause/resume; suspension, correction and safe undo | 3 |
| Data and image collection | Reference documentation only; no crawling, imported decks or images | Source/reuse note; no bundled third-party content | 0.25 |
| Synthetic data and assets | Three decks, 36 original cards, two permission fixtures, seeded review histories and six scenarios | Checked text pairs, unique IDs, valid stages/dates and consistent ledger totals | 0.75 |
| App integrations | Local platform-facing setup/reset/event boundary only; no external apps | GUI/action consistency and rejected observer writes; official adapter mapping TBD | 0.75 |
| Validation and reset | Happy path, plan abort, daily limits, duplicate rating/undo, stale correction, changed deadline and permission failure | Local tests and expected-state fixtures for platform validation; reproducible snapshots and repeated-reset equality | 1.75 |

- **Milestones, owners and dependencies (required):** Design review first, then fixtures/rules, workflow construction, adapter mapping and validation. Contributor ownership and calendar dates are TBD after approval and infrastructure availability; no implementation or maintenance commitment is made. Related #4, #29 and #34 are scope comparisons, not dependencies.
- **Resources and total effort (required):** Nonbinding sizing: 6.5 person-days. Expected local resources: two CPU cores, 2 GB RAM and under 100 MB of fixtures; no paid collection, model generation or runtime services. Actual implementation resources require separate agreement.
- **Scope boundary and open questions (required):** Complete text-card study loop only. No audio, automatic translation, generated tutoring, grading inference, proficiency certification, social sharing, purchases or live synchronization. Review concurrency and adapter details require design agreement. Next step is design review, not implementation.
- **License and external dependencies (required):** Tentative MIT for any future original code and synthetic fixtures, subject to contributor approval and dependency-license review before implementation. Assets would be locally redistributable; none hosted separately. No external runtime service. Dependency versions and notices are TBD; this proposal makes no new licensing commitment.
