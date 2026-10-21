/**
 * SAINT 连接器 · local-import
 * 把 data/raw/ 下已采集的训练营数据（飞书问卷 NDJSON + 腾讯会议纪要 JSON）导入 SQLite。
 *
 * 特性：
 *  - 幂等：清空重建（clear-and-rebuild），重复运行不产生脏数据
 *  - 导出 runImport() 供服务端 /api/sync/run 调用
 *  - 直接运行：node connectors/local-import/import-training-camp.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { all, get, run, insert, ROOT } from '../../server/src/db.js';

const RAW = path.join(ROOT, 'data', 'raw');
const __isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

// ---------------- 工具 ----------------
const readNdjson = (f) =>
  fs.readFileSync(path.join(RAW, f), 'utf8')
    .split(/\r?\n/).filter((l) => l.trim())
    .map((l) => JSON.parse(l));

const readMinutes = (f) => {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));
    return j?.data?.meeting_minute?.minute || null;
  } catch { return null; }
};

const summaryOf = (minute) => {
  if (!minute) return null;
  const m = minute.match(/会议摘要：(.+?)(?:\n|$)/s);
  return m ? m[1].trim() : minute.slice(0, 200);
};

const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const norm = (s) => clean(s).toLowerCase().replace(/[\s\u3000]/g, '');

const firstText = (r, keys) => {
  for (const k of keys) {
    const v = clean(r[k]);
    if (v && v !== '无' && v !== '暂无') return v;
  }
  return '';
};
const attNames = (r, key) => Array.isArray(r[key]) ? r[key].map((x) => x?.name || '') : [];

// 愿望主题聚类
function themeOf(text) {
  const t = text || '';
  if (/定时任务|自动化|自主|agent.*自主|主动/.test(t)) return '自动化与定时任务';
  if (/黑客松|路演|比赛|完赛|颁奖|组队/.test(t)) return '黑客松实战';
  if (/FDE|交付|报价|接单|企业|客户|作品集|商业化|商单|求职|简历/.test(t)) return 'FDE 与商业化';
  if (/skill.*迭代|自迭代|自进化|越用越好|经验沉淀/.test(t)) return 'Skill 进化';
  if (/prompt|context|loop|graph|engineering|工程/.test(t.toLowerCase())) return '工程方法论';
  if (/视频|剪辑|生图|漫剧|短剧|图像|画风|出图/.test(t)) return '视频与创作';
  if (/信息渠道|资讯|信息差|前沿|最新/.test(t)) return '信息渠道';
  if (/金融|炒股|投资|量化/.test(t)) return '金融应用';
  if (/沟通|表达|提问|问问题/.test(t)) return 'AI 沟通';
  if (/学习|入门|基础|概念|教学/.test(t)) return '学习与基础';
  return '其他';
}

// 主攻方向识别
function focusAreasOf(texts) {
  const t = texts.join(' ');
  const out = [];
  if (/视频|剪辑|生图|漫剧|短剧|出图|画风|口播/.test(t)) out.push('AI 视频/图像');
  if (/文案|小红书|公众号|写作|小说|朋友圈|内容创作|观点树/.test(t)) out.push('内容创作');
  if (/金融|炒股|投资/.test(t)) out.push('金融');
  if (/FDE|交付|报价|接单|客户|企业|巡检|商单/.test(t)) out.push('FDE 交付');
  if (/App|应用|网站|工具|工作台|平台|系统/.test(t)) out.push('应用开发');
  if (/知识库|学习|wiki|笔记|复习/.test(t)) out.push('学习与知识');
  return out.length ? out : ['探索中'];
}

// ---------------- 数据定义 ----------------
// 问卷文件 → 作业/调研 映射
const SURVEY_DEFS = [
  { file: 'survey_6.ndjson', key: 'w1', date: '2026-07-22' },
  { file: 'survey_5.ndjson', key: 'blocker', date: '2026-07-26' },
  { file: 'survey_4.ndjson', key: 'claw', date: '2026-07-30' },
  { file: 'survey_3.ndjson', key: 'skill', date: '2026-08-09' },
  { file: 'survey_2.ndjson', key: 'onboard', date: '2026-08-15' },
  { file: 'survey_1.ndjson', key: 'case8', date: '2026-08-30' },
  { file: 'survey_records.ndjson', key: 'case9', date: '2026-09-28' },
];

const MINUTE_FILES = {
  '437884051': ['0814训练营.json'],
  '553569571': ['0814AI大学堂.json'],
  '797769728': ['0823会议A_797769728.json'],
  '512491524': ['0823会议B_512491524.json'],
  '508460080': ['0823会议C_508460080.json'],
  '203162061': ['0905文件1_203162061.json', '0905文件2_203162061.json'],
  '369822218': ['0614黑客松晚间答疑.json'],
};

// 课次定义（course sessions）
const LESSON_DEFS = [
  { date: '2026-06-04', title: 'Fun Skills 获奖代表搭建 Skill 经验分享', codes: ['244756300'], summary: '智能体技能大赛获奖代表经验分享（会议录制需申请权限，纪要待补充）。' },
  { date: '2026-06-12', title: 'SoloVerse.Agent 黑客松 · 赛前动员暨答疑', codes: ['146590084'], summary: '黑客松赛前动员：赛制说明、组队、开发环境准备（该场未生成智能纪要）。' },
  { date: '2026-06-13', title: '黑客松 48 小时冲刺 · 日间答疑（早/午）', codes: ['63934468791', '38759726096', '142627972', '119417104'], summary: '48 小时黑客松进行中的多场次答疑。' },
  { date: '2026-06-14', title: '黑客松 48 小时冲刺 · 终期答疑', codes: ['711622007', '369822218'], summary: null /* 从纪要取 */ },
  { date: '2026-07-05', title: '黑客松线上路演', codes: ['406367449'], summary: '黑客松作品线上路演展示。' },
  { date: '2026-07-22', title: '任务制启动 · 本周自选任务', codes: [], summary: '训练营转入任务制：学员自选本周任务并提交（33 人提交），主流方向为 AI 视频工作流与文案自动化。' },
  { date: '2026-07-25', title: '智极松大赛 · 7 天线上训练营第一课', codes: ['592467127'], summary: '智极松大赛训练营第一课。' },
  { date: '2026-07-31', title: 'FDE 团队碰头会', codes: ['174890628'], summary: 'FDE 方向团队碰头（32 分钟，录制需申请权限）。' },
  { date: '2026-08-14', title: 'Skill 训练营线上交流会 · 讯飞 AI 开发大赛宣讲', codes: ['437884051'], summary: null },
  { date: '2026-08-14', title: 'AI 大学堂 Skill 专题分享 · Skill 开发标准与金融小龙虾', codes: ['553569571'], summary: null },
  { date: '2026-08-15', title: 'AI 前沿营开营 · 入营需求调研', codes: [], summary: '开营问卷（36 人）：FDE 能力、自进化小龙虾、前沿信息差是三大诉求。' },
  { date: '2026-08-23', title: 'Skill 开发复盘与黑客松动员周会', codes: ['797769728'], summary: null },
  { date: '2026-08-23', title: '金融小龙虾系统架构与投资策略分享会', codes: ['512491524'], summary: null },
  { date: '2026-08-23', title: 'AI Agent 自进化机制与心态管理培训', codes: ['508460080'], summary: null },
  { date: '2026-09-05', title: 'FDE 项目交付与报价实战（一）：交付案例拆解', codes: ['203162061'], summary: null },
  { date: '2026-09-05', title: 'FDE 项目交付与报价实战（二）：能力模型构建', codes: ['203162061'], summary: null },
  { date: '2026-09-16', title: '霸榜网易帝王蟹！超级个体的 AI Skill 进化论', codes: ['763510329'], summary: '公开分享：超级个体如何用 Skill 体系持续进化。' },
  { date: '2026-09-28', title: '落地案例复盘会（9 月）', codes: ['878751350'], summary: '落地案例提交（19 份）复盘：企业级项目、开源 App 系列、自动化工作流等。' },
];

