# SAINT 助教 · 专家包

把你的 SAINT 工作台专属 Skill（Skill B）发布成 WorkBuddy 专属助教专家的**现成模板**。

## 使用方法

### 方式一：让 WorkBuddy 自动转化（推荐）

在 WorkBuddy 对话中说：

> 帮我把这个文件夹转化成我的专属专家：D:\...\saint-teacher-workbench\experts\saint-assistant
> （或：把 skills/skill-b/generated/SKILL.md 转化成专属助教专家）

WorkBuddy 会自动完成初始化、内容生成、头像、校验、注册全流程。

### 方式二：手动安装

1. 把整个 `saint-assistant/` 目录复制到 WorkBuddy 专家目录：
   ```
   Windows: %USERPROFILE%\.workbuddy\plugins\marketplaces\my-experts\plugins\saint-assistant\
   macOS/Linux: ~/.workbuddy/plugins/marketplaces/my-experts/plugins/saint-assistant/
   ```
2. **替换 API 地址**：编辑 `agents/saint-assistant.md`，把 `{BASE}` 换成你的工作台地址（默认 `http://localhost:8787`）
3. **放置头像**：把一张 PNG/JPG（512×512，≤500KB，可直接用仓库 `docs/assets/logo.jpg`）放到 `avatars/expert.jpg`
4. 重启 WorkBuddy → 左侧栏「专家」→「我的专家」→ 出现 **SAINT 助教**

## 验收

对专家说「最近学员们整体怎么样？」——能基于你工作台的真实数据回答即成功。

## 文件结构

```
saint-assistant/
├─ .codebuddy-plugin/plugin.json   # 专家元信息（名称/分类/标签/推荐提示词）
├─ agents/saint-assistant.md       # 助教 Agent 定义（API 清单/问答/边界）→ 安装前替换 {BASE}
└─ avatars/expert.jpg              # 头像（自行放置）
```

> 分类：09-OperationsHR（运营人力·培训）｜标签：学员跟进 / 备课辅助 / 教学数据分析
