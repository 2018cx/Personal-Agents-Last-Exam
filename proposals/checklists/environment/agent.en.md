# Environment proposal checklist · agent version

Covers every field of the environment proposal template, plus the proposal-list bot, CONTRIBUTING and the PR #12 format. The human reviewer judges only H0–H5, using this report.

## How to run

1. **Read inputs.** The proposal file, the PR title and description, the environment proposal template, the current proposal list, and the PR #12 docs if the proposal adopts that format.
2. **Check E0 first.** E0 mirrors what `scripts/sync_proposals.py` reads: the PR title, the PR file list, and the proposal’s headings and field labels. Check these before anything else.
3. **Judge E1–E4.** Go through the template in order, §1 to §4. If “Applies when” is false, the verdict is n.a.
4. **Judge E5–E6.** Then the process checks from CONTRIBUTING and, if adopted, the PR #12 format.
5. **Write the report.** One row per item with failed Blockers first, then a short “For the reviewer” block for H1–H5.
6. **Hand to the user.** Do not post comments or push. The user decides what happens next.

## Rules

- A fail must quote the proposal line as path:line.
- Use unclear when the item applies but the proposal says nothing.
- Do not add requirements that are not in this list.
- Judge each field against the template’s own wording. Do not require anything the template does not ask for.
- For H1–H5, give your read and the evidence. The human makes the call.
- Author mode: write Fix as text the author can paste. Review mode: write Fix as a short review comment.

## Output

| ID | Verdict | Evidence (path:line) | Fix |
| :--- | :--- | :--- | :--- |
| E2.2 | pass | `proposals/environment/ternway-air.md:14` “A rebooking depends on the traveler’s calendar and fare rules.” | — |
| E3.4 | fail | `proposals/environment/ternway-air.md:41` “Changes are confirmed by the agent.” | Add: “A change is a preview followed by confirm; the same `request_id` returns the same receipt; a stale `expected_version` is rejected.” |
| E6.2 | n.a. | E6.1 found no overlap. | — |

### For the reviewer

- **H1 · Workflows worth building** Rebook, change seats and refund; a rebooking depends on the traveler’s calendar and fare rules (`ternway-air.md:14`).
- **H3 · Platform can build on it** Actions, reset and events are concrete, but write retries are not described (E3.4 fails).
- **H4 · Acceptable plan** Five workstreams, 34–46 person-days and one test per workflow (`ternway-air.md:60–72`).

## The template, section by section

### E0 · Bot-readable

The proposal list bot must be able to read your PR. These items mirror what `scripts/sync_proposals.py` reads.

#### E0.1 · PR title format  [blocker · PR]
In one line: PR title reads `[Environment Proposal] [<Domain>] <App or website name>`, primary domain first.
Applies when: Always.
Look at: PR title; §1 Primary domain and Secondary domains.
Pass if: Matches the bot’s `TITLE` pattern with `Environment`; the first bracketed domain equals Primary domain; other domains are joined with ` + `.
Fail if: Missing brackets, `Env Proposal`, domains in a different order from §1, or a domain name that is not in the list.
Fix: Give the corrected title in full.
Source: sync_proposals.py · TITLE; CONTRIBUTING · Proposal naming

#### E0.2 · One proposal file, right path  [blocker · PR]
In one line: The PR adds exactly one file at `proposals/environment/<slug>.md`.
Applies when: Always.
Look at: PR file list.
Pass if: Exactly one non-removed file matches `proposals/environment/[A-Za-z0-9][A-Za-z0-9_.-]*.md`; it is UTF-8 and at most 200 KB.
Fail if: No matching file or two of them (the list then shows “Add exactly one proposal file for this track”), a space in the slug, or the file under `proposals/task/`.
Fix: Name the one path to keep and the files to remove.
Source: sync_proposals.py · PROPOSAL_PATH, proposal_text()

#### E0.3 · Headings and field labels unchanged  [blocker · §1–§4]
In one line: Every template heading and bold field label is kept exactly as written, in English.
Applies when: Always.
Look at: The whole proposal file.
Pass if: `## 1.` to `## 4.` keep their numbers and text; labels keep the form `**Primary domain (required):**`, with the colon inside the bold.
Fail if: Translated or reworded headings, a label without bold, or the colon outside the bold. The bot then reads the field as empty.
Fix: Quote the broken line and the template line to restore.
Source: sync_proposals.py · field(), answer()

