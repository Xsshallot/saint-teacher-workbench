---
name: saint-setup
description: 超级教师工作台（SAINT）搭建引导技能。当教师说"我想搭一个超级教师工作台 / SAINT / saint-teacher-workbench"或想复刻部署该工作台时使用。引导完成：连接器检查 → 拉取模板 → 配置数据源 → 建定时任务 → 首次同步验收 → 生成工作台专属 Skill（Skill B）。
---

# SAINT 超级教师工作台 · 搭建引导

你要引导一位教师从零拉起属于自己的「超级教师工作台」。全程保持耐心、每一步给出口令和预期结果，遇到失败按「常见问题」排查。**不要替用户做决定，但每一步都给出推荐默认值。**

## 开始语（触发后第一句话）

> 好的！我们开始搭建你的 SAINT 超级教师工作台。整个过程大约 10 分钟，分 7 步：检查连接器 → 拉取模板 → 配置数据源 → 建定时任务 → 首次同步 → 生成专属 AI 查询技能 → 发布成专属助教专家。我们一步步来。

## 第 1 步 · 环境与连接器自检

### 1.1 检查 Node.js（必须，≥ 22.5）

```bash
node -v
```

- 输出 ≥ v22.5.0 → 通过（工作台使用 Node 内置 SQLite，无需数据库软件）。
- 未安装或版本过低 → 指导到 https://nodejs.org 下载 LTS 版本。

### 1.2 逐项检查数据源连接器

问用户："你的学员数据主要在哪里？腾讯问卷 / 腾讯文档 / 腾讯会议 / 飞书，用哪几个？"

| 连接器 | 检查方法 | 未开通时怎么办 |
|---|---|---|
| 腾讯问卷 | 在 AI 助手的连接器/插件菜单中查看「腾讯问卷」是否已连接 | 在应用内「+ 连接器」菜单搜索并授权；需要腾讯问卷账号 |
| 腾讯文档 | 同上，查看「腾讯文档」 | 同上；需要 docs.qq.com 账号 |
| 腾讯会议 | 同上，查看「腾讯会议」 | 同上；需要会议账号（拉取会议记录与纪要） |
| 飞书（可选） | 同上，查看「飞书」 | 同上；用于兼容已有飞书问卷/文档数据 |

> 说明：v0.1 版本开箱即用的是「本地导入」连接器（把已导出的问卷/纪要文件放入 `data/raw/` 即可）。腾讯系连接器为预留接口，配置好账号后按 `connectors/` 目录规范启用。

## 第 2 步 · 拉取模板并启动

```bash
git clone https://github.com/Xsshallot/saint-teacher-workbench.git
cd saint-teacher-workbench
npm run setup     # 安装依赖（web + server）
npm run build     # 构建前端
npm start         # 启动服务端（默认 http://localhost:8787）
```

- 没有 git：到仓库页面 Code → Download ZIP，解压后同上。
- 预期结果：终端显示 `SAINT · 超级教师工作台已启动`，浏览器打开 http://localhost:8787 能看到总览页（此时是空数据或 Mock 数据）。

## 第 3 步 · 配置数据源

1. **本地导入（v0.1 主路径）**：把采集到的数据文件放进 `data/raw/`：
   - 问卷导出：`*.ndjson`（每行一条 JSON 记录，字段见 `docs/contracts/`）
   - 会议纪要：`*.json`（含 `data.meeting_minute.minute` 结构）
   - 会议清单：`meetings_all.txt`（`时间 | 主题 | 会议号 | ...` 格式）
2. **腾讯系（预留）**：在 AI 助手里确认连接器已授权后，按 `connectors/README.md` 的接口规范实现/启用对应 connector。

## 第 4 步 · 建立定时任务

服务端内置每日同步调度（默认每天 06:00 运行 `daily-import`），无需额外配置。
如需修改时间：改 `sys_config` 表的 `sync_hour`，或直接用系统 cron：

```bash
# 每天 6 点同步（可选，二选一即可）
0 6 * * * cd /path/to/saint-teacher-workbench && npm run sync
```

同步要求：**增量、幂等**（重复跑不产生脏数据）、每次写 `syn_log` 日志（网站「设置」页可见）。

## 第 5 步 · 首次同步与验收

```bash
npm run import    # 立即跑一次全量导入
```

**验收标准（全部满足才算成功）**：
- [ ] 打开网站「总览」页，学员总数 > 0
- [ ] 「学员」页能看到学员列表与主攻方向
- [ ] 「课程与会议」页有课次与会议记录
- [ ] 「设置」页 local-import 显示「已连接」，日志有 success 记录

