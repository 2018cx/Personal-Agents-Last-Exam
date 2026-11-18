# Environment proposal checklists

Checklists for the design review of Environment Track proposals.

- The agent version follows the eight dimensions of the [proposal review guide](../environment-proposal.md), with three checks each.
- The human version follows the [environment proposal template](../../../proposals/templates/environment-proposal.md) and keeps only the points that need a person.

| File | For | What it is |
| :--- | :--- | :--- |
| `agent.en.md` | an AI agent | 24 checks (3 for each of the 8 dimensions), each with criteria for Approve, Partial approve, Human judge and Reject, plus the report format |
| `human.en.md`, `human.zh-Hans.md` | the reviewer | 13 judgment checkpoints (H0–H5); each points to the agent checks that hold the evidence |
| `review-comment.en.md` | the reviewer | A GitHub review comment to paste and tick |
| `preview.html` | anyone | Both versions in one page; download it and open it in a browser |

## How to use

1. **Author, before requesting review.** Ask your agent to run `agent.en.md` on your PR, fix every Reject, and paste the report into the PR in a collapsed block.
2. **Reviewer, H0.** Read the agent report. Confirm there is no Reject left, and decide every check marked Human judge.
3. **Reviewer, H1–H5.** Paste `review-comment.en.md` into a GitHub review and tick each checkpoint. Add a one-line reason under any box you leave empty.
4. **Recommendation.** Choose ready for scope approval, needs design changes, or insufficient evidence. The recommendation does not approve or merge the PR. A maintainer records the approved scope and adds `plan-approved`, as described in CONTRIBUTING.

## Running the agent check

Give your agent (Claude Code, Codex or similar, with `gh` available) this prompt:

> Read `docs/review/environment-proposal-checklist/agent.en.md`. Review PR #<number> of MatrAIx-ai/Personal-Agents-Last-Exam against it. Get the title, description, comments and file list with `gh pr view <number> --repo MatrAIx-ai/Personal-Agents-Last-Exam --json title,body,comments,files,headRefOid`, and read the proposal file with `gh api "repos/MatrAIx-ai/Personal-Agents-Last-Exam/contents/<path>?ref=refs/pull/<number>/head" -H "Accept: application/vnd.github.raw"`. Follow the steps, then output the workflow traces, the verdict table and the recommendation. Do not post anything on GitHub.

The proposal review guide comes from PR #12; these checklists follow its version at `0e9ede3`. They are a draft and have not yet been validated against reviewed proposals.
