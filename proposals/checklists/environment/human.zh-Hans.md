# 环境 proposal 评审 · 关键项

agent 检查所有条目；模板的每个部分，你只判断 2–3 个需要人来判断的点。

### H0 · agent 检查已通过

- [ ] **H0.1** agent 报告里没有未通过的必过项，或者每一项都有你能接受的理由。 (E0–E6)

### H1 · 主要 workflow 值得为个人 agent 任务构建吗？

模板： §2 “Briefly describe the main workflows and why this environment would be useful for personal-agent tasks.”

- [ ] **H1.1** 要把这些 workflow 做对，得了解这个人：他的历史、偏好、家庭或其他 App。 (E2.2)
- [ ] **H1.2** 你能想到至少一个 task 作者会想在上面做的 task。 (E2.1, E2.2)

### H2 · App 连接服务于这些 workflow 吗？

模板： §3 “Name possible connections and briefly explain their purpose.”

- [ ] **H2.1** 每个连接都被 §2 的某个 workflow 用到，没有只是摆着好看的。 (E3.1, E3.2)
- [ ] **H2.2** 没有漏掉明显该有的连接，例如买完东西却没有回执寄到 Mail。 (E3.1)

### H3 · 平台和 task 作者能在上面构建吗？

模板： §3 Integration details：Operations and access、State and lifecycle、Events and notifications、Shared data and dependencies 都是必填。

- [ ] **H3.1** task 作者能为某个特定的人摆好开局情境，结束后也能 reset。 (E3.5, E3.7)
- [ ] **H3.2** 动作和事件涵盖这些 workflow 上的 task 会用到的东西，没有缺少关键的部分。 (E3.3, E3.6)

### H4 · 能按这份计划验收最终成果吗？

模板： “The construction plan defines the scope, deliverables, quality checks and effort that reviewers will follow through implementation and merge in this same PR.”

- [ ] **H4.1** 以范围、列出的人手和日历时间来看，总工作量合理。 (E4.1, E4.3, E4.4)
- [ ] **H4.2** 计划中的检查够扎实，合并时可以拿来验收。 (E4.2, E4.7)
- [ ] **H4.3** 范围边界对第一版的取舍是对的。 (E4.5)

### H5 · 数据、素材和运行时依赖可以安全使用吗？

模板： §4 License and external dependencies：代码和素材的许可、哪些托管而不再分发、运行时服务如何回放或受控。

- [ ] **H5.1** 数据和素材里没有发布风险：来源、品牌使用和许可都站得住。 (E1.2, E4.6, E4.8)
- [ ] **H5.2** 外部服务的回放或替身方案可信，运行不会依赖真实网络。 (E4.6)

