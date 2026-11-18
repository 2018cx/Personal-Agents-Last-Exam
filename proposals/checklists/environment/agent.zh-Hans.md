# 环境 proposal 检查清单 · agent 版

覆盖 environment proposal 模板的每个字段，以及 proposal 列表机器人、CONTRIBUTING 和 PR #12 格式的要求。人工评审只根据这份报告判断 H0–H5。

## 执行流程

1. **读取输入.** proposal 文件、PR 标题和描述、environment proposal 模板、当前的 proposal 列表；采用 PR #12 格式时再读 PR #12 文档。
2. **先查 E0.** E0 对应 `scripts/sync_proposals.py` 读取的内容：PR 标题、PR 文件列表，以及 proposal 的标题和字段标签。先查这些。
3. **判断 E1–E4.** 按模板顺序（§1 到 §4）判断；“适用条件”不成立时判 n.a.。
4. **判断 E5–E6.** 再检查 CONTRIBUTING 的流程要求，以及采用时的 PR #12 格式。
5. **写报告.** 每条一行，未通过的必过项排在最前；最后附一段“给评审者”，对应 H1–H5。
6. **交给用户.** 不发评论、不 push，由用户决定下一步。

## 规则

- 判 fail 必须引用 proposal 原文，格式为 path:line。
- 条目适用但 proposal 没写时，判 unclear。
- 不要提出清单以外的要求。
- 按模板原文判断每个字段；不要要求模板没有要求的内容。
- H1–H5 给出你的判断和证据，由人来做决定。
- 作者模式：Fix 写成作者可直接贴上的文字。评审模式：Fix 写成简短的评审意见。

## 输出格式

| ID | 结论 | 证据（path:line） | 修法 |
| :--- | :--- | :--- | :--- |
| E2.2 | pass | `proposals/environment/ternway-air.md:14` “A rebooking depends on the traveler’s calendar and fare rules.” | — |
| E3.4 | fail | `proposals/environment/ternway-air.md:41` “Changes are confirmed by the agent.” | 补一句：“A change is a preview followed by confirm; the same `request_id` returns the same receipt; a stale `expected_version` is rejected.” |
| E6.2 | n.a. | E6.1 未发现重叠。 | — |

### 给评审者

- **H1 · workflow 值得构建** 改签、换座和退款；改签取决于旅客的日程和票价规则（`ternway-air.md:14`）。
- **H3 · 平台能在上面构建** 动作、reset 和事件都具体，但没写写入重试（E3.4 不通过）。
- **H4 · 计划可验收** 五个 workstream、34–46 人天，每个 workflow 一个测试（`ternway-air.md:60–72`）。

## 模板逐节检查

### E0 · 机器可读

proposal 列表的机器人要能读到你的 PR。这一组对应 `scripts/sync_proposals.py` 读取的内容。

#### E0.1 · PR 标题格式  [blocker · PR]
一句话: PR 标题写成 `[Environment Proposal] [<Domain>] <App or website name>`，主领域放第一个。
适用条件: 总是适用。
看哪里: PR 标题；§1 的 Primary domain 和 Secondary domains。
通过条件: 符合机器人的 `TITLE` 规则，并写 `Environment`；方括号里的第一个领域等于 Primary domain；其余领域用 ` + ` 连接。
不通过条件: 缺方括号、写成 `Env Proposal`、领域顺序和 §1 不一致，或领域名不在列表里。
修法: 直接给出改好的完整标题。
依据: sync_proposals.py · TITLE; CONTRIBUTING · Proposal naming

#### E0.2 · 只有一个 proposal 文件，路径正确  [blocker · PR]
一句话: PR 只新增一个文件，放在 `proposals/environment/<slug>.md`。
适用条件: 总是适用。
看哪里: PR 的文件列表。
通过条件: 恰好一个未删除的文件符合 `proposals/environment/[A-Za-z0-9][A-Za-z0-9_.-]*.md`；UTF-8 编码，不超过 200 KB。
不通过条件: 没有符合的文件或有两个（列表会显示 “Add exactly one proposal file for this track”）、slug 里有空格，或文件放在 `proposals/task/` 下。
修法: 指出要保留的唯一路径和要删掉的文件。
依据: sync_proposals.py · PROPOSAL_PATH, proposal_text()