#### E0.4 · No placeholders, no bare TBD  [blocker · §1–§4]
In one line: No `[Fill in: …]` is left, and every TBD or N/A says why or how it will be decided.
Applies when: Always.
Look at: Every field.
Pass if: No `[Fill in:` remains; `None` appears only where the template allows it; each `TBD` and `N/A` carries a reason: who decides, when, or what it waits for.
Fail if: Any leftover placeholder, or `TBD` alone in a required field (the list shows it as blank).
Fix: List each field and the sentence it still needs.
Source: template · header note; sync_proposals.py · clean()

#### E0.5 · Primary domain spelled exactly  [blocker · §1]
In one line: Primary domain is one of the 15 domain names, character for character.
Applies when: Always.
Look at: §1 Primary domain and Secondary domains.
Pass if: The value equals one of: Money & insurance, Shopping & groceries, Travel & commuting, Health & care, Food & dining, Social & communities, Home & utilities, Public service & law, Media & entertainment, Learning & research, Work & business, News & information, Weather & outdoors, Games & play, Fitness & wellbeing.
Fail if: `Health`, `Media and entertainment`, an emoji in front, or two domains in the Primary field. The list then shows “Needs a valid primary domain”.
Fix: Give the exact name to use.
Source: README · Environment domains; sync_proposals.py · collect()

#### E0.6 · §2 first paragraph stands alone  [should · §2]
In one line: The first paragraph of §2 makes sense on its own; the proposal list shows only its first ~240 characters.
Applies when: Always.
Look at: §2, the paragraph right after `**✍️ Your answer (required):**`.
Pass if: Its first ~240 characters name the environment, the main workflows and who it is for.
Fail if: Opens with a preamble (“This proposal describes…”), so the key facts only appear in later paragraphs.
Fix: Propose a rewritten first paragraph.
Source: sync_proposals.py · answer(), escape_cell(limit=240)

#### E0.7 · PR description from the summary template  [should · PR]
In one line: The PR description uses the PR summary template, ticks Environment Track and links the proposal file; it stays Draft until ready.
Applies when: Always.
Look at: PR description; PR draft state.
Pass if: Exactly one `- [x] Environment Track`; Stage, Design file and Summary are filled; the PR is Draft while writing and marked ready when review is requested.
Fail if: The template’s entry text is left in place, two tracks are ticked, or there is no link to the design file.
Fix: Paste a filled PR summary.
Source: templates/pr-summary.md; CONTRIBUTING · Start with a proposal

### E1 · App and domains

Template §1: authors, the reference app or website, and domains from the homepage list.

#### E1.1 · Authors listed  [blocker · §1]
In one line: Every author is listed with a GitHub @handle, and collaborators are disclosed.
Applies when: Always.
Look at: §1 Authors / GitHub handles; §4 owners.
Pass if: Names and @handles for everyone who works on it, including milestone owners.
Fail if: Only the PR opener is listed while §4 names other owners.
Fix: List the missing names.
Source: template §1; CONTRIBUTING · Integrity and maintenance

#### E1.2 · Reference product and own name  [should · §1]
In one line: The reference app and URL are named as a workflow reference; the environment has its own name and copies no brand assets.
Applies when: Always.
Look at: §1 Reference app or website / URL; §4 License.
Pass if: States the reference product and URL, the environment’s own name, and that logos, trademarks and copyrighted text or images are not reused. This field is also the title in the proposal list, so it leads with the environment’s own name.
Fail if: The environment is presented as the real product, or real brand assets appear in the asset plan.
Fix: Suggest the form “<Own name>, a synthetic …; workflow reference: <Product> (<URL>)”.
Source: template §1, §4 License; CONTRIBUTING · Integrity and maintenance

#### E1.3 · Domains chosen by workflow  [should · §1]
In one line: The primary domain fits the main workflow; secondary domains are added only for workflows you actually build.
Applies when: Always.
Look at: §1 domains; §2 workflows.
Pass if: Each secondary domain maps to a named workflow in §2.
Fail if: A secondary domain added only because the app connects to Mail or Calendar. A connection alone does not add a domain.
Fix: Name the domains to drop, or the workflow that justifies them.
Source: CONTRIBUTING · Environment Track

### E2 · What you plan to build

Template §2: “Briefly describe the main workflows and why this environment would be useful for personal-agent tasks.”

#### E2.1 · Main workflows named  [blocker · §2]
In one line: §2 names the main workflows, each with what the user wants and how it ends.
Applies when: Always.
Look at: §2; §4 Web / app construction.
Pass if: Each main workflow has the user’s goal and an end state that can be checked (booked, refunded, sent). Change, cancel and error paths are mentioned where the reference product has them.
Fail if: A feature list (search, filter, cart) with no end states.
Fix: Rewrite one workflow as goal → steps → end state, as a model.
Source: template §2; CONTRIBUTING · “Complete” definition

