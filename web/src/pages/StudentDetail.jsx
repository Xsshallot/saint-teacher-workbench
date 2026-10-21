import React from 'react';
import { DirectInbox, MessageQuestion, Warning2, InfoCircle, Flag } from 'iconsax-react';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { Card, Avatar, Badge, Loading, Empty, LineChart, useApi, fmtDate } from '../components/ui.jsx';

const typeIcon = { submission: DirectInbox, wish: MessageQuestion, followup: Warning2 };

export default function StudentDetail({ id }) {
  const { loading, data, error } = useApi(() => api.student(id));
  const act = useApi(() => api.activity({ student_id: id }));

  if (loading) return <Loading />;
  if (error || !data) return <Empty text="未找到该学员" />;

  const s = data;
  return (
    <div className="space-y-6">
      {/* 档案头 */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={s.nickname} hue={s.avatar_hue} size={64} />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800">{s.nickname}</h2>
              {s.real_name && <span className="text-slate-400 text-sm">{s.real_name}</span>}
              <Badge color="primary">{s.class_name}</Badge>
              {s.activity_count >= 5 && <Badge color="emerald">高活跃</Badge>}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(s.focus_areas || []).map((a) => <Badge key={a} color="violet">{a}</Badge>)}
              {(s.tags || []).filter((t) => t !== '高活跃').map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
            {s.background && (
              <div className="text-sm text-slate-600 mt-3 flex items-start gap-1.5">
                <InfoCircle variant="Linear" size={15} color="#64748b" className="mt-0.5 shrink-0" />
                <span>{s.background}</span>
              </div>
            )}
            {s.long_term_goal && (
              <div className="text-sm text-slate-500 mt-1 flex items-start gap-1.5">
                <Flag variant="Linear" size={15} color="#94a3b8" className="mt-0.5 shrink-0" />
                <span>长期规划：{s.long_term_goal}</span>
              </div>
            )}
            <div className="flex gap-6 mt-3 text-xs text-slate-400">
              <span>首次活跃 {fmtDate(s.first_seen)}</span>
              <span>最近活跃 {fmtDate(s.last_active)}</span>
              <span>累计提交 {s.activity_count} 次</span>
              {s.daily_hours && <span>每日投入：{s.daily_hours}</span>}
              {s.mbti && <span>MBTI：{s.mbti}</span>}
            </div>
          </div>
          <Link to="/students" className="text-sm text-primary-600 hover:underline">← 返回列表</Link>
        </div>
      </div>

      {/* 个人活跃度趋势 */}
      {(act.data?.weekly || []).length > 1 && (
        <Card title="个人活跃度趋势（提交 + 出勤）" extra={
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#5B84FA]" />提交</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />出勤</span>
          </div>
        }>
          <LineChart data={act.data.weekly.slice(-16).map((w) => ({ label: w.week.slice(5), submissions: w.submissions, attendance: w.attendance }))} series={['submissions', 'attendance']} />
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 时间线 */}
        <Card title="成长时间线" extra={<Badge>{s.timeline.length} 条</Badge>}>
          <div className="space-y-3 max-h-[560px] overflow-y-auto pt-1 pr-1">
            {s.timeline.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  {(() => { const Ico = typeIcon[t.type]; return Ico ? <Ico variant="Linear" size={16} color="#64748b" /> : <span className="text-slate-400 text-xs">•</span>; })()}
                </div>
                <div className="flex-1 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-700">{t.title}</span>
                    {t.theme && <Badge color="amber">{t.theme}</Badge>}
                    {t.status === '迟交' && <Badge color="rose">迟交</Badge>}
                    <span className="text-[11px] text-slate-400 ml-auto">{fmtDate(t.at)}</span>
                  </div>
                  {t.text && <div className="text-xs text-slate-500 mt-1 whitespace-pre-line line-clamp-4">{t.text}</div>}
                </div>
              </div>
            ))}
            {!s.timeline.length && <Empty />}
          </div>
        </Card>

        <div className="space-y-6">
          {/* 作业提交 */}
          <Card title="作业提交" extra={<Badge color="sky">{s.submissions.length} 份</Badge>}>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pt-1">
              {s.submissions.map((x) => (
                <div key={x.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-700">{x.assignment_title}</span>
                    <Badge color={x.status === '迟交' ? 'rose' : 'emerald'}>{x.status}</Badge>
                    {!!x.skill_file_count && <Badge color="violet">Skill ×{x.skill_file_count}</Badge>}
                    {!!x.attachment_count && <Badge>附件 ×{x.attachment_count}</Badge>}
                    <span className="text-[11px] text-slate-400 ml-auto">{fmtDate(x.submitted_at)}</span>
                  </div>
                  {x.content_excerpt && <div className="text-xs text-slate-500 mt-1.5 whitespace-pre-line line-clamp-3">{x.content_excerpt}</div>}
                </div>
              ))}
              {!s.submissions.length && <Empty text="暂无提交" />}
            </div>
          </Card>

          {/* 愿望 */}
          <Card title="TA 想学什么" extra={<Badge color="amber">{s.wishes.length} 条</Badge>}>
            <div className="space-y-2 max-h-52 overflow-y-auto pt-1">
              {s.wishes.map((w) => (
                <div key={w.id} className="bg-amber-50/60 border border-amber-100 rounded-lg p-3">
                  <div className="flex gap-2 items-center mb-1">
                    <Badge color="amber">{w.theme}</Badge>
                    <span className="text-[11px] text-slate-400 ml-auto">{fmtDate(w.created_at)}</span>
                  </div>
                  <div className="text-xs text-slate-600 whitespace-pre-line line-clamp-3">{w.wish_text}</div>
                </div>
              ))}
              {!s.wishes.length && <Empty text="暂无愿望记录" />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
