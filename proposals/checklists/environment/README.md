# Environment proposal checklists

Checklists for the design review of Environment Track proposals. They follow the
[environment proposal template](../../templates/environment-proposal.md) section by section.

| File | For | What it is |
| :--- | :--- | :--- |
| `agent.en.md`, `agent.zh-Hans.md` | an AI agent | Every check (E0–E6, 35 items) with where to look, pass and fail conditions, fixes and the report format |
| `human.en.md`, `human.zh-Hans.md` | the reviewer | 12 judgment checkpoints (H0–H5); each points to the agent items that hold the evidence |
| `review-comment.en.md` | the reviewer | A GitHub review comment to paste and tick |
| `preview.html` | anyone | Both versions in one page; download it and open it in a browser |

## How to use

1. **Author, before requesting review.** Ask your agent to run `agent.en.md` on your PR, fix every failed Blocker, and paste the report into the PR in a collapsed block.
2. **Reviewer, H0.** Read the agent report. If a Blocker still fails, request changes and list the item IDs.
3. **Reviewer, H1–H5.** Paste `review-comment.en.md` into a GitHub review and tick each checkpoint. Add a one-line reason under any box you leave empty.
4. **Decision.** Every box ticked: approve. Otherwise: request changes. A maintainer then records the approved scope and adds `plan-approved`, as described in CONTRIBUTING.

## Running the agent check

Give your agent (Claude Code, Codex or similar, with `gh` available) this prompt:

> Read `proposals/checklists/environment/agent.en.md`. Review PR #<number> of MatrAIx-ai/Personal-Agents-Last-Exam against it. Get the title, description and file list with `gh pr view <number> --repo MatrAIx-ai/Personal-Agents-Last-Exam --json title,body,files`, and read the proposal file with `gh api "repos/MatrAIx-ai/Personal-Agents-Last-Exam/contents/<path>?ref=refs/pull/<number>/head" -H "Accept: application/vnd.github.raw"`. Follow the steps, then output the table and the “For the reviewer” block. Do not post anything on GitHub.

These checklists are a draft and have not yet been validated against reviewed proposals.