#### E0.3 · 标题和字段标签不改  [blocker · §1–§4]
一句话: 模板的每个标题和粗体字段标签都原样保留，用英文。
适用条件: 总是适用。
看哪里: 整份 proposal 文件。
通过条件: `## 1.` 到 `## 4.` 的编号和文字不变；标签保持 `**Primary domain (required):**` 的写法，冒号在粗体里面。
不通过条件: 标题被翻译或改写、标签没加粗，或冒号放在粗体外面。这样机器人会把该字段读成空的。
修法: 引用出错的行，并给出要恢复的模板原文。
依据: sync_proposals.py · field(), answer()

#### E0.4 · 没有占位符，不光写 TBD  [blocker · §1–§4]
一句话: 不留任何 `[Fill in: …]`；每个 TBD 或 N/A 都写明原因或怎么决定。
适用条件: 总是适用。
看哪里: 所有字段。
通过条件: 不剩 `[Fill in:`；只在模板允许的地方写 `None`；每个 `TBD` 和 `N/A` 都附上原因：谁决定、何时决定，或在等什么。
不通过条件: 留有任何占位符，或必填字段里只写 `TBD`（列表会显示成空白）。
修法: 逐个列出字段，以及还缺的那句话。
依据: template · header note; sync_proposals.py · clean()

#### E0.5 · Primary domain 逐字一致  [blocker · §1]
一句话: Primary domain 必须是 15 个领域名之一，一字不差。
适用条件: 总是适用。
看哪里: §1 的 Primary domain 和 Secondary domains。
通过条件: 值必须等于以下之一：Money & insurance、Shopping & groceries、Travel & commuting、Health & care、Food & dining、Social & communities、Home & utilities、Public service & law、Media & entertainment、Learning & research、Work & business、News & information、Weather & outdoors、Games & play、Fitness & wellbeing。
不通过条件: 写成 `Health`、`Media and entertainment`、前面带 emoji，或在 Primary 字段写两个领域。列表会显示 “Needs a valid primary domain”。
修法: 给出应写的准确名称。
依据: README · Environment domains; sync_proposals.py · collect()

#### E0.6 · §2 第一段能单独读懂  [should · §2]
一句话: §2 的第一段要能单独读懂；proposal 列表只显示它的前 240 个字符左右。
适用条件: 总是适用。
看哪里: §2 中紧跟 `**✍️ Your answer (required):**` 的那一段。
通过条件: 前 240 个字符左右就讲清环境是什么、主要 workflow 和面向谁。
不通过条件: 开头是铺垫（“本 proposal 介绍……”），关键信息到后面几段才出现。
修法: 给出改写后的第一段。
依据: sync_proposals.py · answer(), escape_cell(limit=240)

#### E0.7 · PR 描述用 summary 模板  [should · PR]
一句话: PR 描述使用 PR summary 模板，勾选 Environment Track 并链接 proposal 文件；写完之前保持 Draft。
适用条件: 总是适用。
看哪里: PR 描述；PR 的 Draft 状态。
通过条件: 恰好一个 `- [x] Environment Track`；填了 Stage、Design file 和 Summary；撰写时是 Draft，请求评审时改为 ready。
不通过条件: 还留着模板的引导文字、勾了两个 Track，或没有链接设计文件。
修法: 贴出填好的 PR summary。
依据: templates/pr-summary.md; CONTRIBUTING · Start with a proposal

### E1 · App 与领域

模板 §1：作者、参考 App 或网站，以及首页列表里的领域。

#### E1.1 · 列出作者  [blocker · §1]
一句话: 列出每位作者和 GitHub @handle，并说明合作者。
适用条件: 总是适用。
看哪里: §1 的 Authors / GitHub handles；§4 的负责人。
通过条件: 每位参与者都有名字和 @handle，包括里程碑负责人。
不通过条件: 只写了开 PR 的人，§4 却出现了其他负责人。
修法: 列出漏掉的人。
依据: template §1; CONTRIBUTING · Integrity and maintenance

