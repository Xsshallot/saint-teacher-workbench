# SAINT · 工程规范（v0.1）

> 目的：让复刻者、Skill A、Skill B、连接器对"数据长什么样"有一致认知。
> 数据契约见 `docs/contracts/*.schema.json`（三处共用：连接器写入 / 网站渲染 / Skill B 讲解）。

## 1. 项目结构

```
repo/
├─ docs/            # 需求、规范、数据契约
│  └─ contracts/    # 各数据域 JSON Schema
├─ web/             # 工作台前端（React + Vite + Tailwind，构建产物 web/dist）
├─ server/          # 数据接口 + 数据层（Node ≥22.5 零依赖：node:http + node:sqlite）
├─ connectors/      # 各数据源连接器（问卷/文档/会议/飞书/本地导入）
├─ sync/            # 同步任务运行器（CLI）
├─ skills/          # Skill A 源文件、Skill B 生成器与模板
├─ data/            # 本地数据（gitignore）：saint.db 数据库 + raw/ 原始采集文件
└─ README.md        # 中英双语快速开始
```

## 2. 表设计规范

**表命名**：`[模块缩写]_[业务名]`，小写下划线。

| 模块 | 前缀 | 表 |
|---|---|---|
| 系统 | sys_ | sys_config、sys_cron_job |
| 学员 | stu_ | stu_profile、stu_tag |
| 课程 | crs_ | crs_course、crs_lesson、crs_progress |
| 会议 | mtg_ | mtg_record、mtg_attendance |
| 作业任务 | asg_ | asg_assignment、asg_submission、asg_followup |
| 反馈 | fbk_ | fbk_survey_response、fbk_next_wish |
| 数据同步 | syn_ | syn_source、syn_log |

**基础字段（所有业务表必备）**：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER 主键 | 自增 |
| create_by | TEXT | 创建人，默认 'system' |
| create_time | TEXT | 创建时间 |
| update_by / update_time | TEXT | 更新人/时间 |
| is_deleted | TINYINT | 软删除标记（0/1） |

**约定**：JSON 数组/对象列以 TEXT 存储（写入 `JSON.stringify`，读取 `JSON.parse`，工具见 `server/src/db.js` 的 `J()`）。

## 3. 代码规范

- **模块划分**：`server/src` 按 路由(routes) / 数据(db) / 生成器(skill-b) / 契约(contracts) 划分；前端按 pages / components 划分。
- **零依赖原则**：服务端不引入 npm 依赖（node:http + node:sqlite），保证任何机器 `npm start` 即用。
- **幂等**：连接器重复运行不产生脏数据（推荐 clear-and-rebuild 或唯一键 upsert）。
- **密钥安全**：API Key / Token 一律环境变量，禁止硬编码、禁止入库。
- **中文**：面向教师的文案、注释、文档均使用简体中文；代码标识符使用英文。

## 4. 数据安全（硬性）

1. 仓库只含空框架 + Mock 数据（`npm run mock`）。
2. 真实学员数据一律在 `data/`（已 .gitignore），**绝不提交**。
3. API 只读；Skill B 只读；无任何匿名写接口。
