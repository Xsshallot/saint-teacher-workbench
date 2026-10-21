/**
 * Skill B 生成器：依据本工作台真实 API 与数据契约，
 * 生成「工作台专属 Skill」文档（给任何 AI 智能体挂载使用）。
 */
export function generateSkillB(baseUrl) {
  const endpoints = [
    { m: 'GET', p: '/api/stats', d: '总览指标（学员数、活跃度、作业统计、下节课、反馈主题聚类、周度活跃曲线）' },
    { m: 'GET', p: '/api/students?q=&class_name=', d: '学员列表，支持昵称/姓名关键词 q 与班级过滤' },
    { m: 'GET', p: '/api/students/:id', d: '学员 360° 详情：档案、提交、卡点、愿望、完整时间线' },
    { m: 'GET', p: '/api/courses', d: '课程列表（含课次数）' },
    { m: 'GET', p: '/api/lessons?course_id=', d: '课次列表（日期、主题、会议号、一课小结）' },
    { m: 'GET', p: '/api/meetings', d: '会议记录列表（含纪要摘要）' },
    { m: 'GET', p: '/api/assignments', d: '作业/任务列表（含提交率统计）' },
    { m: 'GET', p: '/api/submissions?assignment_id=&student_id=&status=', d: '作业提交明细（状态、摘要、附件数）' },
    { m: 'GET', p: '/api/feedback?theme=', d: '反馈墙：下节课愿望 + 主题聚类' },
    { m: 'GET', p: '/api/documents?doc_type=', d: '腾讯文档资料列表（最近同步的文档/表格/收集表）' },
    { m: 'GET', p: '/api/sync/status', d: '数据源与同步任务状态、最近同步日志' },
    { m: 'GET', p: '/api/contract', d: '数据契约（各数据域字段定义）' },
  ];
  const epTable = endpoints
    .map((e) => `| \`${e.m} ${e.p}\` | ${e.d} |`)
    .join('\n');

  return `---
name: saint-workbench
description: 超级教师工作台（SAINT）查询技能。当教师询问"最近学员怎么样""某个同学的状态""下节课该备什么""作业交得如何""上节课讲了什么"等与学员、课程、作业、反馈、会议相关的问题时使用。通过只读 API 查询工作台真实数据并给出基于数据的分析。
---

# SAINT 超级教师工作台 · 专属查询技能

这个工作台是一位教师的教学数据中枢，数据由腾讯问卷 / 腾讯文档 / 腾讯会议（辅以飞书）每日自动同步而来。

## 工作台访问方式

- **API 基地址**：\`${baseUrl}\`
- 所有接口均为 **GET 只读**，返回 JSON 信封：\`{ "ok": true, "data": ... }\`；失败时 \`{ "ok": false, "error": "..." }\`

## 数据接口清单

| 接口 | 说明 |
|---|---|
${epTable}

## 数据域速览（详见 /api/contract）

- **学员 stu**：昵称、姓名、班级、主攻方向、标签、背景、MBTI、每日投入、长期规划、活跃度
- **课程 crs**：课程 → 课次（日期/主题/会议号/小结）
- **会议 mtg**：会议记录（主题/时间/时长/纪要摘要）
- **作业 asg**：作业 → 提交（状态/摘要/附件数）→ 跟进（卡点记录）
- **反馈 fbk**：下节课愿望（含主题聚类）、问卷原始回答

## 典型问答示例

**Q：最近学员们整体怎么样？**
1. 调用 \`${baseUrl}/api/stats\`：查看 student_count、active_30d、weekly_activity、feedback_themes
2. 若需细节，再调 \`${baseUrl}/api/students\` 取活跃榜
3. 用自然语言汇总："最近 30 天活跃 X 人，作业提交呈…趋势，大家最想学的是…"

**Q：XX 同学最近状态怎么样？**
1. 调用 \`${baseUrl}/api/students?q=XX\` 拿到 id
2. 调用 \`${baseUrl}/api/students/{id}\` 查看 timeline（提交、卡点、愿望）
3. 汇总其活跃度、作业完成情况、最近的困难与诉求

**Q：下节课该准备什么？**
1. 调用 \`${baseUrl}/api/feedback\` 查看愿望墙与主题聚类
2. 调用 \`${baseUrl}/api/lessons\` 查看课程进度（最近一课讲了什么）
3. 结合两者给出备课建议：优先覆盖呼声最高的主题，并衔接上节课内容

**Q：谁需要重点跟进？**
1. 调用 \`${baseUrl}/api/stats\` 的 pending_follow（活跃但最近一次作业未交的学员）
2. 调用 \`${baseUrl}/api/submissions?status=迟交\` 查看迟交记录
3. 给出跟进名单与建议话术

## 安全边界（硬性）

1. **只读**：本技能只调用 GET 接口，不执行任何写操作（无写接口）。
2. **隐私**：学员数据仅用于该教师本人的教学跟进；回复中不要向无关方披露学员个人信息。
3. **事实**：所有结论必须基于接口返回的真实数据，不臆造；数据为空时如实说明。
4. **边界**：只回答与教学工作台数据相关的问题，其他请求引导回工作台场景。
`;
}
