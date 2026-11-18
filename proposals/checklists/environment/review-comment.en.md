<!-- Paste into a GitHub review on the proposal PR. Tick what holds and add a one-line reason under any box you leave empty. -->
### Environment proposal review

**Agent report:** failed Blockers: `<n>`

<details><summary>Agent report</summary>

<!-- Paste the agent's table and its “For the reviewer” block here. -->

</details>

**H0 · Agent check is clean**
- [ ] H0.1 The agent report shows no failed Blocker, or each one has a reason you accept. (E0–E6)

**H1 · Are the main workflows worth building for personal-agent tasks?**
- [ ] H1.1 Doing these workflows right depends on knowing the person: their history, preferences, household or other apps. (E2.2)
- [ ] H1.2 You can think of at least one task a task author would want to build on them. (E2.1, E2.2)

**H2 · Do the app connections serve those workflows?**
- [ ] H2.1 Every connection is used by a §2 workflow; none is there just for show. (E3.1, E3.2)
- [ ] H2.2 No obvious connection is missing, such as a purchase that never sends a receipt to Mail. (E3.1)

**H3 · Could the platform and task authors build on it?**
- [ ] H3.1 A task author could set up a starting situation for a specific person and reset it afterwards. (E3.5, E3.7)
- [ ] H3.2 The actions and events cover what tasks on these workflows will need; nothing essential is missing. (E3.3, E3.6)

**H4 · Could you accept the finished work against this plan?**
- [ ] H4.1 The total effort looks realistic for the scope, the people named and the calendar time. (E4.1, E4.3, E4.4)
- [ ] H4.2 The planned checks are strong enough that you could accept the work against them at merge. (E4.2, E4.7)
- [ ] H4.3 The scope boundary leaves out the right things for a first version. (E4.5)

**H5 · Are the data, assets and run-time dependencies safe to use?**
- [ ] H5.1 Nothing in the data or assets looks risky to publish: sources, brand use and licenses all hold up. (E1.2, E4.6, E4.8)
- [ ] H5.2 The replay or stand-in plan for any outside service is believable, so runs will not depend on the live internet. (E4.6)

**Decision:** Approve if every box is ticked. Otherwise request changes and list the checkpoint IDs that are not ticked.
