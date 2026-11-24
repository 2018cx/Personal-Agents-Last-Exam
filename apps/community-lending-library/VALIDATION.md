# Reproducing the first runnable version

Runtime API was exercised using public PALE Runtime 1.6.0 / Core API 1.2.0 at
both the proposal compatibility baseline `61b637164e4abddf81536bb48935cdb688a69ff1`
and upstream main `a4bce023953061483c41de5a287ba5e43f4a5648`. Follow the App
README to set `PALE_RUNTIME_ROOT` and rerun business tests, official App
verification, two-role MCP trace, and HTTP Host checks.

| Check | Verified result |
| --- | --- |
| Local invariant tests | Borrower scope, maintenance exclusion, two-copy cap, exact checkout/return attempts and rejection, one renewal, cutoff-time handling, FIFO promotion and nonmutating reads, six fixture presets. |
| Public App verifier | Manifest, schema, data/resource declarations, actual MCP bridge, event replay and isolated state/reset pass. The default read-only profile declares no mutation surface; the separate live trace tests full business tools with the sandbox profile. |
| Live Core compatibility trace | Two Agent sessions share state. An old cancelled attempt cannot affect a newer one. Rejected checkout creates no loan; accepted checkout and return each change custody once, and exact accepted-event replay duplicates neither. A queue event invalidates a renewal preview; the old due date stays unchanged. A custom task seed demonstrates projected hold expiry and FIFO promotion at the exact historical expiry instant. Two resets restore the same seeded data and clock while clearing receipts. |
| Official Web Host (HTTP) | The app and controller are served; authenticated local HTTP talks to the same Agent state as direct MCP, controller operations use the declared Tool surface, and Infra/fixture paths are not exposed. |
| Chromium interaction script | `tests/browser.cjs` provides full click/read-back coverage for the five views. The local sandbox denied a Chromium singleton socket during launch; no browser pass is claimed here. Rerun with repo-supported Playwright and a sandbox-capable Chromium host: `node tests/browser.cjs`. |

No real money, provider, payment, shipment, notification or account was used.
Data quality and independent reviewer reproduction remain for delivery review.
This evidence is not a final acceptance or merge approval.
