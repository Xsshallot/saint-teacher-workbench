import React from 'react';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { Card, StatCard, Badge, Avatar, BarChart, Loading, Empty, useApi, fmtDay } from '../components/ui.jsx';

export default function Dashboard() {
  const { loading, data, error, reload } = useApi(api.stats);

  if (loading) return <Loading />;
  if (error) return <Empty text={`加载失败：${error}`} />;
  const s = data;

  return (
    <div className="space-y-6">
      {/* 指标卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="学员总数" value={s.student_count} sub={`近 30 天活跃 ${s.active_30d} 人`} icon="👥" tone="indigo" />
        <StatCard label="待跟进" value={s.pending_follow_count} sub="活跃学员未交最近作业" icon="🔔" tone="rose" />
        <StatCard label="课程进度" value={`${s.last_lesson ? '第 ' + (s.last_lesson.order_no || '-') + ' 课' : '-'}`} sub={s.last_lesson ? `${fmtDay(s.last_lesson.lesson_date)} ${s.last_lesson.title.slice(0, 12)}` : ''} icon="📚" tone="sky" />
        <StatCard label="反馈愿望" value={s.wish_count} sub={`覆盖 ${s.feedback_themes.length} 个主题`} icon="💬" tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 周度活跃 */}
        <Card title="作业提交趋势（近 12 周）" className="lg:col-span-2">
          <BarChart data={s.weekly_activity} />
        </Card>

        {/* 反馈主题 */}
        <Card title="下节课愿望 · 主题聚类" extra={<Link to="/feedback" className="text-xs text-indigo-600 hover:underline">查看全部 →</Link>}>
          <div className="space-y-2.5 pt-1">
            {s.feedback_themes.slice(0, 8).map((t) => {
              const max = s.feedback_themes[0]?.n || 1;
              return (
                <div key={t.theme}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{t.theme}</span>
                    <span className="text-slate-400">{t.n}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(t.n / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {!s.feedback_themes.length && <Empty />}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 待跟进名单 */}
        <Card title="需要跟进的学员" extra={<Badge color="rose">{s.pending_follow_count} 人</Badge>}>
          {s.pending_follow.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {s.pending_follow.map((p) => (
                <Link key={p.id} to={`/students/${p.id}`} className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-full pl-1 pr-3 py-1 transition-colors">
                  <Avatar name={p.nickname} hue={(p.id * 47) % 360} size={24} />
                  <span className="text-xs text-slate-700">{p.nickname}</span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty text="全部已交 🎉" />
          )}
        </Card>

        {/* 最近课次 */}
        <Card title="课程进度" extra={<Link to="/courses" className="text-xs text-indigo-600 hover:underline">全部课次 →</Link>}>
          <div className="space-y-3 pt-1 max-h-72 overflow-y-auto pr-1">
            {[...(s.last_lesson ? [s.last_lesson] : [])].map((l) => (
              <div key={l.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color="indigo">第 {l.order_no} 课</Badge>
                  <span className="text-xs text-slate-400">{fmtDay(l.lesson_date)}</span>
                </div>
                <div className="font-medium text-slate-700 text-sm">{l.title}</div>
                {l.summary && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{l.summary}</div>}
              </div>
            ))}
            <div className="text-xs text-slate-400">
              下节课：{s.next_lesson ? `${fmtDay(s.next_lesson.lesson_date)} ${s.next_lesson.title}` : '待排期'}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