#### E1.2 · 参考产品与自有名称  [should · §1]
一句话: 写明参考 App 和网址，只作为 workflow 参考；环境用自己的名字，不复制对方的品牌素材。
适用条件: 总是适用。
看哪里: §1 的 Reference app or website / URL；§4 的 License。
通过条件: 写了参考产品和网址、环境自己的名字，并说明不沿用 logo、商标和受版权保护的文字或图片。这个字段也是 proposal 列表里显示的标题，所以开头写环境自己的名字。
不通过条件: 把环境当成真实产品来介绍，或素材计划里出现真实的品牌素材。
修法: 建议写成 “<自有名称>, a synthetic …; workflow reference: <产品> (<网址>)” 的形式。
依据: template §1, §4 License; CONTRIBUTING · Integrity and maintenance

#### E1.3 · 按 workflow 选领域  [should · §1]
一句话: 主领域对应主要 workflow；只有真正要做的 workflow 才加次领域。
适用条件: 总是适用。
看哪里: §1 的领域；§2 的 workflow。
通过条件: 每个次领域都对应 §2 里一个具体的 workflow。
不通过条件: 只因为连接了 Mail 或 Calendar 就加次领域。单纯连接不算新增领域。
修法: 指出该去掉的领域，或能支撑它的 workflow。
依据: CONTRIBUTING · Environment Track

### E2 · 计划构建什么

模板 §2：“Briefly describe the main workflows and why this environment would be useful for personal-agent tasks.”

#### E2.1 · 列出主要 workflow  [blocker · §2]
一句话: §2 列出主要 workflow，每个都写清用户想做什么、怎样结束。
适用条件: 总是适用。
看哪里: §2；§4 的 Web / app construction。
通过条件: 每个主要 workflow 都有用户目标和可以检查的结束状态（已预订、已退款、已发送）；参考产品里有的修改、取消和错误路径也要提到。
不通过条件: 只列功能（搜索、筛选、购物车），没有结束状态。
修法: 示范把一个 workflow 改写成“目标 → 步骤 → 结束状态”。
依据: template §2; CONTRIBUTING · “Complete” definition

#### E2.2 · 为什么对个人 agent 任务有用  [blocker · §2]
一句话: §2 说明这个环境为什么对个人 agent 任务有用：这个人或他的其他 App 的哪些情况会改变 agent 该做的事。
适用条件: 总是适用。
看哪里: §2；§3 的 Internal personal apps。
通过条件: 写出起作用的个人情况（历史、偏好、家庭、其他 App），最好附一个情境，说明它如何改变正确做法。
不通过条件: 只写“很热门”“很多人用”，或描述的是通用聊天机器人的价值。
修法: 从 workflow 里提一个示例情境。
依据: template §2; README · The personalization challenge

#### E2.3 · 概述保持简洁  [should · §2]
一句话: §2 保持简短；细节放在 §3 和 §4。
适用条件: 总是适用。
看哪里: §2。
通过条件: 一两段即可；集成和计划的细节放在 §3、§4，而不是 §2。
不通过条件: §2 写了好几页，或重复构建计划。
修法: 指出应移到 §3 或 §4 的部分。
依据: template · header (“Keep the overview concise.”)

### E3 · App 连接与集成细节

模板 §3：“Name possible connections and briefly explain their purpose.” 连接可以写 `None` 或 `TBD`；四个集成字段都是必填。

#### E3.1 · 内部个人 App  [blocker · §3]
一句话: 每个个人 App（Mail、Calendar、Contacts……）都写明读或写什么、为什么，没有就写 `None`。
适用条件: 总是适用。
看哪里: §3 的 Internal personal apps。
通过条件: 写出 App、方向（读或写）、涉及的对象和原因，例如“Mail：接收电子票回执”。不涉及个人 App 时写 `None` 即可；写 `TBD` 要说明怎么决定。
不通过条件: 只写“和 Calendar 集成”，没有对象和方向；或只写 TBD。
修法: 每个 App 起草一行。
依据: template §3 · Internal personal apps

#### E3.2 · 其他 App 和网站  [blocker · §3]
一句话: 列出其他 App 或网站，以及共享的 workflow；没有就写 `None`。
适用条件: 总是适用。
看哪里: §3 的 Other apps and websites。
通过条件: 每个服务都写了共享的 workflow，以及彼此之间传递什么。写 `None` 也可以；写 `TBD` 要说明怎么决定。
不通过条件: 只列了名字。
修法: 为每个名字补上共享的 workflow。
依据: template §3 · Other apps and websites

