# Environment Track proposal

**Proposed PR title:** `[Environment Proposal] [Shopping & groceries] Refund-only Returns (minimal MVP)`

Proposal only, prepared 2026-11-16. This deliberately narrows the earlier parcel-returns concept to a one-item, refund-only request workflow. No implementation, evaluation success, delivery date, expenditure, or maintenance commitment is claimed.

## 1. App and domains

- **Authors / GitHub handles (required):** @2018cx (proposal contributor). Implementation and maintenance ownership remain TBD, to be agreed before implementation.
- **Reference app or website / URL (required):** Loop Returns, https://www.loopreturns.com/returns/. Build an independently branded synthetic shopper portal; its declared eligibility rules and statuses are benchmark rules, not representations of any merchant's or Loop's exact policies.
- **Primary domain (required):** Shopping & groceries
- **Secondary domains (optional):** None

## 2. What you plan to build

**✍️ Your answer (required):** A browser app for one fictional merchant and one item per order. Four workflows: (1) locate a synthetic order and read its item, fixed refund amount, eligibility, and deadline; (2) prepare a refund-only request and review or discard it; (3) confirm one eligible request; (4) cancel it before dispatch. Use four views: order lookup, order detail, request review, and request status. A cancellation can be followed by a new request if the order remains eligible. There are no exchanges, store credit, fees, real refunds, or transfers. Confirmation only records a synthetic request; it never means money was returned.

The single initial world change is a visible return deadline passing between review and confirmation. The server checks the same clock displayed by the app. The agent must recognize the expiry rather than claim success or repeatedly submit. A confirmed eligible request persists if its deadline passes later; the deadline is for initiating the request, not cancelling it. Cancellation is permitted until the synthetic status is marked dispatched. A dispatched fixture tests the cutoff, but no carrier simulation or second dynamic event is required in the MVP. Invalid order IDs, ineligible/expired items, duplicate submissions, and cancellation after dispatch have explicit errors or idempotent outcomes. All policy facts needed for a safe action are visible.

## 3. Potential app connections

- **Internal personal apps (required):** None in the MVP. The order ID and user intent are local scenario inputs. Receipt-email and Calendar integrations are deferred.
- **Other apps and websites (required):** None in the MVP. A local order/request store supplies all state. No live merchant, carrier, payment processor, or support-agent connection is needed.

## 4. Construction plan and effort

**✍️ Work breakdown (required):**

| Workstream | Planned work and scale | Deliverable / quality check | Effort (person-days) |
| :--- | :--- | :--- | :--- |
| Web / app construction | Four views; one-item order lookup; draft/confirmed/cancelled/dispatched request states; fixed refund amount shown for information only. Reuse generic accessible forms where appropriate. | Four end-to-end workflows; no duplicate active request; cancellation and failed confirmation leave the order/request store consistent. | 2–2.5 |
| Data and image collection | No crawling, receipts, images, or copied merchant policies. Record public workflow reference and reused dependency licenses. | Provenance manifest; no real orders, customer identities, labels, or payment information. | 0.25 |
| Synthetic data and assets | One fictional merchant, six one-item orders, one explicit return-policy version, four request-state fixtures, and one deterministic deadline-crossing event. | Seeded records cover eligible, expired, ineligible, already-requested, cancelled, and dispatched cases. Amounts/dates/IDs are checked for consistency. | 0.5 |
| App integrations | No external or cross-app integrations. Define a small action/observation boundary, then map to the official PALE interface after its release and scope approval. | UI and action surface agree on eligibility, clock, status, errors, and permissions; no current compatibility claim. | 0.5–1 |
| Validation and reset | At least 12 state/permission/error assertions, four browser workflow tests, two fresh reset/replays, and one independently repeated reference trace. Plan two agent smoke trials after runtime access is available. | Reset restores orders, requests, clock, policy version, and event cursor. Check correct order, request count/status, deadline handling, and unchanged unrelated records. No-op, wrong-order, expired-confirmation, and false-refund-completion controls fail. Private checks stay outside agent-visible state. | 1–1.5 |

- **Milestones, owners and dependencies (required):** M1: agree eligibility/cancellation rules; M2: fixture store and four UI workflows; M3: approved PALE adapter and tests; M4: demo and independent reproduction. @2018cx is the proposal contributor, not a confirmed implementer or maintainer. Implementation/reviewer names and official runtime details are TBD and will be settled before implementation. Planning estimate: 4.25–5.75 person-days, roughly one to two working weeks for one implementer after dependencies are ready; not a delivery commitment. No dependency on another proposed environment.
- **Resources and total effort (required):** 4.25–5.75 person-days. Target a local container with 2 CPU cores, 2–4 GB RAM, and less than 100 MB of fixture data, to be measured. No paid dataset, live API, label purchase, or money movement. Optional agent-trial cost is TBD until official model access and a separate budget are agreed; this draft authorizes no spending. Code/fixture license will be agreed before implementation, with MIT proposed subject to dependency review.
- **Scope boundary and open questions (required):** Exclude exchanges, store credit, multi-item orders, partial quantities, live carriers, label generation, payments, refund execution, cross-app integration, and real customer data. The only initial dynamic event is deadline passage. A dispatched status is a static test fixture, not a shipping integration. Exact PALE methods, time control, and private evaluation hooks await the infrastructure release. Implementation and maintenance arrangements require separate agreement.
