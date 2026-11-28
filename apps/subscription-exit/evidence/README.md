# GUI and state evidence
Scope: [approved plan](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/blob/118a5f0665b5c0c9d542a722b4ed73cf371be147/proposals/environment/subscription-exit.md), [delivery review](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/pull/20#pullrequestreview-6094921997), and [evidence policy](https://github.com/MatrAIx-ai/Personal-Agents-Last-Exam/blob/25d559778696dff849bb88fcca03f325185f2599/docs/submission-evidence.md). The PR evidence attachment includes capture-metadata.json with the exact App commit, package digest, v1 runtime revision, and evidence hashes. Reproduce the ordered screenshots and expected/observed Core trace with PALE_SCREENSHOTS=/tmp/subscription-exit-evidence node tests/browser.cjs ([setup](../VALIDATION.md)). Main run: Chromium Headless Shell 156.0.8078.79, Playwright 1.62.1, 1280 × 900, UTC, sandbox enabled, fictional account account-1, local Host run subscription-browser.

## Reference comparison
- [Spotify's public plan management guide](https://support.spotify.com/us/article/change-premium-plans/) maps to the plan card and action at **Overview** (01/08). [Spotify's public cancellation guide](https://support.spotify.com/us/article/cancel-premium/) maps to **Preview → Confirm → Status** (02/04/10/13) and keeping saved entries.
- Reference PNGs and provenance in the attachment: reference-spotify-plan-management.png, reference-spotify-cancellation.png, source.json. Captured from first-party public documentation; authenticated account screens require the corresponding private subscription. We provide the documented action and post-confirmation result as a reference alternative for reviewer confirmation; no private screens are represented as captured.
- Intentional differences: Echo Arbor uses its own design, simulated prices, deterministic billing dates, a pre-bound fictional account, and no billing or sign-in. Withdrawal undoes a pending cancellation before the boundary; it does not resubscribe, take a payment or create an account. The UI uses readable browser-zone dates; the trace and coverage use UTC.

## Ordered Chromium interactions

| Screenshot basename | Actual control or separate public action | Expected / checked result |
| --- | --- | --- |
| 01-plan-start | Open local access URL as the pre-bound subscriber | Plan card and title loaded; no account ID control; computed card border is present. Independent Infra baseline records an active plan and saved items. |
| 02-cancel-preview | Prepare cancellation | Date and saved-entry retention shown before confirmation. Core retains active entitlement; no receipt. |
| 03-repeat-discard | Abandon, prepare again and abandon without advancing time | Two distinct abandoned records; zero receipts; active plan unchanged. |
| 04-cancel-confirmed | Prepare and confirm a cancellation | Scheduled status, retained paid access and user-readable receipt; separate Infra readback has one cancellation receipt. |
| 05-reload-receipt | Reload the browser, open Status and receipts, then View receipt | Pending status persists; cancellation receipt remains available. |
| 06-two-open-revocations | Prepare revocation in first tab, open second tab and prepare again at same virtual time | Two independently prepared withdrawal records and no internal validation error. Each tab then abandons its own preview (first tab refreshes revision). |
| 07-independent-mcp-visible | Independent Agent MCP prepares and confirms revocation; click Refresh view | Shared status is paid active and the second receipt is visible; no shadow UI datastore. |
| 07b-browser-withdrawal | Schedule another cancellation, prepare revocation, confirm it in the browser | Paid active restored with human-readable withdrawal receipt and exact fourth Core receipt. |
| 08-renewed-overview | Infra advances to first boundary while active; Overview | One renewed period displayed; fresh cancellation enabled. |
| 09-renewed-confirmed | Prepare and confirm in renewed period | Cancellation receipt points at the new billing boundary. |
| 10-renewed-exact-end | Set virtual time exactly to renewed period end; Refresh | Free; saved entries remain; no third period. |
| 11-pre-boundary-withdrawal | Reset, schedule cancellation, stop one second before end, prepare revocation | Old period withdrawal confirmation button visible and not yet applied. |
| 12-stale-denied | Advance time to exact boundary, click older Confirm revocation | Action-local readable stale message; independent test sees no write or extra receipt. |
| 13-reset-replay | Refresh to read the effective entitlement | Free, no stale confirmation, all saves retained. |
| 14-reset-replay | Reset and repeat original cancellation and stale-revocation path | Same persisted state and intact saves, with cleared prior-run receipts at reset. |
| 15-no-further-period | Reset, keep active, and skip to the second period end | No third period and no unmodeled cancellation. UI explains why. |

The attachment's browser-trace.json provides rendered text, virtual time, version, preview states, stored domain receipts, and saved IDs. The independent [Core trace](../tests/core.cjs) includes repeat/abandon, exact boundaries, retry and conflict, permissions, seed loading and resets. The [evaluation coverage](../evaluation/COVERAGE.md) is separately countable and observed via public MCP after env.load_seed. No other App or service is integrated. Model-driven smoke trials are deferred; scripted browser and distinct Agent MCP clients are not presented as model runs.
