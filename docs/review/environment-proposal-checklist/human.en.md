# Environment proposal review · key checks

The agent runs every check. In each part of the template you judge only the 2–3 points that need a person.

### H0 · Agent check is clean

- [ ] **H0.1** The agent report has no Reject, or each one has a reason you accept. (D1–D8)
- [ ] **H0.2** You decided every check the agent marked Human judge.

### H1 · Are the main workflows worth building for personal-agent tasks?

Template: §2 “Briefly describe the main workflows and why this environment would be useful for personal-agent tasks.”

- [ ] **H1.1** Doing these workflows right depends on knowing the person: their history, preferences, household or other apps. (D1.1)
- [ ] **H1.2** You can think of at least one task a task author would want to build on them. (D1.1, D1.2)

### H2 · Do the app connections serve those workflows?

Template: §3 “Name possible connections and briefly explain their purpose.”

- [ ] **H2.1** Every connection is used by a §2 workflow; none is there just for show. (D5.3, D7.1)
- [ ] **H2.2** No obvious connection is missing, such as a purchase that never sends a receipt to Mail. (D5.3)

### H3 · Could the platform and task authors build on it?

Template: §3 Integration details: Operations and access, State and lifecycle, Events and notifications, and Shared data and dependencies are all required.

- [ ] **H3.1** A task author could set up a starting situation for a specific person and reset it afterwards. (D4.1, D4.3)
- [ ] **H3.2** The actions and events cover what tasks on these workflows will need; nothing essential is missing. (D3.1, D5.1)

### H4 · Could you accept the finished work against this plan?

Template: “The construction plan defines the scope, deliverables, quality checks and effort that reviewers will follow through implementation and merge in this same PR.”

- [ ] **H4.1** The total effort looks realistic for the scope, the people named and the calendar time. (D7.2, D7.3)
- [ ] **H4.2** The planned checks are strong enough that you could accept the work against them at merge. (D8.1, D8.2, D8.3)
- [ ] **H4.3** The scope boundary leaves out the right things for a first version. (D2.3)

### H5 · Are the data, assets and run-time dependencies safe to use?

Template: §4 License and external dependencies: the license for code and assets, what is hosted instead of redistributed, and how run-time services are replayed or controlled.

- [ ] **H5.1** Nothing in the data or assets looks risky to publish: sources, brand use and licenses all hold up. (D6.3)
- [ ] **H5.2** The replay or stand-in plan for any outside service is believable, so runs will not depend on the live internet. (D7.1)