#### E2.2 · Why it is useful for personal-agent tasks  [blocker · §2]
In one line: §2 says why the environment is useful for personal-agent tasks: what about the person or their other apps changes what the agent should do.
Applies when: Always.
Look at: §2; §3 Internal personal apps.
Pass if: Names the personal context that matters (history, preferences, household, other apps) and, ideally, one example situation where it changes the right action.
Fail if: Only “a popular app” or “many people use it”, or value described for a generic chatbot.
Fix: Suggest one example situation drawn from the workflows.
Source: template §2; README · The personalization challenge

#### E2.3 · Overview kept concise  [should · §2]
In one line: §2 stays short; detail belongs in §3 and §4.
Applies when: Always.
Look at: §2.
Pass if: One or two paragraphs; integration and plan details are in §3 and §4 rather than in §2.
Fail if: §2 runs for pages or repeats the construction plan.
Fix: Point to the parts to move into §3 or §4.
Source: template · header (“Keep the overview concise.”)

### E3 · App connections and integration details

Template §3: “Name possible connections and briefly explain their purpose.” Connections may be `None` or `TBD`; the four integration fields are required.

#### E3.1 · Internal personal apps  [blocker · §3]
In one line: For each personal app (Mail, Calendar, Contacts…), say what is read or written and why, or write `None`.
Applies when: Always.
Look at: §3 Internal personal apps.
Pass if: App, direction (read or write), the objects involved and the reason, e.g. “Mail: receives the ticket receipt”. `None` is fine when no personal app is involved; `TBD` needs a plan to decide.
Fail if: “Integrates with Calendar” with no objects or direction, or a bare TBD.
Fix: Draft one line per app.
Source: template §3 · Internal personal apps

#### E3.2 · Other apps and websites  [blocker · §3]
In one line: Other apps or websites are named with the workflow they share, or `None`.
Applies when: Always.
Look at: §3 Other apps and websites.
Pass if: Each service has the shared workflow and what passes between them. `None` is fine; `TBD` needs a plan to decide.
Fail if: A list of names only.
Fix: Add the shared workflow for each name.
Source: template §3 · Other apps and websites

#### E3.3 · Operations and access  [blocker · §3]
In one line: List the agent-facing actions and their entry points (MCP, API or GUI), plus setup, reset and event-injection operations.
Applies when: Always.
Look at: §3 Operations and access.
Pass if: Actions are verbs on objects (search showtimes, hold seats, buy, refund), each with its entry point; platform operations are listed separately.
Fail if: Only “will provide an MCP server”, or no reset or event-injection operation.
Fix: Draft the action list from the §2 workflows.
Source: template §3 · Operations and access

#### E3.4 · Writes, retries and concurrent updates  [blocker · §3]
In one line: Say how a write is confirmed, what a retry returns, and how concurrent updates are handled.
Applies when: The app has any write action.
Look at: §3 State and lifecycle; Operations and access.
Pass if: All three are concrete, e.g. preview → confirm; the same `request_id` returns the same receipt; a stale version is rejected.
Fail if: Any of the three is missing, or is TBD without saying how it will be decided.
Fix: One sentence per missing point that the author can paste.
Source: template §3 · State and lifecycle

#### E3.5 · State, initial data and reset  [blocker · §3]
In one line: Separate app, account and run state, and say what loads at the start and what reset restores.
Applies when: Always.
Look at: §3 State and lifecycle; §4 Validation and reset.
Pass if: Says which data is a shared catalog, which belongs to the user’s account and which exists only in a run; whether a task can supply its own initial data (the user’s accounts, history and people); reset returns to the initial data; snapshot behavior is stated.
Fail if: “Reset the database” with no scope, or a reset that also clears other apps.
Fix: Draft the three-layer split for this app.
Source: template §3 · State and lifecycle; §4 Validation and reset

#### E3.6 · Events and notifications, with examples  [blocker · §3]
In one line: List the outside events the app accepts and the notifications it sends, each with a small example, or `None`.
Applies when: Always.
Look at: §3 Events and notifications.
Pass if: Each event and notification has a channel and an example of its data (a showtime cancelled; a receipt email). When events happen is left to task scenarios.
Fail if: Events are named with no example input or output.
Fix: Write one example payload.
Source: template §3 · Events and notifications

