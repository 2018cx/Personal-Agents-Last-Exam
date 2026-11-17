# Task Track proposal

**PR title format:** `[Task Proposal] [<Domain>] <Short task title>`

Example: `[Task Proposal] [Travel & commuting] Adapt an airport pickup after a flight change`

Copy this template to `proposals/task/<slug>.md`. Keep the persona, story and personalization insight concise. The construction plan defines the scope, deliverables, quality checks and effort that reviewers will follow through implementation and merge in this same PR.

✍️ Replace each `[Fill in: …]` with your answer. Optional fields can be `None`. For unresolved details, use `TBD` and explain how they will be resolved.

## 1. Task and domains

- **Authors / GitHub handles (required):** [@Yeechin-is-here](https://github.com/Yeechin-is-here)
- **Short task title (required):** Arrange catering for Lena’s spring gathering
- **Primary domain (required):** Food & dining
- **Secondary domains (optional):** Social & communities

### Domain names

Use the exact names from the [homepage](../../README.md#environment-domains). Choose one primary domain and optional secondary domains; list the primary first in the PR title and join others with ` + `.

<table>
<tr><td>💳 <strong>Money &amp; insurance</strong></td><td>🛍️ <strong>Shopping &amp; groceries</strong></td><td>✈️ <strong>Travel &amp; commuting</strong></td></tr>
<tr><td>🩺 <strong>Health &amp; care</strong></td><td>🍽️ <strong>Food &amp; dining</strong></td><td>💬 <strong>Social &amp; communities</strong></td></tr>
<tr><td>🏠 <strong>Home &amp; utilities</strong></td><td>🏛️ <strong>Public service &amp; law</strong></td><td>🎬 <strong>Media &amp; entertainment</strong></td></tr>
<tr><td>📚 <strong>Learning &amp; research</strong></td><td>💼 <strong>Work &amp; business</strong></td><td>📰 <strong>News &amp; information</strong></td></tr>
<tr><td>🌤️ <strong>Weather &amp; outdoors</strong></td><td>🎮 <strong>Games &amp; play</strong></td><td>🏃 <strong>Fitness &amp; wellbeing</strong></td></tr>
</table>

## 2. User persona and prior history

Who is the user? Briefly describe the background, preferences and prior experiences that matter to this task.

**✍️ Your answer (required):** Lena is a designer hosting a small dinner for family and friends. Her calendar lists eight people, including her friend Maya, for a gathering at `2026-04-16T18:00:00-04:00`, along with the delivery address.

In a private message on April 7, Maya tells Lena that she now avoids nuts and does not want the reason shared. The agent can tell the caterer about the dietary requirement without forwarding their conversation. There is also an old email exchange with Cedar Table, a local caterer, but its menu and prices need checking. These records are available before Lena asks for help.

## 3. Story outline

What does the user want, what changes, and what would a good outcome look like? Mention the approximate time span if relevant.

**✍️ Your answer (required):** Lena wants the agent to arrange catering and keep her gathering details up to date. The story runs from April 6–17, 2026, including the initial calendar entry and messages. There are six sessions from April 8 onward. All times below are in New York (`America/New_York`, UTC offset `-04:00`).

- **`2026-04-08T09:05:00-04:00`:** Lena asks: “Please arrange catering for the gathering on my calendar. You can spend up to $240 in total; ask me before spending more. Keep the guest count and order details up to date, but leave the dinner time as it is.” Nothing has been ordered yet. Cedar Table offers a nut-free menu for eight people at $224.
- **`2026-04-10T11:10:00-04:00`:** A follow-up message confirms that Maya’s parents will attend, after a tentative message the previous day. This brings the total to ten. The original menu now costs $268; a simpler nut-free menu for ten costs $236. All prices include delivery and fees.
- **`2026-04-13T10:00:00-04:00`:** Cedar Table emails that the order deadline has moved from Wednesday to `2026-04-14T12:00:00-04:00`. Lena does not reply that afternoon, so the agent needs to plan around both the deadline and her spending limit.
- **`2026-04-14T08:50:00-04:00`:** In the main path, Lena answers the menu question and approves $268. I will also write a branch where she does not reply before the deadline; the $236 option is still within her original permission. If the agent has already placed a suitable $236 order, Lena accepts it. An earlier eight-person order can be updated without a fee before the deadline, rather than creating a second order.
- **`2026-04-16T11:00:00-04:00`:** Rain pushes the vendor’s delivery estimate from 17:00–17:30 to 17:40, with no extra charge. The agent should let Lena know she will have less setup time. For an existing order, a delivery confirmation arrives at `2026-04-16T17:18:00-04:00`.
- **`2026-04-17T09:20:00-04:00`:** The agent checks the receipt and delivery confirmation, then summarizes what was ordered, the final cost and whether anything still needs attention.

A good outcome is one confirmed order for ten suitable meals, placed or updated before the deadline and within Lena’s permission at the time. The calendar should reflect the final plan, Maya’s private conversation should stay private, and the final report should match the order and delivery records. Either menu can be valid, but the agent must follow any choice Lena explicitly makes.

## 4. What makes this distinct and personal

How does this person's context change the right action, and what might a generic assistant miss? Use one concrete example to show the request or trigger, where and when the agent can discover the decisive personal context, and how that context changes the appropriate action. If relevant, include one key change and the user’s response or non-response.

**✍️ Your answer (required):** Lena should not have to repeat everything she and her guests have already discussed. The agent needs to find Maya’s dietary preference in Messages, confirm the guest count from the later conversation, and check the latest vendor email rather than rely on an old quote.

For example, when the email about the earlier deadline arrives on April 13, the agent already has enough information to see that ten meals from the original menu would exceed Lena’s $240 limit. It can ask her to approve $268, but cannot treat silence as approval. If she stays unavailable, the $236 menu is still a suitable option. The limit applies to the whole order, including when updating an earlier booking. This is the main challenge: keep the plan current while remembering what Lena has actually agreed to.

## 5. Construction plan and effort

Specify the work needed to turn the story into an executable, scoreable task. Include expected coverage and effort in person-days; estimates may be ranges. The user rollout is the planned sequence of user interactions and responses, including branches. Agent rollouts are actual model executions against that scenario.

**✍️ Work breakdown (required):**

| Workstream | Planned work and scale | Deliverable / quality check | Effort (person-days) |
| :--- | :--- | :--- | :--- |
| Persona, history and workspace | Write about 12–18 short messages, emails and calendar records for Lena, her guests and Cedar Table. All records will be fictional. | Check that the dietary preference, guest count, budget and deadline can each be found in a sensible place, and that the records agree. | 1–2 |
| User rollout and scenario script | **Sessions:** 6, following the timeline in Section 3<br>**Simulated world time span:** April 6–17, 2026, including the initial history on April 6–7<br>**Estimated total tokens:** 30k–50k per complete scenario, including dialogue, prior context, tool instructions/results and agent output; excluding private grading and separately billed reasoning<br>Use timestamps with UTC offsets for sessions and events (e.g. `2026-11-12T08:30:00-08:00`). | Write the approval and no-reply paths, with replies that fit what the agent actually asks or has already done. If no menu question is pending on April 14, Lena checks in during the main path; she remains unavailable in the no-reply branch. New messages appear at their scheduled times. Confirmed guests, dietary needs, spending permission and any existing order carry over between sessions. | 1–2 |
| Environment integration | Reuse Mail, Messages and Calendar. Add a small simulated Cedar Table service for quotes, placing or changing an order, checking its status, and receiving receipts and delivery updates. | Check that the full story can run and that each test starts from the same records with no order placed. Order changes are free before the deadline and update the existing order. Save the order and delivery records for scoring. | 2–3 |
| Rubrics, reference and hints | Score the guest count, dietary needs, deadline, spending permission, privacy, calendar updates and accurate final report. The reference will check the conversations, compare menus, get approval if needed, and verify the order and delivery. The hint will point to the dated conversations and the need to recheck the plan before acting. | Run the reference through both response paths, including an order placed before the guest count changes. Check partial credit and mistakes such as doing nothing, leaving the final order at eight meals, spending $268 without approval, duplicating an order, forwarding the private conversation, or claiming delivery without evidence. Set the scoring weights before model runs.<br>Before submission, check that the fixed hint addresses the decisive difficulty and, together with the available context, supports full credit across all scoring criteria and success gates without revealing the solution. | 1–2 |
| Agent rollouts and analysis | Plan one unhinted run and one run with the same fixed hint for each designated GPT, Claude and Gemini model: six complete runs of the main path. Check the no-reply branch with the reference first. | Submit every run’s trace, score and settings, with a short explanation of the failures, following the linked validation protocol. Report the no-reply reference check separately. Model results are not available yet.<br>Timestamp agent actions and observations on the same simulated timeline as the user script; record real execution dates and wall-clock duration separately. | 1–2 |

Estimate token volume for **one complete scenario across all sessions** and state what is included, such as dialogue, prior context and tool outputs. The simulated time span is the time elapsed in the user's world; development duration is recorded below.

- **Milestones, owners and dependencies (required):** I will write the records and user script, connect the apps and caterer, then build the rubric and reference before running the models. I estimate 2–3 weeks once the needed app interfaces are available, with review from the Task Leads. Mail and Calendar may reuse the work in [PR #12](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/pull/12); Messages and support for sessions and timed updates still need confirming with the Environment and Infrastructure Leads.
- **Resources and total effort (required):** 6–11 person-days, assuming the shared apps are available. The scenario uses text records and should run locally without a GPU or paid data. The six model runs are estimated at 180k–300k visible tokens, plus reasoning and any reruns. API cost is TBD; I will estimate it from a small pilot with the designated models before the full batch.
- **Scope boundary and open questions (required):** One gathering and one caterer, with no real payments or separate shopping, maps or weather service. Before implementation, I will confirm with the relevant leads how sessions resume, what history or memory remains available, and whether the small caterer simulation can be included in this task. This is a proposal; implementation and model validation will follow approval.
- **Data provenance and privacy (required):** Adapted from the public [Lena gathering illustration](https://personalagenteval.com/PALE). I will write fictional messages, names, addresses and vendor records for the task. No real private messages, account details or third-party personal information will be included. No website images or screenshots are reused; I will record the source and reuse terms if any external assets are added later.

After approval, add the script, grader and author-run evidence against these deliverables in the same PR. Reviewers use the approved plan as the acceptance baseline; substantial scope changes require another design review. Follow the [implementation and validation guide](../../CONTRIBUTING.md#task-difficulty-and-validation).
