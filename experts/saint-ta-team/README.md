# SAINT 助教团 · 专家团（Team 型）

把你的 SAINT 工作台发布成 WorkBuddy **专家团**——三位助教 + 一位主理人协同服务你的教学全流程。

## 团队阵容

| 角色 | 花名 | 职责 | 数据能力 |
|---|---|---|---|
| 🎩 主理人 | **卓有成** | 教学操盘手：调度三助教、汇编交付 | 团队协作编排 |
| 🔍 学情分析师 | **苗知秋** | 见微知著：学员画像、活跃趋势、风险识别 | students / activity / submissions |
| 📖 备课策划师 | **柯大纲** | "课"大纲：课程进度、纪要检索、备课方案 | lessons / minutes-search / feedback |
| 💗 学员关怀官 | **甄贴心** | 真·贴心：满意度解读、跟进优先级、关怀话术 | satisfaction / feedback / stats |

**协作机制**：主理人 TeamCreate 建团 → 按 SOP 并行/串行调度成员 → 成员查真实数据回传 → 主理人汇编交付。预设 4 个 Workflow：学情速览 / 备课工坊 / 关怀行动 / 纪要问答。

## 使用方法

### 方式一：让 WorkBuddy 自动转化（推荐）

在 WorkBuddy 对话中说：

> 帮我把 SAINT 的 Skill B 转化成我的专属助教专家团（Team 型，一主理人 + 三成员）

WorkBuddy 会按专家团规范自动完成：初始化 → plugin.json + settings.json + 4 个 Agent MD → 统一风格头像 → 校验 → 注册。

### 方式二：手动安装本模板

1. 把整个 `saint-ta-team/` 目录复制到 WorkBuddy 专家目录：
   ```
   Windows: %USERPROFILE%\.workbuddy\plugins\marketplaces\my-experts\plugins\saint-ta-team\
   macOS/Linux: ~/.workbuddy/plugins/marketplaces/my-experts/plugins/saint-ta-team/
   ```
2. **替换 API 地址**：把 `agents/` 下 4 个 MD 中的 `{BASE}` 批量替换为你的工作台地址（默认 `http://localhost:8787`）
3. 重启 WorkBuddy → 左侧栏「专家」→「我的专家」→ 出现 **SAINT 助教团**（专家团标识）

## 验收

对专家团说「学员们最近整体表现怎么样？」——主理人调度多位助教并行分析后给出汇总结论（能看到协作过程）即成功。

## 文件结构

```
saint-ta-team/
├─ .codebuddy-plugin/plugin.json   # 专家团元信息（4 成员/标签/推荐提示词/teamInfo）
├─ settings.json                   # { "agent": "saint-ta-team-lead" }
├─ agents/
│  ├─ saint-ta-team-lead.md        # 主理人：SOP/Workflow/协作铁律/路由表
│  ├─ insight-analyst.md           # 苗知秋：学情分析 → {BASE} 占位
│  ├─ lesson-planner.md            # 柯大纲：备课策划 → {BASE} 占位
│  └─ care-liaison.md              # 甄贴心：学员关怀 → {BASE} 占位
└─ avatars/                        # 5 张：team.jpg + 4 成员（512×512 JPG）
```

> 分类：09-OperationsHR（运营人力·培训）｜标签：学情分析 / 备课策划 / 学员关怀
> 成员花名彩蛋：**苗**知秋（见微知**苗**）、**柯**大纲（"柯"谐音"课"）、**甄**贴心（"甄"谐音"真"）、卓有**成**（卓有成效）
