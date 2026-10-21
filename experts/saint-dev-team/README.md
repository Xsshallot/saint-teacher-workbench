# 超级教师工作台开发团 · 专家团（Team 型）

把 SAINT 的搭建引导（Skill A）发布成 WorkBuddy **专家团**——别人在 WorkBuddy 里跟这个团队对话，就能从零搭建起一套完整的超级教师工作台（含数据接入与助教团发布）。

## 团队阵容

| 角色 | 花名 | 职责 | 对应搭建步骤 |
|---|---|---|---|
| 🎩 主理人 | **齐落成** | 交付总监：流程编排、阶段验收、交付报告 | 全流程（7 步） |
| 🔧 环境搭建工程师 | **安启业** | Node 检查、模板拉取、依赖安装、启动验证 | 第 1-2 步 |
| 🔌 数据接入工程师 | **连汇通** | 连接器配置、数据落位、定时同步、首次验收 | 第 3-5 步 |
| 🤖 AI 配置工程师 | **艾配齐** | Skill B 生成交付、助教专家团安装、AI 问答验收 | 第 6-7 步 |

**交付流程**（严格串行）：环境搭建 → 数据接入 → AI 配置 → 终验收（交付报告）。
**预设 Workflow**：全流程搭建 / 环境诊断 / 数据排查 / 升级维护。

花名彩蛋：**齐落成**（工作台落成）、**安启业**（安装启动开创基业）、**连汇通**（连接器打通数据汇流）、**艾配齐**（"艾"谐音 AI，配置配齐）。

## 使用方法

### 方式一：复制安装本模板

1. 把整个 `saint-dev-team/` 目录复制到 WorkBuddy 专家目录：
   ```
   Windows: %USERPROFILE%\.workbuddy\plugins\marketplaces\my-experts\plugins\saint-dev-team\
   macOS/Linux: ~/.workbuddy/plugins/marketplaces/my-experts/plugins/saint-dev-team/
   ```
2. 重启 WorkBuddy → 左侧「专家」→「我的专家」→ **超级教师工作台开发团**

### 方式二：从开源仓库直接搭建（推荐给复刻者）

在 WorkBuddy 对话中说："帮我从零搭建 SAINT 超级教师工作台"，并指向本专家团（或直接按仓库 README 的 Skill A 搭建引导操作）。

## 验收

对专家团说"帮我从零搭建 SAINT 超级教师工作台"——齐落成建团并按 4 个 Phase 串行调度三位工程师，每阶段验收通过后推进，最终交付《交付报告》。

## 文件结构

```
saint-dev-team/
├─ .codebuddy-plugin/plugin.json   # 专家团元信息（4 成员/teamInfo/推荐提示词）
├─ settings.json                   # { "agent": "saint-dev-team-lead" }
├─ agents/
│  ├─ saint-dev-team-lead.md       # 主理人：4 Phase SOP/4 Workflow/协作铁律
│  ├─ env-engineer.md              # 安启业：环境与启动（含故障速查）
│  ├─ data-engineer.md             # 连汇通：数据与同步（含 data/raw 落位规范）
│  └─ ai-configurator.md           # 艾配齐：Skill B + 助教团（含安装命令）
└─ avatars/                        # 5 张：team.jpg + 4 成员（512×512 JPG）
```

> 分类：02-Engineering（技术工程）｜标签：工作台搭建 / 数据接入 / AI 技能配置