// 作业定义（survey key → assignment）
const ASSIGNMENT_DEFS = {
  w1: { title: '第1周 · 自选任务', description: '学员自选本周要落地的任务/项目并说明选择原因', assigned_date: '2026-07-22', due_date: '2026-07-26', type: '任务提交' },
  skill: { title: 'Skill 开发作业', description: '完成一个完整 Skill：打包 zip + 简介 + 遇到的问题', assigned_date: '2026-08-02', due_date: '2026-08-09', type: 'Skill 开发' },
  onboard: { title: '入营问卷 · AI 前沿营需求调研', description: '填写入营需求：背景、时间投入、长期规划、MBTI、能力画像', assigned_date: '2026-08-15', due_date: '2026-08-17', type: '问卷' },
  case8: { title: '落地案例提交（8 月）', description: '提交落地案例（软件/Skill/硬件/自动化流程），附演示材料', assigned_date: '2026-08-23', due_date: '2026-08-30', type: '案例提交' },
  case9: { title: '落地案例提交（9 月）', description: '提交落地案例（软件/Skill/硬件/自动化流程），附演示材料', assigned_date: '2026-09-21', due_date: '2026-09-28', type: '案例提交' },
};

// 与训练营相关的会议（从 meetings_all.txt 过滤）
const CAMP_MEETING_RE = /SoloVerse|黑客松|Skill训练营|AI大学堂|智极松|Fun Skills|帝王蟹|FDE/i;
const CAMP_MEETING_CODES = new Set(['412527057', '797769728', '512491524', '508460080', '203162061', '878751350']);