#### E3.7 · Shared data and dependencies  [blocker · §3]
In one line: Say how people, accounts and objects are referenced across apps, the media and attachment formats, and the shared services needed to run.
Applies when: Always.
Look at: §3 Shared data and dependencies.
Pass if: People and accounts are referenced by shared IDs rather than copied; formats are named (PDF ticket, PNG QR code); shared components are listed.
Fail if: Each app keeps its own copy of the same people, or formats are not stated.
Fix: Name the shared IDs and formats.
Source: template §3 · Shared data and dependencies

### E4 · Construction plan and effort

Template: “The construction plan defines the scope, deliverables, quality checks and effort that reviewers will follow through implementation and merge in this same PR.”

#### E4.1 · Every workstream row filled, with numbers  [blocker · §4]
In one line: All five workstream rows give the planned scale in numbers, or `N/A` with a reason.
Applies when: Always.
Look at: §4 Work breakdown table.
Pass if: Web / app construction, Data and image collection, Synthetic data and assets, App integrations, and Validation and reset each give counts or ranges (pages, workflows, records, images); reused components are marked.
Fail if: Empty cells, “various”, or N/A without a reason.
Fix: List the cells to fill.
Source: template §4 · Work breakdown

#### E4.2 · Checks someone else can run  [blocker · §4]
In one line: Each deliverable has a quality check that another person can run and get the same answer.
Applies when: Always.
Look at: §4 Deliverable / quality check column.
Pass if: States what is checked and the pass condition, e.g. “all 9 workflow tests pass; the state hash after reset equals the initial hash; no broken images”.
Fail if: “Tested”, “QA” or “manual review”.
Fix: Rewrite one check with a pass condition, as a model.
Source: template §4 · Deliverable / quality check; CONTRIBUTING · Proposal review

#### E4.3 · Effort, total and costs  [blocker · §4]
In one line: Effort is in person-days per row (ranges are fine), with a total and the expected collection, generation, storage and compute costs.
Applies when: Always.
Look at: §4 Effort column; Resources and total effort.
Pass if: Every row has person-days, the total matches the rows, and costs are numbers or explained TBDs.
Fail if: No total, a total that does not add up, or missing costs.
Fix: Show the sum and the missing figures.
Source: template §4 · Resources and total effort

#### E4.4 · Milestones, owners, dependencies  [blocker · §4]
In one line: Milestones have an order, an owner and a calendar duration; dependencies and related PRs are linked.
Applies when: Always.
Look at: §4 Milestones, owners and dependencies.
Pass if: Each milestone names who does it and what it waits for, such as the shared infrastructure release.
Fail if: Dates without owners, or a dependency mentioned without a link.
Fix: List the milestones missing an owner or a link.
Source: template §4 · Milestones, owners and dependencies

#### E4.5 · Scope boundary and open questions  [blocker · §4]
In one line: Say what v1 leaves out and how open questions will be settled; v1 need not copy every feature of the reference product.
Applies when: Always.
Look at: §4 Scope boundary and open questions; §2.
Pass if: Excluded and deferred items are listed; each open question has an owner or a decision point.
Fail if: No exclusions, or a plan that promises the whole reference product.
Fix: Suggest what to defer to keep v1 reviewable.
Source: template §4 · Scope boundary; CONTRIBUTING · “Complete” definition

#### E4.6 · License, hosting and run-time dependencies  [blocker · §4]
In one line: State the license for code and assets, what is hosted instead of redistributed, and how any run-time external service is replayed or controlled.
Applies when: Always.
Look at: §4 License and external dependencies.
Pass if: Licenses are named for code and assets; hosted parts are marked; each run-time external service is replayed or controlled, or the field says `None`.
Fail if: No license, or a live third-party API at run time with no replay.
Fix: Name the missing license, or the service that needs a replay plan.
Source: template §4 · License and external dependencies

#### E4.7 · Validation and reset plan  [blocker · §4]
In one line: The Validation and reset row names business tests, workflow and error cases, reset checks, and the fixtures and expected outcomes for platform validation.
Applies when: Always.
Look at: §4 Validation and reset row.
Pass if: Each named workflow has at least one test with an expected outcome; reset is checked; the evidence will cover permissions, state consistency and reset.
Fail if: “Unit tests” or “manual QA” with no cases or expected outcomes.
Fix: List the tests to add, one per workflow.
Source: template §4 · Validation and reset row

#### E4.8 · Sources and reuse records for collected data  [blocker · §4]
In one line: Collected data and images come with their source, reuse terms and a record of what was taken.
Applies when: The plan collects, crawls or reuses outside data or images.
Look at: §4 Data and image collection row; License and external dependencies.
Pass if: Each source has its reuse terms or permission, and the deliverable includes source and reuse records plus checks for completeness and broken media.
Fail if: Crawled content with no terms, or images with no source record.
Fix: List the sources that need terms or records.
Source: template §4 · Data and image collection row

