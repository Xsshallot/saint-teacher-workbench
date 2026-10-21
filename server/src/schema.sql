-- ============================================================
-- SAINT · 超级教师工作台 数据库 Schema v0.1
-- 规范：表命名 [模块缩写]_[业务名]；所有业务表必备基础字段
--   id / create_by / create_time / update_by / update_time / is_deleted
-- ============================================================

-- ---------- 系统 sys_ ----------
CREATE TABLE IF NOT EXISTS sys_config (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key    TEXT NOT NULL UNIQUE,
  config_value  TEXT,
  remark        TEXT,
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sys_cron_job (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  job_key       TEXT NOT NULL UNIQUE,
  job_name      TEXT NOT NULL,
  cron_expr     TEXT,
  enabled       INTEGER DEFAULT 1,
  last_run_time TEXT,
  last_status   TEXT,
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

-- ---------- 学员 stu_ ----------
CREATE TABLE IF NOT EXISTS stu_profile (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname      TEXT NOT NULL,                -- 群昵称（主标识）
  real_name     TEXT,                         -- 提交人真实姓名
  class_name    TEXT DEFAULT '主线班',         -- 班级（v1 单教师多班级）
  avatar_hue    INTEGER DEFAULT 210,           -- 头像色相
  focus_areas   TEXT,                          -- 主攻方向 JSON 数组
  tags          TEXT,                          -- 标签 JSON 数组
  background    TEXT,                          -- 当前身份/在做什么
  mbti          TEXT,
  daily_hours   TEXT,                          -- 每日可投入时间
  long_term_goal TEXT,                         -- 长期规划
  first_seen    TEXT,                          -- 首次出现时间
  last_active   TEXT,                          -- 最近活跃时间
  activity_count INTEGER DEFAULT 0,            -- 累计提交/活跃次数
  source        TEXT DEFAULT 'local-import',
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_stu_nickname ON stu_profile(nickname);

CREATE TABLE IF NOT EXISTS stu_tag (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id    INTEGER NOT NULL,
  tag           TEXT NOT NULL,
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

-- ---------- 课程 crs_ ----------
CREATE TABLE IF NOT EXISTS crs_course (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  start_date    TEXT,
  status        TEXT DEFAULT '进行中',         -- 未开始/进行中/已结束
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS crs_lesson (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id     INTEGER NOT NULL,
  title         TEXT NOT NULL,
  lesson_date   TEXT,                          -- YYYY-MM-DD
  order_no      INTEGER,
  meeting_code  TEXT,                          -- 关联腾讯会议号
  summary       TEXT,                          -- 一课小结（来自会议纪要）
  materials     TEXT,                          -- 材料链接 JSON 数组
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS crs_progress (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id     INTEGER NOT NULL,
  lesson_id     INTEGER NOT NULL,
  student_id    INTEGER NOT NULL,
  status        TEXT,                          -- 已到/缺席/回看
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

-- ---------- 会议 mtg_ ----------
CREATE TABLE IF NOT EXISTS mtg_record (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_code  TEXT,
  subject       TEXT NOT NULL,
  start_time    TEXT,
  duration_min  INTEGER,
  has_minutes   INTEGER DEFAULT 0,             -- 是否已取到智能纪要
  summary       TEXT,                          -- 纪要摘要
  lesson_id     INTEGER,                       -- 关联课次
  source        TEXT DEFAULT 'local-import',
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mtg_attendance (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id    INTEGER NOT NULL,
  student_id    INTEGER NOT NULL,
  status        TEXT,
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

-- ---------- 作业/任务 asg_ ----------
CREATE TABLE IF NOT EXISTS asg_assignment (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id     INTEGER NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  assigned_date TEXT,
  due_date      TEXT,
  type          TEXT DEFAULT '问卷提交',        -- 问卷提交/Skill 开发/案例提交
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS asg_submission (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  student_id    INTEGER NOT NULL,
  status        TEXT DEFAULT '已交',            -- 已交/迟交/未交
  submitted_at  TEXT,
  content_excerpt TEXT,                         -- 内容摘要（≤300字）
  attachment_count INTEGER DEFAULT 0,
  skill_file_count INTEGER DEFAULT 0,
  raw           TEXT,                           -- 原始记录 JSON（排障用）
  source        TEXT DEFAULT 'local-import',
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_asg_sub_assignment ON asg_submission(assignment_id);
CREATE INDEX IF NOT EXISTS idx_asg_sub_student ON asg_submission(student_id);

CREATE TABLE IF NOT EXISTS asg_followup (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER,
  student_id    INTEGER NOT NULL,
  assignment_id INTEGER,
  note          TEXT,                          -- 卡点/问题/跟进记录
  created_at    TEXT,
  source        TEXT DEFAULT 'local-import',
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

-- ---------- 反馈 fbk_ ----------
CREATE TABLE IF NOT EXISTS fbk_survey_response (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id    INTEGER NOT NULL,
  survey_name   TEXT,
  question      TEXT,
  answer        TEXT,
  answered_at   TEXT,
  source        TEXT DEFAULT 'local-import',
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fbk_next_wish (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id    INTEGER NOT NULL,
  course_id     INTEGER,
  wish_text     TEXT NOT NULL,
  theme         TEXT DEFAULT '其他',            -- 聚类主题
  created_at    TEXT,
  source        TEXT DEFAULT 'local-import',
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

-- ---------- 数据同步 syn_ ----------
CREATE TABLE IF NOT EXISTS syn_source (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key    TEXT NOT NULL UNIQUE,          -- local-import / tencent-survey / ...
  name          TEXT NOT NULL,
  type          TEXT,                          -- 问卷/文档/会议/本地导入
  status        TEXT DEFAULT '未配置',         -- 已连接/未配置/异常
  config        TEXT,                          -- JSON 配置
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS syn_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  job_key       TEXT NOT NULL,
  source_key    TEXT,
  started_at    TEXT,
  finished_at   TEXT,
  status        TEXT,                          -- success/failed/running
  added         INTEGER DEFAULT 0,
  updated       INTEGER DEFAULT 0,
  message       TEXT,
  create_by     TEXT DEFAULT 'system',
  create_time   TEXT DEFAULT (datetime('now','localtime')),
  update_by     TEXT,
  update_time   TEXT,
  is_deleted    INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_syn_log_job ON syn_log(job_key);
