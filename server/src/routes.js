/**
 * SAINT REST API（只读为主 + 同步触发 + Skill B 生成）
 * 所有 /api/* 返回 JSON：{ ok, data } 或 { ok:false, error }
 */
import { all, get, run, J, insert, update } from './db.js';
import { generateSkillB } from './skill-b.js';

const ok = (data) => ({ ok: true, data });
const fail = (error) => ({ ok: false, error: String(error) });

const num = (v) => (v == null ? null : Number(v));
const day = (t) => (t || '').slice(0, 10);

// ---------- 指标卡 ----------
function stats() {
  const cutoff = get(`SELECT MAX(last_active) AS m FROM stu_profile`)?.m || '';
  const students = all(`SELECT id, last_active, activity_count, class_name FROM stu_profile WHERE is_deleted=0`);
  const active30 = students.filter((s) => s.last_active && cutoff && s.last_active >= addDays(cutoff, -30)).length;

  const assignments = all(`SELECT * FROM asg_assignment WHERE is_deleted=0 ORDER BY assigned_date`);
  const lastAsg = assignments[assignments.length - 1];
  let pendingFollow = [];
  if (lastAsg) {
    const submittedIds = new Set(
      all(`SELECT DISTINCT student_id FROM asg_submission WHERE assignment_id=? AND is_deleted=0`, lastAsg.id).map((r) => r.student_id)
    );
    pendingFollow = students
      .filter((s) => s.activity_count >= 2 && !submittedIds.has(s.id))
      .map((s) => ({ id: s.id, nickname: getNick(s.id) }));
  }

  const weekly = {};
  all(`SELECT submitted_at FROM asg_submission WHERE is_deleted=0 AND submitted_at IS NOT NULL`).forEach((r) => {
    const w = weekKey(r.submitted_at);
    weekly[w] = (weekly[w] || 0) + 1;
  });
  const weekly_activity = Object.entries(weekly)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-12)
    .map(([week, count]) => ({ week, count }));

  const themes = all(`
    SELECT theme, COUNT(*) AS n FROM fbk_next_wish WHERE is_deleted=0
    GROUP BY theme ORDER BY n DESC`);

  const lessons = all(`SELECT * FROM crs_lesson WHERE is_deleted=0 ORDER BY lesson_date`);
  const next_lesson = lessons.find((l) => l.lesson_date > (cutoff || '9999')) || null;
  const last_lesson = lessons[lessons.length - 1] || null;

  const meetings = get(`SELECT COUNT(*) AS n FROM mtg_record WHERE is_deleted=0`)?.n || 0;
  const wishes = get(`SELECT COUNT(*) AS n FROM fbk_next_wish WHERE is_deleted=0`)?.n || 0;

  return {
    student_count: students.length,
    active_30d: active30,
    data_cutoff: cutoff,
    assignment_count: assignments.length,
    pending_follow: pendingFollow,
    pending_follow_count: pendingFollow.length,
    meeting_count: meetings,
    wish_count: wishes,
    weekly_activity,
    feedback_themes: themes,
    next_lesson,
    last_lesson,
    classes: [...new Set(students.map((s) => s.class_name || '主线班'))],
  };
}
function getNick(id) {
  return get(`SELECT nickname FROM stu_profile WHERE id=?`, id)?.nickname || `#${id}`;
}
function addDays(t, d) {
  const dt = new Date(t);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 19).replace('T', ' ');
}
function weekKey(t) {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7; // 周一为一周开始
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

// ---------- 学员 ----------
function students({ q = '', class_name = '' } = {}) {
  let sql = `SELECT * FROM stu_profile WHERE is_deleted=0`;
  const args = [];
  if (q) { sql += ` AND (nickname LIKE ? OR real_name LIKE ?)`; args.push(`%${q}%`, `%${q}%`); }
  if (class_name) { sql += ` AND class_name=?`; args.push(class_name); }
  sql += ` ORDER BY activity_count DESC, last_active DESC`;
  return all(sql, ...args).map((s) => ({
    ...s,
    focus_areas: J(s.focus_areas),
    tags: J(s.tags),
  }));
}
function studentDetail(id) {
  const s = get(`SELECT * FROM stu_profile WHERE id=? AND is_deleted=0`, id);
  if (!s) return null;
  const submissions = all(`
    SELECT sub.*, a.title AS assignment_title, a.due_date
    FROM asg_submission sub JOIN asg_assignment a ON sub.assignment_id=a.id
    WHERE sub.student_id=? AND sub.is_deleted=0
    ORDER BY sub.submitted_at DESC`, id);
  const followups = all(`SELECT * FROM asg_followup WHERE student_id=? AND is_deleted=0 ORDER BY created_at DESC`, id);
  const wishes = all(`SELECT * FROM fbk_next_wish WHERE student_id=? AND is_deleted=0 ORDER BY created_at DESC`, id);
  const responses = all(`SELECT * FROM fbk_survey_response WHERE student_id=? AND is_deleted=0 ORDER BY answered_at DESC LIMIT 30`, id);
  const timeline = [
    ...submissions.map((x) => ({ type: 'submission', at: x.submitted_at, title: `提交「${x.assignment_title}」`, text: x.content_excerpt, status: x.status })),
    ...wishes.map((x) => ({ type: 'wish', at: x.created_at, title: '下节课愿望', text: x.wish_text, theme: x.theme })),
    ...followups.map((x) => ({ type: 'followup', at: x.created_at, title: '卡点/跟进', text: x.note })),
  ].sort((a, b) => ((a.at || '') < (b.at || '') ? 1 : -1));
  return {
    ...s,
    focus_areas: J(s.focus_areas),
    tags: J(s.tags),
    submissions,
    followups,
    wishes,
    responses,
    timeline,
  };
}

// ---------- 课程 / 会议 ----------
function courses() {
  return all(`SELECT * FROM crs_course WHERE is_deleted=0 ORDER BY start_date`).map((c) => ({
    ...c,
    lesson_count: get(`SELECT COUNT(*) AS n FROM crs_lesson WHERE course_id=? AND is_deleted=0`, c.id)?.n || 0,
    student_count: get(`SELECT COUNT(DISTINCT student_id) AS n FROM asg_submission WHERE is_deleted=0`)?.n || 0,
  }));
}
function lessons({ course_id } = {}) {
  const args = [];
  let sql = `SELECT l.*, c.name AS course_name FROM crs_lesson l JOIN crs_course c ON l.course_id=c.id WHERE l.is_deleted=0`;
  if (course_id) { sql += ` AND l.course_id=?`; args.push(course_id); }
  sql += ` ORDER BY l.lesson_date, l.order_no`;
  return all(sql, ...args).map((l) => ({ ...l, materials: J(l.materials) }));
}
function meetings() {
  return all(`
    SELECT m.*, l.title AS lesson_title
    FROM mtg_record m LEFT JOIN crs_lesson l ON m.lesson_id=l.id
    WHERE m.is_deleted=0 ORDER BY m.start_time DESC`);
}

// ---------- 作业 ----------
function assignments() {
  return all(`SELECT * FROM asg_assignment WHERE is_deleted=0 ORDER BY assigned_date`).map((a) => {
    const subs = all(`SELECT student_id, status FROM asg_submission WHERE assignment_id=? AND is_deleted=0`, a.id);
    return {
      ...a,
      submitted: subs.length,
      late: subs.filter((s) => s.status === '迟交').length,
      roster: get(`SELECT COUNT(*) AS n FROM stu_profile WHERE is_deleted=0`)?.n || 0,
    };
  });
}
function submissions({ assignment_id, student_id, status } = {}) {
  const args = [];
  let sql = `
    SELECT sub.*, p.nickname, p.real_name, a.title AS assignment_title
    FROM asg_submission sub
    JOIN stu_profile p ON sub.student_id=p.id
    JOIN asg_assignment a ON sub.assignment_id=a.id
    WHERE sub.is_deleted=0`;
  if (assignment_id) { sql += ` AND sub.assignment_id=?`; args.push(assignment_id); }
  if (student_id) { sql += ` AND sub.student_id=?`; args.push(student_id); }
  if (status) { sql += ` AND sub.status=?`; args.push(status); }
  sql += ` ORDER BY sub.submitted_at DESC`;
  return all(sql, ...args);
}

// ---------- 反馈墙 ----------
function feedback({ theme } = {}) {
  const args = [];
  let sql = `
    SELECT w.*, p.nickname FROM fbk_next_wish w
    JOIN stu_profile p ON w.student_id=p.id
    WHERE w.is_deleted=0`;
  if (theme) { sql += ` AND w.theme=?`; args.push(theme); }
  sql += ` ORDER BY w.created_at DESC`;
  const wishes = all(sql, ...args);
  const themes = all(`SELECT theme, COUNT(*) AS n FROM fbk_next_wish WHERE is_deleted=0 GROUP BY theme ORDER BY n DESC`);
  return { wishes, themes };
}

// ---------- 同步 ----------
function syncStatus() {
  const sources = all(`SELECT * FROM syn_source WHERE is_deleted=0 ORDER BY id`);
  const jobs = all(`SELECT * FROM sys_cron_job WHERE is_deleted=0 ORDER BY id`).map((j) => ({
    ...j,
    logs: all(`SELECT * FROM syn_log WHERE job_key=? ORDER BY id DESC LIMIT 5`, j.job_key),
  }));
  return { sources: sources.map((s) => ({ ...s, config: J(s.config, {}) })), jobs };
}
async function syncRun(jobKey = 'all') {
  const started = nowStr();
  const results = {};
  const jobs = [
    { key: 'daily-import', source: 'local-import', path: '../../connectors/local-import/import-training-camp.mjs', label: '本地导入' },
    { key: 'tencent-sync', source: 'tencent-import', path: '../../connectors/tencent-import/import-tencent.mjs', label: '腾讯连接器同步' },
  ].filter((j) => !jobKey || jobKey === 'all' || j.key === jobKey);

  for (const j of jobs) {
    const logId = insert('syn_log', { job_key: j.key, source_key: j.source, started_at: started, status: 'running' });
    try {
      const { runImport } = await import(j.path);
      const r = await runImport();
      run(`UPDATE syn_log SET finished_at=?, status='success', added=?, updated=?, message=? WHERE id=?`,
        nowStr(), r.added ?? 0, r.updated ?? 0, `${j.label}完成：${JSON.stringify(r)}`, logId);
      run(`UPDATE sys_cron_job SET last_run_time=?, last_status='success' WHERE job_key=?`, nowStr(), j.key);
      results[j.key] = r;
    } catch (e) {
      run(`UPDATE syn_log SET finished_at=?, status='failed', message=? WHERE id=?`, nowStr(), String(e), logId);
      run(`UPDATE sys_cron_job SET last_run_time=?, last_status='failed' WHERE job_key=?`, nowStr(), j.key);
      results[j.key] = { error: String(e) };
    }
  }
  return ok(results);
}
function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

// ---------- 路由表 ----------
export async function handleApi(req, res, pathname, query) {
  const send = (code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  };
  const sendMd = (body) => {
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
    res.end(body);
  };
  const id = Number(pathname.split('/')[3]);

  try {
    if (pathname === '/api/health') return send(200, ok({ status: 'up', time: nowStr() }));
    if (pathname === '/api/stats') return send(200, ok(stats()));
    if (pathname.startsWith('/api/students/')) {
      const d = studentDetail(id);
      return d ? send(200, ok(d)) : send(404, fail('student not found'));
    }
    if (pathname === '/api/students') return send(200, ok(students(query)));
    if (pathname === '/api/courses') return send(200, ok(courses()));
    if (pathname === '/api/lessons') return send(200, ok(lessons(query)));
    if (pathname === '/api/meetings') return send(200, ok(meetings()));
    if (pathname === '/api/assignments') return send(200, ok(assignments()));
    if (pathname === '/api/submissions') return send(200, ok(submissions(query)));
    if (pathname === '/api/feedback') return send(200, ok(feedback(query)));
    if (pathname === '/api/sync/status') return send(200, ok(syncStatus()));
    if (pathname === '/api/sync/run' && req.method === 'POST') {
      let body = '';
      for await (const c of req) body += c;
      const j = body ? JSON.parse(body) : {};
      return send(200, await syncRun(j.job_key));
    }
    if (pathname === '/api/contract') {
      const { contracts } = await import('./contracts.js');
      return send(200, ok(contracts()));
    }
    if (pathname === '/api/skill-b') {
      const base = query.base || `http://localhost:${PORT}`;
      return sendMd(generateSkillB(base));
    }
    return send(404, fail(`no route: ${req.method} ${pathname}`));
  } catch (e) {
    return send(500, fail(e));
  }
}
export const PORT = Number(process.env.PORT || 8787);