## Process and shared format

### E5 · Shared format (PR #12)

Applies if you adopt the PR #12 package format or connect to Mail, Calendar or Contacts. PR #12 is not merged yet, so this group is Should.

#### E5.1 · Reads never change state  [should · §3]
In one line: Read-only actions never change stored data; time-based status is computed when read.
Applies when: Adopts the PR #12 package format, or connects to Mail, Calendar or Contacts.
Look at: §3 Operations and access; State and lifecycle.
Pass if: Clock advance and expiry run only on writes and events; reads compute status from stored dates and return the data unchanged.
Fail if: Every call, reads included, first advances the clock and saves.
Fix: Move the advance step to writes and events.
Source: PR #12 read contract: business tests check that data is unchanged after reads

#### E5.2 · Retries keyed by request_id  [should · §3]
In one line: Every write takes `request_id` and `expected_version`; repeating the same `request_id` returns the same receipt.
Applies when: Adopts the PR #12 package format, or connects to Mail, Calendar or Contacts.
Look at: §3 Operations and access; State and lifecycle.
Pass if: The idempotency key is `request_id` only; a preview ID is a business fingerprint, not a key; reusing a consumed preview with a new `request_id` is an error.
Fail if: Idempotency keyed on preview, draft or receipt IDs, or no `expected_version`.
Fix: State the rule in one line in §3.
Source: PR #12 tool schemas: both fields are required on every write

#### E5.3 · Personal apps referenced, not rebuilt  [should · §3]
In one line: Mail, Calendar and Contacts are referenced through `binding.json`; the app never writes their data directly.
Applies when: Adopts the PR #12 package format, or connects to Mail, Calendar or Contacts.
Look at: §3 Internal personal apps; Shared data and dependencies.
Pass if: Notifications leave through an outbox to the platform; calendar changes are written by the platform or the agent.
Fail if: The app ships its own mail or calendar views or tools, or keeps sent mail in its own state.
Fix: Replace with a binding reference and an outbox notice.
Source: PR #12 Mail and Calendar packages; binding.json

#### E5.4 · Reset covers this app only  [should · §3]
In one line: Reset restores only this app instance (`reset_scope: app_instance`); mail already delivered stays delivered.
Applies when: Adopts the PR #12 package format, or connects to Mail, Calendar or Contacts.
Look at: §3 State and lifecycle; §4 Validation and reset.
Pass if: Cross-app cleanup is left to the scenario or the platform.
Fail if: Reset also restores Mail or Calendar.
Fix: Move cross-app cleanup out of the app’s reset.
Source: PR #12 contribution.json · reset_scope

#### E5.5 · Event envelope, time zones, units, names  [should · §3]
In one line: Events use `{event_id, at, operation, payload}` with a time zone in `at` and units on amounts; the platform hook is `env.apply_event`.
Applies when: Adopts the PR #12 package format, or connects to Mail, Calendar or Contacts.
Look at: §3 Events and notifications; Operations and access.
Pass if: The §3 example follows the envelope. Every operation is declared in `app.json` `event_types`, `events.schema.json` and `contribution.json` `events.accepts` (checked at implementation).
Fail if: `type` instead of `operation`, a time with no zone, a bare number for money, or `env.inject_event`.
Fix: Rewrite the example event.
Source: PR #12 events.schema.json; infra-mcp

### E6 · Overlap and coordination

From CONTRIBUTING: check the proposal list for related work and link overlapping proposals.

#### E6.1 · Overlaps linked  [blocker · §3–§4]
In one line: Check the proposal list and link every overlapping environment or task proposal by PR number, or write “None found” with the date.
Applies when: Always.
Look at: The current proposal list; §3 Other apps and websites; §4 Milestones; PR description Dependencies.
Pass if: Proposals for the same kind of product or the same domain are linked; task proposals that need this environment are named.
Fail if: No mention, although the list already has a proposal for the same kind of app.
Fix: List the PR numbers to link.
Source: CONTRIBUTING · Start with a proposal; Review and implementation

#### E6.2 · Division of work stated  [should · §3–§4]
In one line: For each overlap, say what you build, what you reuse and what you leave to the other proposal.
Applies when: E6.1 found an overlap or a dependency.
Look at: §3; §4 Milestones, owners and dependencies.
Pass if: Each linked PR has one line on the split.
Fail if: Links with no explanation.
Fix: Draft the split line for each link.
Source: CONTRIBUTING · Review and implementation