#### E3.3 · 操作与访问  [blocker · §3]
一句话: 列出 agent 可用的动作和入口（MCP、API 或 GUI），以及 setup、reset 和事件注入操作。
适用条件: 总是适用。
看哪里: §3 的 Operations and access。
通过条件: 动作写成“动词 + 对象”（查场次、锁座、购买、退款），并注明入口；平台操作另外列出。
不通过条件: 只写“会提供 MCP server”，或没有 reset、事件注入操作。
修法: 根据 §2 的 workflow 起草动作列表。
依据: template §3 · Operations and access

#### E3.4 · 写入、重试与并发更新  [blocker · §3]
一句话: 写明写入怎么确认、重试返回什么、并发更新怎么处理。
适用条件: App 有任何写入动作时。
看哪里: §3 的 State and lifecycle 和 Operations and access。
通过条件: 三点都具体，例如 preview → confirm；同一个 `request_id` 返回同一张回执；版本过期的写入被拒绝。
不通过条件: 缺任何一点，或写 TBD 却没说怎么决定。
修法: 每个缺的点给一句可直接贴上的话。
依据: template §3 · State and lifecycle

#### E3.5 · 状态、初始数据与 reset  [blocker · §3]
一句话: 区分 app、账户和 run 三层状态，写明开始时载入什么、reset 恢复什么。
适用条件: 总是适用。
看哪里: §3 的 State and lifecycle；§4 的 Validation and reset。
通过条件: 写明哪些是共享的目录数据、哪些属于用户账户、哪些只存在于一次 run；task 能否提供自己的初始数据（用户的账户、历史和人员）；reset 回到初始数据；说明 snapshot 的行为。
不通过条件: 只写“重置数据库”而没有范围，或 reset 会连带清掉其他 App。
修法: 为这个 App 起草三层划分。
依据: template §3 · State and lifecycle; §4 Validation and reset

#### E3.6 · 事件与通知，附示例  [blocker · §3]
一句话: 列出 App 接受的外部事件和会发出的通知，各附一个小示例；没有就写 `None`。
适用条件: 总是适用。
看哪里: §3 的 Events and notifications。
通过条件: 每个事件和通知都有渠道和数据示例（场次取消、回执邮件）。事件何时发生由 task 场景决定。
不通过条件: 只列事件名，没有输入或输出示例。
修法: 写一个 payload 示例。
依据: template §3 · Events and notifications

#### E3.7 · 共享数据与依赖  [blocker · §3]
一句话: 写明跨 App 时人、账户和对象怎么引用，媒体与附件格式，以及运行需要的共享服务。
适用条件: 总是适用。
看哪里: §3 的 Shared data and dependencies。
通过条件: 人和账户用共享 ID 引用，而不是复制一份；写明格式（PDF 电子票、PNG 二维码）；列出共享组件。
不通过条件: 每个 App 各存一份同样的人，或没写格式。
修法: 写出共享 ID 和格式。
依据: template §3 · Shared data and dependencies

### E4 · 构建计划与工作量

模板：“The construction plan defines the scope, deliverables, quality checks and effort that reviewers will follow through implementation and merge in this same PR.”

#### E4.1 · 每个 workstream 都填了，并有数字  [blocker · §4]
一句话: 五个 workstream 行都写出计划规模（用数字），或写 `N/A` 并说明原因。
适用条件: 总是适用。
看哪里: §4 的 Work breakdown 表格。
通过条件: Web / app construction、Data and image collection、Synthetic data and assets、App integrations、Validation and reset 每一行都有数量或范围（页面、workflow、记录、图片）；标出复用的组件。
不通过条件: 格子是空的、写“若干”，或 N/A 没有原因。
修法: 列出要补的格子。
依据: template §4 · Work breakdown

#### E4.2 · 别人也能执行的检查  [blocker · §4]
一句话: 每个交付物都有别人也能执行、结果一致的质量检查。
适用条件: 总是适用。
看哪里: §4 的 Deliverable / quality check 列。
通过条件: 写明检查什么、怎样算通过，例如“9 个 workflow 测试全过；reset 后的状态哈希等于初始值；没有失效图片”。
不通过条件: 只写“已测试”“QA”或“人工检查”。
修法: 示范把一项检查改写成带通过条件的形式。
依据: template §4 · Deliverable / quality check; CONTRIBUTING · Proposal review

