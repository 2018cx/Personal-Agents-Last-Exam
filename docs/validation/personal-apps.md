# Personal Apps validation report

Checked November 18, 2026 (America/Los_Angeles). Scope: the five version **1.0.0** packages in this PR, public runtime **1.5.0**, Core API **1.2.0**. Exact package hashes, runtime stages and workflow assertions are recorded in [personal-apps.json](personal-apps.json). Package hashes were compared across both Node runs and the independent base-runtime reports after the last App edit.

**Automated outcome: passed.** This is a maintainer implementation submitted directly for code review. Human workflow acceptance and provenance review remain pending; no approval is claimed. Technical scope and interfaces are documented in the suite guide rather than a separate community proposal.

## Reproduction and evidence

| Evidence | Result | What was actually exercised |
| --- | --- | --- |
| App-only business | 38 tests passed: Files 7, Messages 10, Notes 7, Tasks 7, Contacts 7 | Real App hooks, input/output/seed schemas, domain failures, history retention, read-only behavior, optional logging and escaped rendering |
| Isolated App package | All five passed | Public verifier copies each App without a sibling runtime, then executes its local tests and event example |
| Real public MCP | 180 common checks across the five packages passed | Discovery, argument/role restrictions, reads, history loading, event application/retry, reset, separate run and restarted process |
| Declared cross-App workflows | 83 assertions passed | Real business writes, receipts, destination records and actual attachment bytes, with negative controls |
| Node 18.20.8 | 19/19 full-suite stages passed | Existing Mail/Calendar/Core/Messaging regression suite plus the five-App suite |
| Node 22.14.0 | 19/19 full-suite stages passed | Same full-suite stages on the second supported runtime family |
| Independent base validator | All seven discovered packages passed | Unmodified main at `718a4cbc7709dee22bf1e4ad1cff984550d7e519` validated the candidate packages, including existing Mail/Calendar |
| Human review | Pending | Implementation scope, overlap, realistic coverage and provenance; automated green results do not grant acceptance |

The Node binaries were official releases with their archive SHA-256 checked against Node's published checksum file. All test data was synthetic; tests used temporary directories and local stdio MCP, without private services, user credentials or model APIs.

Run from the candidate checkout:

```sh
node --version
npm run contracts:check
npm run test:personal-apps
npm test
```

Run the independent package check from a separate checkout of the pinned base:

```sh
node runtime/ci/verify-submissions.cjs /path/to/candidate /path/to/reports
```

The base checker was not changed or supplied from the candidate. Its package/MCP/lifecycle checks are separate from candidate business tests. The new parent-resource registrations for Files, Notes and Messages are reviewed additions to the public host; actual resource and cross-App checks run with those registrations present. No Core or Messaging business implementation changes are required by this PR.

## Workflow evidence

| Preconditions → action | Expected and observed result | Failure/control |
| --- | --- | --- |
| Each App starts with scenario read permissions → attempt a write, then select sandbox and retry | First attempt denied; permitted write commits one record and revision; a restarted MCP process reads it | Stale version and changed reuse of a request ID rejected; identical retry has one effect; another run unchanged |
| Contacts contains Alex's stable person ID → assign a new Task | Tasks stores `person-alex`, independent of the display name | Unknown person and invalid deadline rejected; blockers prevent completion; cycles rejected; completed tasks require explicit reopen |
| Files contains a synthetic original receipt → attach to Mail draft → attach returned bytes to Notes | Both destination Apps retain readable original bytes and the same SHA-256 | Corrupt import preserves data and resources; restricted parent prevents both attachment-tool and raw-resource access |
| Order notifier has an approved source/account/grant → publish the Messages-owned `channel.chat` envelope | Messages creates a real record in the bound conversation and imports attachment bytes; receipt ties source event to committed receiver version/time | Source impersonation, unknown recipient, missing grant and invalid conversation rejected; no partial message on receiver refusal |
| Successful notification → same event retry, then altered payload | Same event has one effect and returns prior receipt; altered payload conflicts | Missing producer time remains null/absent while receive/commit times remain available |
| Messages account A has an own outgoing message → build envelope and publish to account B | B resolves A's bound person, creates its own message and original-byte attachments; A's state remains separate | Receiver account and conversation are explicit; local send is not treated as downstream delivery confirmation |
| Infra applies Notes/Messages content change → inspect business history | Previous text/content is retained alongside the new record | An event cannot erase existing history, creation time or prior revisions |

Individual App tests additionally cover file/folder cycles and collisions, immutable file versions, nonempty-folder trash rules, Notes archive/restore and revisions, Contacts duplicate/invalid emails, conversation membership and author-only message edits/retractions. Reads do not mark Messages as read; that is a separate write tool.

## Follow-up delivery review

The review reproduced and corrected two Messages defects before the final validation runs:

| Reproduced failure | Correction and regression evidence |
| --- | --- |
| Marking an outgoing message read at a later virtual time changed its CloudEvent identity/time, so a retry could create another receiving record. | Derive identity from content/destination/revision, and preserve original `sent_at`. App-only tests cover read changes and text edit/revert; real MCP advances time, marks read, republishes and verifies one receiver effect. |
| A service notification whose source account had the same owner as the recipient was editable as if locally authored. | Store optional immutable `delivery_source` on received records. App-only tests reject edit, retract, attachment changes and provenance removal; real MCP grants the edit tool but verifies that the App rejects editing a received notification and preserves its data. |

The new optional Messages record field is reflected in its seed/event/tool-output schemas. Existing historical fixtures remain valid. The chat wire contract, public Core/Messaging implementation and Mail/Calendar packages are unchanged.

| Review gate | Outcome |
| --- | --- |
| Package and contracts | Passed authoritative package/schema checks; exact package hashes match both Node runs and the independent base validator. |
| App-only business | Passed from isolated copies with no runtime sibling, including the two new regressions. |
| Public runtime and independent integration | Passed real MCP, lifecycle/permission/media/delivery workflows and the unmodified base validator. Contacts/Tasks and Files/Mail/Notes coordination uses ordinary MCP tools; the two Messages delivery workflows use Router. |
| Workflow and human review | Automated workflow evidence passed. Human scope/provenance acceptance remains pending; GUI declarations are not mounted interactive interfaces. |

## Review focus

Start with the [suite guide](../personal-apps.md) and each App's `src/`, `tools.json`, seed/event schemas and tests. Most package JSON files are copies of public contracts or explicit record/tool schemas needed for isolated verification. Shared schema copies are checked by `contracts:check`; the vendored test validator is compared to the canonical public validator.

Confirm the reuse boundary with #33 Personal Document Records and #85 Kinthread, especially the proposed `channel.chat` contract. The new GUI files are tested as escaped reviewer renderers; their declarations are explicitly **declared**, with no mounted GUI endpoint or Agent CUA claim. Source/product references are documented as design inspiration; their code/assets are not redistributed.

Recommendation: ready for code and implementation review, with automated local evidence attached. Merge and acceptance remain maintainer decisions. This documentation does not change the repository's automated contribution gate.