// ---------------- 主流程 ----------------
export async function runImport() {
  const t0 = Date.now();

  // 1) 清空重建（幂等）
  for (const t of ['stu_tag', 'stu_profile', 'crs_progress', 'crs_lesson', 'crs_course', 'mtg_attendance', 'mtg_record',
    'asg_followup', 'asg_submission', 'asg_assignment', 'fbk_survey_response', 'fbk_next_wish']) {
    run(`DELETE FROM ${t}`);
    run(`DELETE FROM sqlite_sequence WHERE name=?`, t);
  }

  // 2) 课程 + 课次
  const courseId = insert('crs_course', {
    code: 'AI-CAMP-2026', name: 'AI 前沿营 · 小龙虾训练营',
    description: '围绕小龙虾（OpenClaw/OpenCloud）AI Agent 的训练营：Skill 开发、黑客松实战、金融小龙虾、FDE 交付与报价',
    start_date: '2026-06-04', status: '进行中',
  });
  const lessonIdByCode = new Map();
  LESSON_DEFS.forEach((l, i) => {
    // 优先取纪要摘要
    let summary = l.summary;
    for (const c of l.codes) {
      for (const f of MINUTE_FILES[c] || []) {
        const s = summaryOf(readMinutes(f));
        if (s) { summary = s; break; }
      }
      if (summary && !l.summary) break;
    }
    const id = insert('crs_lesson', {
      course_id: courseId, title: l.title, lesson_date: l.date, order_no: i + 1,
      summary: summary || '', materials: l.codes.map((c) => ({ type: 'meeting', code: c })),
    });
    l.codes.forEach((c) => lessonIdByCode.set(c, id));
  });

  // 3) 会议记录（训练营相关）
  let meetingCount = 0;
  const lines = fs.readFileSync(path.join(RAW, 'meetings_all.txt'), 'utf8').split(/\r?\n/).filter((l) => l.includes('|'));
  for (const line of lines) {
    const [start, subject, code, rec, perm] = line.split('|').map((x) => clean(x));
    const isCamp = CAMP_MEETING_RE.test(subject) || CAMP_MEETING_CODES.has(code);
    if (!isCamp) continue;
    const minutes = (MINUTE_FILES[code] || []).map((f) => readMinutes(f)).filter(Boolean);
    insert('mtg_record', {
      meeting_code: code, subject, start_time: (start || '').slice(0, 19),
      duration_min: null, has_minutes: minutes.length ? 1 : 0,
      summary: minutes.length ? summaryOf(minutes[0]) : null,
      lesson_id: lessonIdByCode.get(code) || null,
    });
    meetingCount++;
  }

  // 4) 问卷 → 学员 / 作业 / 提交 / 反馈
  const students = new Map(); // normKey → profile row + texts
  const touch = (r) => {
    const nick = clean(r['群昵称']);
    const key = norm(nick);
    if (!key) return null;
    if (!students.has(key)) {
      students.set(key, {
        nickname: nick || `学员${students.size + 1}`,
        real_name: '', background: '', mbti: '', daily_hours: '', long_term_goal: '',
        first_seen: null, last_active: null, activity_count: 0, texts: [], tags: new Set(),
      });
    }
    const s = students.get(key);
    const at = clean(r['提交时间']).slice(0, 19);
    if (at) {
      if (!s.first_seen || at < s.first_seen) s.first_seen = at;
      if (!s.last_active || at > s.last_active) s.last_active = at;
    }
    s.activity_count++;
    const who = Array.isArray(r['提交人']) ? clean(r['提交人'][0]?.name) : '';
    if (who && who !== s.real_name && !/^(飞书用户|用户)\d/.test(who)) s.real_name = who;
    return s;
  };

  const submissions = []; // {surveyKey, student, row}
  for (const def of SURVEY_DEFS) {
    const rows = readNdjson(def.file);
    for (const r of rows) {
      const s = touch(r);
      if (!s) continue;
      submissions.push({ key: def.key, date: def.date, s, r });
    }
  }

  // 作业
  const asgIds = {};
  for (const [k, a] of Object.entries(ASSIGNMENT_DEFS)) {
    asgIds[k] = insert('asg_assignment', { course_id: courseId, ...a });
  }

  let subCount = 0, wishCount = 0, respCount = 0, followupCount = 0;

  for (const { key, date, s, r } of submissions) {
    const at = clean(r['提交时间']).slice(0, 19) || date;

    // ---- 学员画像增强 ----
    const texts = [];
    for (const v of Object.values(r)) if (typeof v === 'string' && v.trim()) texts.push(v.trim());
    s.texts.push(...texts.filter((t) => t.length > 4));

    if (key === 'onboard') {
      s.background = firstText(r, ['现在在做什么事情（实习、工作、上学等等）']) || s.background;
      s.daily_hours = firstText(r, ['每天能投入课程和任务的时间（高强度使用学习AI时间）']) || s.daily_hours;
      s.mbti = firstText(r, ['自己的MBTI']) || s.mbti;
      s.long_term_goal = firstText(r, ['自己未来的长期规划（AI方面）']) || s.long_term_goal;
      const cap = Array.isArray(r['自己的能力画像（可多选）']) ? r['自己的能力画像（可多选）'].map((x) => x?.name || x) : [];
      cap.filter(Boolean).forEach((c) => s.tags.add(c));
      // 入营需求 → 愿望
      const need = firstText(r, ['对于AI前沿营有什么需求（想通过这个营得到什么？）']);
      if (need) {
        insert('fbk_next_wish', { student_id: 0, course_id: courseId, wish_text: need.slice(0, 500), theme: themeOf(need), created_at: at, source: '入营问卷' });
        wishCount++;
      }
      // 其他问答 → 原始回答
      for (const q of ['最近遇到的问题，在做任务的途中（不止局限于AI）', '意向组长']) {
        const a = clean(r[q]);
        if (a) { insert('fbk_survey_response', { student_id: 0, survey_name: '入营问卷', question: q, answer: a.slice(0, 800), answered_at: at }); respCount++; }
      }
    }

    if (key === 'claw') {
      const q1 = '如果只能学会一样 AI 技能，你最想要哪个？为什么？';
      const q2 = '你希望课程接下来怎么调整？';
      for (const q of [q1, q2]) {
        const a = firstText(r, [q]);
        if (a) {
          insert('fbk_next_wish', { student_id: 0, course_id: courseId, wish_text: a.slice(0, 500), theme: themeOf(a), created_at: at, source: '小龙虾使用调研' });
          wishCount++;
        }
      }
      for (const q of ['你目前用小龙虾（OpenClaw）到了哪个阶段？', '你在小龙虾上累计投入了大约多少时间？', '你大概从什么时候开始没那么积极了？（填空，一句话就行）', '你有没有用小龙虾解决过一个真实的问题？ （学习、生活、工作里确实帮你干了活的都算）', '说句实在的，你学 AI 最大的动力是什么？']) {
        const a = clean(r[q]);
        if (a) { insert('fbk_survey_response', { student_id: 0, survey_name: '小龙虾使用调研', question: q, answer: a.slice(0, 800), answered_at: at }); respCount++; }
      }
    }

    // ---- 作业提交 ----
    if (ASSIGNMENT_DEFS[key]) {
      let excerpt = '', skillCount = 0, attCount = 0;
      if (key === 'w1') {
        const task = firstText(r, ['本周任务']);
        const why = firstText(r, ['为什么选择这个任务']);
        excerpt = [task ? `任务：${task}` : '', why ? `原因：${why}` : ''].filter(Boolean).join('\n');
      } else if (key === 'skill') {
        excerpt = firstText(r, ['本周完成的skill的简介']);
        skillCount = attNames(r, '上传你的skil打包成的zip包').filter((n) => /\.(zip|gz|skill)$/i.test(n)).length;
      } else if (key === 'onboard') {
        excerpt = s.background ? `背景：${s.background}` : '';
      } else if (key === 'case8' || key === 'case9') {
        excerpt = firstText(r, ['落地案例描述（软件、Skill、硬件、自动化流程等等）（可以写多个，分点写即可）']);
        skillCount = attNames(r, 'Skill zip包上传（如果你的落地案例是skill，可上传多个）').filter((n) => /\.(zip|gz|skill|md)$/i.test(n)).length;
        attCount = attNames(r, '案例视频演示（可上传多个）').length;
      }
      const due = ASSIGNMENT_DEFS[key].due_date;
      const status = at.slice(0, 10) > due ? '迟交' : '已交';
      insert('asg_submission', {
        assignment_id: asgIds[key], student_id: 0, status, submitted_at: at,
        content_excerpt: excerpt.slice(0, 300), attachment_count: attCount, skill_file_count: skillCount,
        raw: JSON.stringify({ nickname: s.nickname }),
      });
    }

    // ---- 卡点问卷（7/26）→ 跟进记录（挂在第1周任务上） ----
    if (key === 'blocker') {
      const note = firstText(r, ['完成任务的过程遇到的卡点（尽可能详细的描述）']);
      if (note) { insert('asg_followup', { submission_id: null, student_id: 0, assignment_id: asgIds.w1, note: `卡点：${note.slice(0, 400)}`, created_at: at }); followupCount++; }
      const reply = clean(r['回复']);
      if (reply) { insert('asg_followup', { submission_id: null, student_id: 0, assignment_id: asgIds.w1, note: `导师回复：${reply.slice(0, 400)}`, created_at: at }); followupCount++; }
    }
    // ---- Skill 作业的问题 → 跟进 ----
    if (key === 'skill') {
      const q = firstText(r, ['本次任务遇到了什么问题（后期会根据反馈去优化课程）']);
      if (q) { insert('asg_followup', { submission_id: null, student_id: 0, assignment_id: asgIds.skill, note: `问题：${q.slice(0, 400)}`, created_at: at }); followupCount++; }
    }

    // ---- 下节课愿望 ----
    if (key === 'case8' || key === 'case9') {
      const w = firstText(r, ['希望下次讲课的内容']);
      if (w) {
        insert('fbk_next_wish', { student_id: 0, course_id: courseId, wish_text: w.slice(0, 500), theme: themeOf(w), created_at: at, source: '落地案例问卷' });
        wishCount++;
      }
    }
  }

  // 5) 学员入库（回填 student_id）
  const stuIdByKey = new Map();
  let i = 0;
  for (const [, s] of students) {
    i++;
    const focus = focusAreasOf(s.texts);
    const tags = [...s.tags];
    if (s.activity_count >= 5) tags.push('高活跃');
    if (s.texts.some((t) => /github\.com/i.test(t))) tags.push('开源产出');
    const id = insert('stu_profile', {
      nickname: s.nickname, real_name: s.real_name, class_name: 'AI 前沿营',
      avatar_hue: (i * 47) % 360, focus_areas: focus, tags: [...new Set(tags)],
      background: s.background || null, mbti: s.mbti || null, daily_hours: s.daily_hours || null,
      long_term_goal: s.long_term_goal || null, first_seen: s.first_seen, last_active: s.last_active,
      activity_count: s.activity_count, source: 'local-import',
    });
    stuIdByKey.set(norm(s.nickname), id);
  }
  // 回填：submission / followup / wish / response 的 student_id（按 nickname raw 匹配）
  const nickToId = new Map();
  for (const [key, s] of students) nickToId.set(key, stuIdByKey.get(key));
  const fillStudentId = (table) => {
    const rows = all(`SELECT id, raw FROM ${table} WHERE student_id=0 AND raw IS NOT NULL`);
    for (const r of rows) {
      try {
        const nick = JSON.parse(r.raw)?.nickname;
        const sid = nickToId.get(norm(nick || ''));
        if (sid) run(`UPDATE ${table} SET student_id=? WHERE id=?`, sid, r.id);
      } catch { /* ignore */ }
    }
  };
  fillStudentId('asg_submission');
  // followup / wish / response 没存 raw，按同批顺序回填：改为重放一次（简化：用提交时间+关键词匹配）
  // —— 更稳妥：重新遍历 submissions 回填
  for (const { key, date, s, r } of submissions) {
    const sid = stuIdByKey.get(norm(s.nickname)) || null;
    if (!sid) continue;
    const at = clean(r['提交时间']).slice(0, 19) || date;
    if (key === 'blocker' || key === 'skill') {
      run(`UPDATE asg_followup SET student_id=? WHERE student_id=0 AND created_at=? AND (note LIKE ? OR note LIKE ?)`,
        sid, at, `${key === 'blocker' ? '卡点' : '问题'}：%`, '导师回复：%');
    }
    if (key === 'case8' || key === 'case9' || key === 'onboard' || key === 'claw') {
      run(`UPDATE fbk_next_wish SET student_id=? WHERE student_id=0 AND created_at=?`, sid, at);
      run(`UPDATE fbk_survey_response SET student_id=? WHERE student_id=0 AND answered_at=?`, sid, at);
    }
  }

  const result = {
    students: students.size,
    lessons: LESSON_DEFS.length,
    meetings: meetingCount,
    assignments: Object.keys(ASSIGNMENT_DEFS).length,
    submissions: get(`SELECT COUNT(*) AS n FROM asg_submission`).n,
    followups: get(`SELECT COUNT(*) AS n FROM asg_followup`).n,
    wishes: get(`SELECT COUNT(*) AS n FROM fbk_next_wish`).n,
    responses: get(`SELECT COUNT(*) AS n FROM fbk_survey_response`).n,
    added: get(`SELECT COUNT(*) AS n FROM asg_submission`).n + students.size + meetingCount,
    updated: 0,
    elapsed_ms: Date.now() - t0,
  };

  // 6) 同步源状态
  run(`UPDATE syn_source SET status='已连接', update_time=datetime('now','localtime') WHERE source_key='local-import'`);

  if (__isMain) {
    console.log('SAINT local-import 完成：');
    console.log(JSON.stringify(result, null, 2));
  }
  return result;
}

if (__isMain) {
  runImport().catch((e) => { console.error(e); process.exit(1); });
}