#### E4.3 · 工作量、总量与成本  [blocker · §4]
一句话: 每行写人天（可以是范围），并写总量，以及预计的采集、生成、存储和计算成本。
适用条件: 总是适用。
看哪里: §4 的 Effort 列；Resources and total effort。
通过条件: 每行都有人天，总量和各行对得上，成本是数字或有说明的 TBD。
不通过条件: 没有总量、总量加不起来，或缺成本。
修法: 算出总和并指出缺的数字。
依据: template §4 · Resources and total effort

#### E4.4 · 里程碑、负责人、依赖  [blocker · §4]
一句话: 里程碑有顺序、负责人和日历时长；依赖和相关 PR 都有链接。
适用条件: 总是适用。
看哪里: §4 的 Milestones, owners and dependencies。
通过条件: 每个里程碑写明由谁做、在等什么，例如共享基础设施的发布。
不通过条件: 有日期没负责人，或提到依赖却没有链接。
修法: 列出缺负责人或链接的里程碑。
依据: template §4 · Milestones, owners and dependencies

#### E4.5 · 范围边界与待定问题  [blocker · §4]
一句话: 写明第一版不做什么、待定问题怎么解决；第一版不必做齐参考产品的所有功能。
适用条件: 总是适用。
看哪里: §4 的 Scope boundary and open questions；§2。
通过条件: 列出排除和延后的内容；每个待定问题都有负责人或决定时间点。
不通过条件: 没有任何排除项，或计划要做出整个参考产品。
修法: 建议把哪些延后，让第一版便于评审。
依据: template §4 · Scope boundary; CONTRIBUTING · “Complete” definition

#### E4.6 · 许可、托管与运行时依赖  [blocker · §4]
一句话: 写明代码和素材的许可、哪些是托管而不是再分发，以及运行时的外部服务怎么回放或受控。
适用条件: 总是适用。
看哪里: §4 的 License and external dependencies。
通过条件: 代码和素材都写了许可；标出托管的部分；每个运行时外部服务都有回放或受控方案，或字段写 `None`。
不通过条件: 没有许可，或运行时直接调用第三方 API 而没有回放。
修法: 指出缺的许可，或需要回放方案的服务。
依据: template §4 · License and external dependencies

#### E4.7 · 验证与 reset 计划  [blocker · §4]
一句话: Validation and reset 行写出业务测试、workflow 和错误用例、reset 检查，以及平台验证用的 fixture 和预期结果。
适用条件: 总是适用。
看哪里: §4 的 Validation and reset 行。
通过条件: 每个列出的 workflow 至少有一个带预期结果的测试；reset 有检查；证据会涵盖权限、状态一致性和 reset。
不通过条件: 只写“单元测试”或“人工 QA”，没有用例和预期结果。
修法: 按 workflow 列出要补的测试。
依据: template §4 · Validation and reset row

#### E4.8 · 采集数据的来源与复用记录  [blocker · §4]
一句话: 采集的数据和图片附有来源、复用条款，以及取用内容的记录。
适用条件: 计划采集、抓取或复用外部数据或图片。
看哪里: §4 的 Data and image collection 行；License and external dependencies。
通过条件: 每个来源都有复用条款或许可，交付物包括来源和复用记录，以及完整性和失效媒体的检查。
不通过条件: 抓取的内容没有条款，或图片没有来源记录。
修法: 列出需要补条款或记录的来源。
依据: template §4 · Data and image collection row

## 流程与共享格式

### E5 · 共享格式（PR #12）

采用 PR #12 包格式，或连接 Mail、Calendar、Contacts 时适用。PR #12 尚未合并，所以这一组都是建议项。

#### E5.1 · 读取不改变状态  [should · §3]
一句话: 只读动作永远不改存储的数据；跟时间有关的状态在读取时计算。
适用条件: 采用 PR #12 包格式，或连接 Mail、Calendar、Contacts。
看哪里: §3 的 Operations and access；State and lifecycle。
通过条件: 时钟推进和过期只在写入和事件时执行；读取根据存储的日期计算状态，数据原样返回。
不通过条件: 每次调用（包括读取）都先推进时钟再保存。
修法: 把推进步骤移到写入和事件处理里。
依据: PR #12 read contract: business tests check that data is unchanged after reads

