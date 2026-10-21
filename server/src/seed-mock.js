/**
 * Mock 数据生成器：为开源使用者生成演示数据（不含任何真实学员信息）。
 * 运行：npm run mock
 * 注意：会清空现有业务数据表。
 */
import { run, insert, all } from './db.js';

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const dateStr = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
const daysAgo = (n) => dateStr(new Date(Date.now() - n * 86400000));

for (const t of ['stu_tag', 'stu_profile', 'crs_progress', 'crs_lesson', 'crs_course', 'mtg_attendance', 'mtg_record',
  'asg_followup', 'asg_submission', 'asg_assignment', 'fbk_survey_response', 'fbk_next_wish']) {
  run(`DELETE FROM ${t}`);
  run(`DELETE FROM sqlite_sequence WHERE name=?`, t);
}

// 课程与课次
const courseId = insert('crs_course', {
  code: 'MOCK-COURSE-001', name: '示例课程 · AI 教学训练营（演示数据）',
  description: '这是 Mock 演示数据，替换 data/raw/ 后运行 npm run import 即可导入你的真实数据',
  start_date: daysAgo(90).slice(0, 10), status: '进行中',
});
const lessonTitles = ['开营第一课 · 认识 AI 助教', '工作流拆解入门', 'Skill 开发标准', '实战案例拆解', '复盘与方法论', '结营路演'];
const lessonIds = lessonTitles.map((t, i) => insert('crs_lesson', {
  course_id: courseId, title: t, lesson_date: daysAgo(80 - i * 12).slice(0, 10), order_no: i + 1,
  meeting_code: `9${rnd(10000000, 99999999)}`, summary: `第 ${i + 1} 课演示小结：本课围绕「${t}」展开讲解与练习。`, materials: [],
}));
lessonIds.forEach((lid, i) => insert('mtg_record', {
  meeting_code: `9${rnd(10000000, 99999999)}`, subject: `线上课 ${i + 1} · ${lessonTitles[i]}`,
  start_time: daysAgo(80 - i * 12), duration_min: rnd(45, 120), has_minutes: 1,
  summary: `演示纪要：出席良好，互动 ${rnd(10, 40)} 次。`, lesson_id: lid,
}));

// 学员
const surnames = ['林', '陈', '王', '李', '张', '刘', '杨', '赵', '周', '吴', '徐', '孙'];
const given = ['小明', '小红', '小刚', '小雨', '小蓝', '小北', '小南', '小夏', '小秋', '小冬', '小满', '小雪', '小凡', '小新'];
const areas = ['AI 视频/图像', '内容创作', 'FDE 交付', '应用开发', '学习与知识', '金融'];
const wishTexts = [
  '想学怎么让 AI 自动整理作业', '希望能讲讲数据分析', '想了解提示词工程', '下节课想看实战案例',
  '希望多些答疑时间', '想学自动化工作流', '想了解 AI 出题', '希望讲讲学员激励',
];
const themes = ['自动化与定时任务', '学习与基础', '工程方法论', 'FDE 与商业化', '视频与创作', '其他'];
const stuIds = [];
for (let i = 0; i < 24; i++) {
  const nick = pick(surnames) + pick(given) + (i % 3 === 0 ? String(rnd(2, 99)) : '');
  const active = rnd(1, 9);
  const id = insert('stu_profile', {
    nickname: nick, real_name: i % 4 === 0 ? pick(surnames) + '老师的学生' : null,
    class_name: i % 2 === 0 ? '一班' : '二班', avatar_hue: (i * 47) % 360,
    focus_areas: [pick(areas)], tags: active >= 6 ? ['高活跃'] : [],
    background: pick(['在校学生', '在职教师', '自由职业', '企业培训']),
    mbti: pick(['INTJ', 'ENFP', 'ISTP', 'ESFJ', 'INFP']),
    daily_hours: `${rnd(1, 5)} 小时`, long_term_goal: pick(['提升教学效率', '转型 AI 教育', '做自动化课程']),
    first_seen: daysAgo(rnd(60, 90)), last_active: daysAgo(rnd(0, 20)), activity_count: active,
  });
  stuIds.push(id);
}

// 作业与提交
const asgDefs = [
  ['第1周 · 自选任务', '任务提交', 70], ['Skill 开发作业', 'Skill 开发', 50],
  ['期中案例提交', '案例提交', 40], ['期末复盘提交', '案例提交', 25],
];
const asgIds = asgDefs.map(([title, type, ago], i) => insert('asg_assignment', {
  course_id: courseId, title, description: `${title}（演示）`,
  assigned_date: daysAgo(ago + 5).slice(0, 10), due_date: daysAgo(ago).slice(0, 10), type,
}));
for (const aid of asgIds) {
  for (const sid of stuIds) {
    if (Math.random() < 0.72) {
      const late = Math.random() < 0.12;
      insert('asg_submission', {
        assignment_id: aid, student_id: sid, status: late ? '迟交' : '已交',
        submitted_at: daysAgo(rnd(0, 30)), content_excerpt: '演示提交内容摘要……',
        attachment_count: rnd(0, 3), skill_file_count: Math.random() < 0.3 ? rnd(1, 3) : 0, raw: null,
      });
    }
  }
}

// 反馈
for (const sid of stuIds) {
  const n = rnd(0, 3);
  for (let k = 0; k < n; k++) {
    const w = pick(wishTexts);
    insert('fbk_next_wish', {
      student_id: sid, course_id: courseId, wish_text: w,
      theme: pick(themes), created_at: daysAgo(rnd(0, 60)), source: '演示问卷',
    });
  }
}

console.log('✅ Mock 数据已生成：24 名演示学员 / 6 个课次 / 4 项作业 / 6 场会议。');
console.log('   npm start 后打开 http://localhost:8787 查看。');
console.log('   要导入真实数据：把采集文件放入 data/raw/ 后运行 npm run import。');
