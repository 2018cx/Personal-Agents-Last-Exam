# Home Repair Slots evaluation history v1
The independent evaluation seed represents a fictional managed-property coordinator scheduling cabinet-hinge work across units. It has 24 booking episodes under the existing local account and providers, with varying time, cost, status and outcomes. Each episode has ordered selection and confirmation. Four episodes move from an earlier slot, and sixteen cancel before the service window. An uncancelled historical record is merely a retained confirmed booking, not evidence of completed repair. No unit addresses, real accounts, third-party records, or media are used. Xiao Cui (@2018cx) owns human provenance and licence review; no acceptance is claimed.

[Coverage](coverage.json) includes 24/24 calendar months, 68 synthetic activities on 68 distinct dates, 0 real records, and earliest/latest dates of 2025-01-01 and 2026-12-31. The report counts `history[].at` in Asia/Shanghai, not scheduled service dates. There are intentionally idle days. The two future sample offers are not counted. The Core bundle count is separate: 30 slots plus 24 bookings, with providers, reservations and event rows excluded from that existing count contract. [Dataset metadata](dataset.json), [seed](seed.json) and its SHA-256 in the coverage file specify the delivered data.

Reproduce and validate from the App directory in a full PALE checkout:

```sh
node evaluation/recount.cjs            # check committed bytes and print coverage
node evaluation/recount.cjs --generate # byte-identical generation
node tests/evaluation.cjs              # real, independent Agent and Infra stdio clients
```

For a full-window replay, load the supplied seed with `env.load_seed` and the existing account binding and policies. Reuse the empty catalog from the smoke bundle and replace the bundle's dataset metadata with `evaluation/dataset.json`. Set the clock to `2027-01-12T09:00:00+08:00`, used by the test, after all historical activity and before the two live offers. Separately read the complete activity log through Infra `env.snapshot` and one linked booking and slot per month through the existing public Agent `get_booking` tool. Smoke data and supported operations are unchanged. For an earlier Task start, select a coherent pre-session history without future activity rather than loading this end-of-window fixture wholesale.
