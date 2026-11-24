# Refund-only Returns
PALE #7. Implementation and ongoing maintenance: Xiao Cui (@2018cx). The fictional Paperfield Goods portal records synthetic refund requests only. It never moves money, dispatches parcels, or calls an outside service. Original code and synthetic records are MIT; reused PALE components retain their original MIT notice. Loop Returns is a conceptual reference only; no external content or merchant policy was copied.

Run standalone with Node.js 18+ and the published PALE Core API 1.2.0 (runtime 1.6.0 or compatible), with no additional apps or runtime dependencies. Setup/reset/clock belong only to Infra via env.load_seed, env.reset and env.advance_time. The shared Web Host and Agent MCP read/write the same state managed by Core. The shopper can look up orders, read orders or request status, prepare/discard a preview, confirm a request, or cancel it before dispatch.

The return deadline is inclusive. The app computes expiry from virtual_now on every relevant read and confirmation, without a business event or wall clock. Strict clock advancement makes an old optimistic version stale; a fresh request returns return_expired without altering the draft or creating a submission. Confirmation before expiry remains valid after expiry. A replay of the exact successful write returns its original transport receipt; a fresh confirmation of the same active request returns the same business ID and never creates another record. Dispatched is a static fixture and cannot be cancelled.

Example start: 2026-01-10 09:00 UTC. Order 2 is due at 10:00 UTC. At 10:00:01 UTC it is expired. Order 1 can be used to prepare/discard and retry, 3 is expired, 4 is ineligible, 5 already requested, and 6 dispatched.

See VALIDATION.md for commands and evidence.
