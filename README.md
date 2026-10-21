# SAINT · 超级教师工作台

**S**uper **AI** **N**etworked Teacher —— 一套开源的「教师个人数据中枢」。

一个网站工作台 + 两个 Skill（搭建引导 + 工作台专属）+ 定时数据同步。任何教师（尤其是用 ZCode 等 AI 智能体的教师）不需要自己开发，就能从本模板拉起属于自己的工作台：把**腾讯问卷 / 腾讯文档 / 腾讯会议**（辅以飞书）的数据自动同步进来，实现学员跟进、进度追踪、备课辅助；部署完成后**自动生成工作台专属 Skill**，任何 AI 智能体挂上即可直接查询和解读数据。

```
腾讯问卷 ──┐
腾讯文档 ──┤  连接器 + 每日定时同步     ┌──────────────┐
腾讯会议 ──┼────────────────────────▶ │ 本地数据层     │──▶ 工作台网站（看板）
飞书(兼容) ─┘   （增量，有新就收）       │ （标准数据契约）│        │
                                     └──────────────┘        ▼
                     Skill A（搭建引导）                只读 API
                                                              ▼
                                                  Skill B（部署后自动生成）
                                                              ▼
                                                    任何 AI 智能体
                                       （"最近学员怎么样？""下节课备什么？"）
```

## ✨ 功能

- **总览看板**：学员数、待跟进名单、作业提交趋势、下节课愿望主题聚类
- **学员 360°**：档案 / 主攻方向 / 作业提交 / 卡点记录 / 愿望 / 成长时间线
- **课程与会议**：课程进度轴 + 会议记录（含智能纪要摘要）
- **作业任务看板**：提交率、迟交标记、提交明细
- **反馈墙**：「下节课想学什么」按主题聚类
- **双 Skill**：Skill A 引导搭建；Skill B 自动生成，让 AI 用自然语言查数据
- **本地优先**：数据存本机 SQLite（`data/saint.db`），仓库零真实数据

## 🚀 快速开始

### 方式一：给 AI 说一句话（推荐）

在你的 AI 智能体（ZCode 等）里挂载 `skills/skill-a/SKILL.md`，然后说：

> 我想搭一个超级教师工作台

AI 会引导你完成全部 6 步。

### 方式二：手动搭建

```bash
git clone https://github.com/<你的账号>/saint-teacher-workbench.git
cd saint-teacher-workbench

npm run setup    # 安装依赖
npm run build    # 构建前端
npm run mock     # （可选）生成演示数据
npm start        # 启动 → http://localhost:8787
```

> 要求 Node ≥ 22.5（使用内置 SQLite，无需安装数据库）。服务端零 npm 依赖。

### 导入你的真实数据

把采集到的问卷导出（`.ndjson`）与会议纪要（`.json`）放入 `data/raw/`，然后：

```bash
npm run import   # 立即全量导入（幂等，可重复运行）
npm run skill-b  # 生成你的工作台专属 Skill
```

## 📦 目录结构

```
├─ docs/            # 需求、API、工程规范、数据契约（contracts/*.schema.json）
├─ web/             # 工作台前端（React + Vite + Tailwind）
├─ server/          # 服务端（node:http + node:sqlite，零依赖）
├─ connectors/      # 数据源连接器（local-import 已可用；腾讯系预留）
├─ sync/            # 同步任务运行器
├─ skills/
│  ├─ skill-a/      # 搭建引导 Skill（给人用）
│  └─ skill-b/      # 工作台专属 Skill 生成器（给 AI 用）
└─ data/            # 本地数据（gitignore，绝不上传）
```

## 🔒 数据安全（硬性）

- 仓库只含空框架 + Mock 数据；真实学员数据一律在 `data/`（已 `.gitignore`）
- API 全部只读，无写接口
- License：MIT

## 📖 文档

- [需求文档](docs/requirements.md) · [API 文档](docs/api.md) · [工程规范](docs/engineering.md) · [数据契约](docs/contracts/)

---

# SAINT · Super AI Networked Teacher (English)

An open-source **personal data hub for teachers**: a web workbench + two Skills (setup guide + auto-generated workbench Skill) + scheduled data sync. Sync your **Tencent Survey / Tencent Docs / Tencent Meeting** (plus Feishu) data automatically for student tracking, progress management and lesson prep. After deployment, a **workbench-specific Skill** is auto-generated so any AI agent can query your data in natural language.

```bash
git clone https://github.com/<your-account>/saint-teacher-workbench.git
cd saint-teacher-workbench
npm run setup && npm run build && npm run mock && npm start
# → http://localhost:8787   (Node ≥ 22.5, zero server dependencies)
```

**Data safety**: the repo ships with mock data only; real student data lives in `data/` (gitignored). All APIs are read-only. MIT licensed.