#### E5.2 · 重试以 request_id 为键  [should · §3]
一句话: 每个写入都带 `request_id` 和 `expected_version`；同一个 `request_id` 重复提交返回同一张回执。
适用条件: 采用 PR #12 包格式，或连接 Mail、Calendar、Contacts。
看哪里: §3 的 Operations and access；State and lifecycle。
通过条件: 幂等键只有 `request_id`；preview ID 是业务指纹，不是键；用新的 `request_id` 重用已用过的 preview 会报错。
不通过条件: 以 preview、草稿或回执 ID 做幂等键，或没有 `expected_version`。
修法: 在 §3 用一句话写明规则。
依据: PR #12 tool schemas: both fields are required on every write

#### E5.3 · 引用个人 App，不重做  [should · §3]
一句话: Mail、Calendar、Contacts 通过 `binding.json` 引用；App 永远不直接写它们的数据。
适用条件: 采用 PR #12 包格式，或连接 Mail、Calendar、Contacts。
看哪里: §3 的 Internal personal apps；Shared data and dependencies。
通过条件: 通知经 outbox 交给平台；日历变更由平台或 agent 写入。
不通过条件: App 自带邮件或日历的页面或工具，或把已发邮件存进自己的状态。
修法: 改成 binding 引用加 outbox 通知。
依据: PR #12 Mail and Calendar packages; binding.json

#### E5.4 · reset 只管本 App  [should · §3]
一句话: reset 只恢复本 App 实例（`reset_scope: app_instance`）；已经投递的邮件不收回。
适用条件: 采用 PR #12 包格式，或连接 Mail、Calendar、Contacts。
看哪里: §3 的 State and lifecycle；§4 的 Validation and reset。
通过条件: 跨 App 的清理交给场景或平台。
不通过条件: reset 连 Mail 或 Calendar 一起恢复。
修法: 把跨 App 清理移出本 App 的 reset。
依据: PR #12 contribution.json · reset_scope

#### E5.5 · 事件信封、时区、单位、名称  [should · §3]
一句话: 事件用 `{event_id, at, operation, payload}`，`at` 带时区，金额带单位；平台钩子叫 `env.apply_event`。
适用条件: 采用 PR #12 包格式，或连接 Mail、Calendar、Contacts。
看哪里: §3 的 Events and notifications；Operations and access。
通过条件: §3 的示例符合信封格式。每个 operation 都在 `app.json` 的 `event_types`、`events.schema.json` 和 `contribution.json` 的 `events.accepts` 里声明（实现时检查）。
不通过条件: 用 `type` 代替 `operation`、时间没有时区、金额只有数字，或写成 `env.inject_event`。
修法: 改写示例事件。
依据: PR #12 events.schema.json; infra-mcp

### E6 · 重叠与分工

来自 CONTRIBUTING：先查 proposal 列表里的相关工作，并链接重叠的 proposal。

#### E6.1 · 链接重叠的 proposal  [blocker · §3–§4]
一句话: 查过 proposal 列表，用 PR 编号链接所有重叠的环境或 task proposal；没有就写“未发现”和查的日期。
适用条件: 总是适用。
看哪里: 当前的 proposal 列表；§3 的 Other apps and websites；§4 的 Milestones；PR 描述的 Dependencies。
通过条件: 同类产品或同领域的 proposal 都有链接；需要这个环境的 task proposal 也列出来。
不通过条件: 列表里已有同类 App 的 proposal，这里却没提。
修法: 列出要链接的 PR 编号。
依据: CONTRIBUTING · Start with a proposal; Review and implementation

#### E6.2 · 写明分工  [should · §3–§4]
一句话: 对每个重叠，写明你做什么、复用什么、留给对方什么。
适用条件: E6.1 发现了重叠或依赖。
看哪里: §3；§4 的 Milestones, owners and dependencies。
通过条件: 每个链接的 PR 都有一句分工说明。
不通过条件: 只有链接，没有说明。
修法: 为每个链接起草分工说明。
依据: CONTRIBUTING · Review and implementation
