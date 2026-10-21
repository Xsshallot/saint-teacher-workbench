# SAINT · 超级教师工作台 · API 文档（v0.1）

Base URL：`http://localhost:8787`（可用 `PORT` 环境变量修改）
所有接口返回 JSON 信封：`{ "ok": true, "data": ... }` / `{ "ok": false, "error": "..." }`
**全部业务接口为 GET 只读**；唯一 POST 为手动触发同步。

| 方法 | 路径 | 说明 | 关键参数 |
|---|---|---|---|
| GET | `/api/health` | 健康检查 | — |
| GET | `/api/stats` | 总览指标：学员数、近30天活跃、待跟进名单、周度提交趋势、反馈主题聚类、最近/下节课 | — |
| GET | `/api/students` | 学员列表（按活跃度排序） | `q` 昵称/姓名关键词；`class_name` 班级 |
| GET | `/api/students/:id` | 学员 360° 详情：档案 + 提交 + 卡点 + 愿望 + 时间线 | — |
| GET | `/api/courses` | 课程列表（含课次数） | — |
| GET | `/api/lessons` | 课次列表（日期/主题/会议号/小结） | `course_id` |
| GET | `/api/meetings` | 会议记录（含纪要摘要，按时间倒序） | — |
| GET | `/api/assignments` | 作业列表（含提交/迟交统计） | — |
| GET | `/api/submissions` | 提交明细 | `assignment_id`、`student_id`、`status` |
| GET | `/api/feedback` | 愿望墙：wishes 列表 + themes 聚类 | `theme` |
| GET | `/api/sync/status` | 数据源状态 + 同步任务 + 最近日志 | — |
| POST | `/api/sync/run` | 手动触发同步（body 可选 `{"job_key":"daily-import"}`） | — |
| GET | `/api/contract` | 数据契约（docs/contracts 汇总） | — |
| GET | `/api/skill-b` | 生成工作台专属 Skill 文档（text/markdown） | `base` 自定义 API 基地址 |

## 示例

```bash
curl http://localhost:8787/api/stats
curl "http://localhost:8787/api/students?q=%E4%B8%89%E4%B8%83"   # URL 编码中文
curl http://localhost:8787/api/students/3
curl -X POST http://localhost:8787/api/sync/run
```

## 错误码

- `404`：路由或资源不存在
- `500`：服务端异常（error 字段含堆栈信息）
