# Language Study Workspace v1

A local, synthetic flashcard workspace for PALE proposal #51. This first runnable slice includes seeded decks/cards and fixed plan, due-before-new queue, explicit answer reveal and learner-selected Again/Good, and persisted review history. No external accounts, model/API dependencies, live notifications, or third-party deck content. User/Agent callers must provide an actual learner or scenario-supplied rating; this test App does not attest human origin.

Implementation and ongoing maintenance: **Xiao Cui (@2018cx)**.

## Run and reproduce

Use Node 18+ and the PALE public reference runtime 1.6.0/Core 1.2.0 at upstream commit `61b637164e4abddf81536bb48935cdb688a69ff1`, separately from the approved #51 base `126502f9972740e2b9d9777d300825a547e9d83f`. The fork baseline does not include runtime files. Do not overwrite the approved proposal or vendor the runtime into this package. These are local tests, not remote CI.

From this directory, with the upstream checkout at `$UPSTREAM`:

```sh
npm test
export PALE_RUNTIME_ROOT="$UPSTREAM/runtime"
node "$PALE_RUNTIME_ROOT/cli.cjs" verify --app "$PWD" --output /tmp/study-verification.json
node tests/core.cjs
node tests/host.cjs
# Optional with Playwright installed and a supported Chromium environment:
node tests/web.cjs
```

Set `CHROMIUM_PATH` to use an installed Chromium. The real-browser test needs an environment that permits Chromium to launch; the HTTP Host test needs no third-party dependencies. The verifier's `event-example` stage runs a standalone read illustration; it is not evidence of incoming events. The App deliberately declares none in v1.

### v1 validation status

- **Passed:** 3 business tests; 32 pinned public verifier checks; independent real Core stdio walkthrough (seed, ordered queue, reveal, committed rating, persisted ledger, retry, conflict/stale/denial, virtual time, isolated run, two resets); real Web Host HTTP → Agent MCP walkthrough; browser controller syntax.
- **Passed on actual Chromium (S1 interaction smoke):** Decks and Plan; answer hidden until Reveal; explicit Good rating; C1 persisted after reload; a second Agent caller wrote C2 while the first browser form was open; the stale write was rejected and did not add a ledger entry; the independently written rating appeared on reload and Refresh; the restricted session revealed the answer without offering rating buttons. The separate Agent read-back showed exactly C1/Good and C2/Again. This was a live loopback Web Host run in the managed desktop browser of the same pinned runtime; it does not establish full GUI parity or use the automated script's browser-launch wrapper.

For a manual local browser walkthrough, copy this package to `apps/study` in a disposable pinned upstream checkout, then run from its root:

```sh
printf '%s\n' '{"schema_version":1,"initial_time":"2027-01-08T00:00:00+08:00","apps":[{"app_id":"study","version":"1.0.0","path":"apps/study"}]}' > study-local.registry.json
node runtime/web/server.cjs --app study --registry study-local.registry.json --run study-preview --profile sandbox --state-dir /tmp/study-preview-state
```

Open the printed loopback link, visit Decks and Plan, return to Queue, reveal “Train station,” and explicitly choose Good. History should show card C1 reviewed on day 0 with due day 3. Callers using Infra must keep its connection separate from the editor/Agent connection. A fresh `scenario` run is read-only, including in the GUI.

## v1 behavior and limits

- The App publishes business tools with the `study.` prefix because Core requires tool prefix and App ID to agree. The repository package path is `apps/study`.
- The clock is the fixed UTC+08:00 date beginning 2027-01-08. Eligible due cards precede eligible new ones; ties use IDs. Again resets to stage 0 and defers until tomorrow; Good advances to at most 3 and uses delays 1/3/7 days. One review per card/day, enforced against daily and new-card limits.
- Agent reads do not advance time. Core handles optimistic concurrency and exact retries. Reveal returns a card version and study day; the GUI retains the Core version when submitting. Core reset restores the loaded business state and virtual clock, not the old receipts or epoch.
- Tests cover the seeded standalone loop only. Card/plan edits, suspension, persistent pause/resume cursor, correction/undo, injected events/capacity scenarios, official deployment and complete parity are deferred. Core's read-only scenario is a simulated policy, not a production authentication claim. Original package code and synthetic fixtures are licensed MIT (see `LICENSE`). Reused upstream launcher/contracts retain the notice in `UPSTREAM-NOTICE`. The four phrase pairs are original synthetic examples; no Anki code or deck data is bundled.