任何一条不满足 → 查 `data/saint.db` 是否生成、`data/raw/` 文件格式是否符合契约 → 见常见问题。

## 第 6 步 · 生成工作台专属 Skill（Skill B）

```bash
npm run skill-b   # 生成 skills/skill-b/generated/SKILL.md
```

生成后引导用户：
1. 把 `skills/skill-b/generated/SKILL.md` 的内容交给 AI 助手（ZCode 等）挂载为技能。
2. 从此可以直接问 AI："最近学员怎么样？""XX 同学状态如何？""下节课备什么？"

## 第 7 步 · 发布成 WorkBuddy 专属助教专家（推荐）

> 目标：让"助教"成为 WorkBuddy 里一个常驻专家——不用每次挂 Skill，从「专家中心」点开就能问。

**前置**：第 6 步已生成 Skill B，工作台可访问。

### 方式一：一句话自动转化（推荐）

在 WorkBuddy 对话里直接说：

> 帮我把 SAINT 的 Skill B（skills/skill-b/generated/SKILL.md）转化成我的专属助教专家

WorkBuddy 内置的专家管理能力会自动完成全部流程：初始化专家目录 → 生成 plugin.json（名称/分类/标签/推荐提示词）→ 生成 Agent 定义 → 校验 → 注册。完成后在左侧栏「专家 → 我的专家」出现。

### 方式二：手动安装现成模板

仓库已内置完整专家包模板 `experts/saint-assistant/`（含 plugin.json + Agent 定义 + 使用说明）：

1. 复制模板目录到 WorkBuddy 专家目录：
   ```
   Windows: %USERPROFILE%\.workbuddy\plugins\marketplaces\my-experts\plugins\saint-assistant\
   macOS/Linux: ~/.workbuddy/plugins/marketplaces/my-experts/plugins/saint-assistant/
   ```
2. 编辑 `agents/saint-assistant.md`，把正文中的 `{BASE}` 替换为自己的工作台地址（默认 `http://localhost:8787`）
3. 放置头像 `avatars/expert.jpg`（512×512 以内，可直接用 `docs/assets/logo.jpg`）
4. 重启 WorkBuddy，在「专家中心 → 我的专家」查看

### 专家包关键信息（自动转化时确认这些值）

| 项 | 推荐值 |
|---|---|
| 名称 / 花名 | `saint-assistant` / SAINT 助教 |
| 职业 | 专属助教（Teaching Assistant） |
| 分类 | 运营人力（培训） |
| 标签（3 个） | 学员跟进 / 备课辅助 / 教学数据分析 |
| 推荐提示词（3 个） | "最近学员们整体怎么样？" / "下节课该准备什么？" / "谁需要重点跟进？" |

### 验收标准

- [ ] 专家中心「我的专家」出现 SAINT 助教（带头像与能力介绍）
- [ ] 点开专家问"最近学员们整体怎么样？"，能基于工作台真实数据回答
- [ ] 问"这节课讲了什么？"，能检索课堂纪要知识库作答

## 常见问题（FAQ）

| 症状 | 原因与解法 |
|---|---|
| `npm start` 报 SQLite 相关错误 | Node 版本 < 22.5；升级 Node，或用 `node --experimental-sqlite` 运行 |
| 网页打不开但终端显示已启动 | 端口被占用：`PORT=9090 npm start` 换端口 |
| 导入后数据为 0 | `data/raw/` 文件缺失或字段名不匹配；对照 `docs/contracts/` 修正 |
| 想换一台电脑用 | 整个目录拷走即可；数据都在 `data/saint.db`（注意备份，勿提交到 git） |
| 想多人/多班级 | v0.1 已支持单教师多班级（`stu_profile.class_name`）；多教师需扩展 `sys_user` |
| 专家发布后在「我的专家」里找不到 | 确认目录位置正确（`~/.workbuddy/plugins/marketplaces/my-experts/plugins/`）且已重启 WorkBuddy；Agent MD 中的 `{BASE}` 未替换会导致问不出数据 |

## 安全红线（必须告知用户）

1. **真实学员数据只存在本机 `data/` 目录**，`.gitignore` 已隔离，**绝不**提交到 GitHub。
2. 仓库对外只含空框架 + Mock 数据（`npm run mock` 生成演示数据）。
3. Skill B 只读，不提供任何写操作。
