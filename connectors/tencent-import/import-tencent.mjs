/**
 * SAINT 连接器 · tencent-import
 * 同步腾讯系连接器真实拉取的数据（data/raw/tencent/ 下由 AI 助手/连接器导出的 JSON）：
 *   - survey_answers.json → 学员档案 + 每周反馈作业 + 提交 + 愿望 + 卡点
 *   - meetings.json       → 会议记录（增量 upsert，已存在的只更新纪要字段）
 *   - docs.json           → 腾讯文档（blocked 时跳过，状态写回 syn_source）
 *
 * 幂等策略：与 local-import 隔离——只清理/写入 source='tencent-import' 的行；
 * 会议按 meeting_code upsert（不删除 local-import 已建记录）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { all, get, run, insert, ROOT, cnNow } from '../../server/src/db.js';

const RAW = path.join(ROOT, 'data', 'raw', 'tencent');
const __isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));

function ensureCourseAndAssignment() {
  // 测试数据挂在演示课程下；作业不存在则建
  let course = get(`SELECT id FROM crs_course WHERE code='AI-CAMP-2026'`);
  let courseId = course?.id;
  if (!courseId) {
    courseId = insert('crs_course', {
      code: 'AI-CAMP-2026', name: 'AI 前沿营 · 小龙虾训练营',
      description: '围绕小龙虾（OpenClaw/OpenCloud）AI Agent 的训练营',
      start_date: '2026-06-04', status: '进行中',
    });
  }
  let asg = get(`SELECT id FROM asg_assignment WHERE title='每周反馈 · 学员问卷'`);
  let asgId = asg?.id;
  if (!asgId) {
    asgId = insert('asg_assignment', {
      course_id: courseId, title: '每周反馈 · 学员问卷',
      description: '腾讯问卷「学员每周反馈」的答卷同步（由 tencent-import 连接器维护）',
      assigned_date: '2026-10-21', due_date: '2026-10-26', type: '问卷',
    });
  }
  return { courseId, asgId };
}

function ensureStudent(nickname, courseId) {
  const key = nickname.trim();
  let s = get(`SELECT id FROM stu_profile WHERE nickname=?`, key);
  if (s) return s.id;
  return insert('stu_profile', {
    nickname: key, class_name: 'AI 前沿营', avatar_hue: Math.abs(hashCode(key)) % 360,
    focus_areas: ['探索中'], tags: ['连接器同步'], source: 'tencent-import',
    first_seen: cnNow(), last_active: cnNow(), activity_count: 1,
  });
}
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

export async function runImport() {
  const t0 = Date.now();
  const stats = { students: 0, submissions: 0, wishes: 0, followups: 0, meetings: 0, documents: 0, skipped_docs: 0, added: 0, updated: 0 };

  // ---------- 腾讯问卷 ----------
  const surveyFile = path.join(RAW, 'survey_answers.json');
  if (fs.existsSync(surveyFile)) {
    const data = readJson('survey_answers.json');
    const { courseId, asgId } = ensureCourseAndAssignment();

    // 幂等：清掉本连接器旧提交，重建
    run(`DELETE FROM asg_submission WHERE source='tencent-import'`);
    run(`DELETE FROM fbk_next_wish WHERE source='tencent-import'`);
    run(`DELETE FROM asg_followup WHERE source='tencent-import'`);

    for (const a of data.answers || []) {
      const nick = a.answers['你的群昵称'] || `匿名${a.answer_id}`;
      const sid = ensureStudent(nick, courseId);
      stats.students++;

      // 提交记录
      const statusMap = { '已完成并提交': '已交', '已完成未提交': '迟交', '进行中': '迟交', '还没开始': '未交' };
      insert('asg_submission', {
        assignment_id: asgId, student_id: sid,
        status: statusMap[a.answers['本周任务完成情况']] || '已交',
        submitted_at: a.ended_at,
        content_excerpt: `完成情况：${a.answers['本周任务完成情况']}；评分：${a.answers['给课程的整体评分'] || '未评'}`,
        attachment_count: 0, skill_file_count: 0, source: 'tencent-import',
        raw: null,
      });
      stats.submissions++;

      // 下节课愿望
      const wish = (a.answers['下节课你最想学什么？'] || '').trim();
      if (wish) {
        insert('fbk_next_wish', {
          student_id: sid, course_id: courseId, wish_text: wish.slice(0, 500),
          theme: themeOf(wish), created_at: a.ended_at, source: '腾讯问卷',
        });
        stats.wishes++;
      }
      // 卡点
      const blocker = (a.answers['本周遇到的卡点或问题'] || '').trim();
      if (blocker) {
        insert('asg_followup', {
          submission_id: null, student_id: sid, assignment_id: asgId,
          note: `卡点：${blocker.slice(0, 400)}`, created_at: a.ended_at, source: 'tencent-import',
        });
        stats.followups++;
      }
      // 评分 → 满意度数据源（/api/satisfaction）
      const rating = (a.answers['给课程的整体评分'] || '').trim();
      if (rating) {
        insert('fbk_survey_response', {
          student_id: sid, survey_name: '学员每周反馈', question: '给课程的整体评分',
          answer: rating, answered_at: a.ended_at, source: 'tencent-import',
        });
      }
      // 更新活跃度
      run(`UPDATE stu_profile SET last_active=?, activity_count=activity_count+1 WHERE id=?`, a.ended_at, sid);
    }
    run(`UPDATE syn_source SET status='已连接', update_time=datetime('now','localtime') WHERE source_key='tencent-survey'`);
  }

  // ---------- 腾讯会议（增量 upsert） ----------
  const meetingFile = path.join(RAW, 'meetings.json');
  if (fs.existsSync(meetingFile)) {
    const data = readJson('meetings.json');
    for (const m of data.meetings || []) {
      const exist = get(`SELECT id, has_minutes FROM mtg_record WHERE meeting_code=? AND subject=?`, m.meeting_code, m.subject);
      if (exist) {
        if (m.has_minutes && !exist.has_minutes) {
          run(`UPDATE mtg_record SET has_minutes=1, summary=COALESCE(?, summary), update_time=datetime('now','localtime') WHERE id=?`, m.summary || null, exist.id);
          stats.updated++;
        }
      } else {
        insert('mtg_record', {
          meeting_code: m.meeting_code, subject: m.subject,
          start_time: (m.start_time || '').slice(0, 19),
          duration_min: m.duration_min || null,
          has_minutes: m.has_minutes ? 1 : 0, summary: m.summary || null,
          source: 'tencent-import',
        });
        stats.meetings++;
      }
    }
    run(`UPDATE syn_source SET status='已连接', update_time=datetime('now','localtime') WHERE source_key='tencent-meeting'`);
  }

  // ---------- 腾讯文档（最近文档列表 → 课程资料） ----------
  const docsFile = path.join(RAW, 'docs.json');
  if (fs.existsSync(docsFile)) {
    const data = readJson('docs.json');
    const docs = data.documents || [];
    if (docs.length) {
      // 幂等：清掉本连接器的旧文档资料，按最新列表重建
      run(`DELETE FROM doc_material WHERE source='tencent-import'`);
      const course = get(`SELECT id FROM crs_course WHERE code='AI-CAMP-2026'`);
      for (const d of docs) {
        insert('doc_material', {
          course_id: course?.id || null, title: d.title, doc_type: d.doc_type || 'doc',
          owner: d.owner || null, url: d.url || null,
          last_viewed: d.last_viewed || null, size: d.size || null,
          source: 'tencent-import',
        });
        stats.documents++;
      }
      run(`UPDATE syn_source SET status='已连接', update_time=datetime('now','localtime') WHERE source_key='tencent-docs'`);
    } else {
      run(`UPDATE syn_source SET status='未配置', update_time=datetime('now','localtime') WHERE source_key='tencent-docs'`);
      stats.skipped_docs = 1;
    }
  }

  stats.added = stats.students + stats.submissions + stats.wishes + stats.followups + stats.meetings + stats.documents;
  stats.elapsed_ms = Date.now() - t0;
  stats.finished_at = cnNow();

  if (__isMain) {
    console.log('SAINT tencent-import 完成：');
    console.log(JSON.stringify(stats, null, 2));
  }
  return stats;
}

function themeOf(text) {
  const t = text || '';
  if (/定时|自动化|自主|主动/.test(t)) return '自动化与定时任务';
  if (/黑客松|路演|比赛/.test(t)) return '黑客松实战';
  if (/FDE|交付|报价|客户|企业|接单/.test(t)) return 'FDE 与商业化';
  if (/视频|剪辑|生图/.test(t)) return '视频与创作';
  if (/信息|资讯|渠道/.test(t)) return '信息渠道';
  return '其他';
}

if (__isMain) {
  runImport().catch((e) => { console.error(e); process.exit(1); });
}
