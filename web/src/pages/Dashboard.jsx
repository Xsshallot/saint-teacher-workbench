import React from 'react';
import { Profile2User, NotificationBing, BookSquare, MessageFavorite, Star1, VideoVertical } from 'iconsax-react';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { Card, StatCard, Badge, Avatar, BarChart, LineChart, Loading, Empty, useApi, fmtDay } from '../components/ui.jsx';

export default function Dashboard() {
  const { loading, data, error, reload } = useApi(api.stats);
  const act = useApi(() => api.activity());
  const sat = useApi(api.satisfaction);

  if (loading) return <Loading />;
  if (error) return <Empty text={`加载失败：${error}`} />;
  const s = data;

  return (
    <div className="space-y-6">
      {/* 指标卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="学员总数" value={s.student_count} sub={`近 30 天活跃 ${s.active_30d} 人`} tone="primary" icon={<Profile2User variant="Linear" size={22} color="#3D66E8" />} />
        <StatCard label="待跟进" value={s.pending_follow_count} sub="活跃学员未交最近作业" tone="rose" icon={<NotificationBing variant="Linear" size={22} color="#e11d48" />} />
        <StatCard label="课程进度" value={`${s.last_lesson ? '第 ' + (s.last_lesson.order_no || '-') + ' 课' : '-'}`} sub={s.last_lesson ? `${fmtDay(s.last_lesson.lesson_date)} ${s.last_lesson.title.slice(0, 12)}` : ''} tone="sky" icon={<BookSquare variant="Linear" size={22} color="#0284c7" />} />
        <StatCard label="反馈愿望" value={s.wish_count} sub={`覆盖 ${s.feedback_themes.length} 个主题`} tone="amber" icon={<MessageFavorite variant="Linear" size={22} color="#d97706" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 周度活跃（提交+出勤） */}
        <Card title="活跃度趋势（提交 + 出勤）" className="lg:col-span-2" extra={
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#5B84FA]" />提交</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />出勤</span>
          </div>
        }>
          {(act.data?.weekly || []).length ? (
            <LineChart data={act.data.weekly.slice(-14).map((w) => ({ label: w.week.slice(5), submissions: w.submissions, attendance: w.attendance }))} series={['submissions', 'attendance']} />
          ) : <BarChart data={s.weekly_activity} />}
        </Card>

        {/* 满意度 / NPS */}
        <Card title="满意度 / NPS" extra={<Link to="/feedback" className="text-xs text-primary-600 hover:underline">反馈墙 →</Link>}>
          {sat.data && sat.data.total ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-bold text-slate-800 leading-none">{sat.data.avg ?? '-'}</div>
                  <div className="text-[10px] text-slate-400 mt-1">平均评分（5 分制 · {sat.data.total} 份）</div>
                </div>
                <div className="ml-auto text-right">
                  <div className={`text-3xl font-bold leading-none ${(sat.data.nps.score ?? 0) >= 50 ? 'text-emerald-500' : (sat.data.nps.score ?? 0) >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>{sat.data.nps.score ?? '-'}</div>
                  <div className="text-[10px] text-slate-400 mt-1">NPS</div>
                </div>
              </div>
              {!!sat.data.trend.length && (
                <LineChart height={90} data={sat.data.trend.map((t) => ({ label: t.date.slice(5), avg: t.avg }))} series={['avg']} colors={['#f59e0b']} />
              )}
              <div className="text-[10px] text-slate-400">推荐 {sat.data.nps.promoters} · 中立 {sat.data.nps.passives} · 贬损 {sat.data.nps.detractors}</div>
            </div>
          ) : <Empty text="暂无评分数据" />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 待跟进名单 */}
        <Card title="需要跟进的学员" extra={<Badge color="rose">{s.pending_follow_count} 人</Badge>}>
          {s.pending_follow.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {s.pending_follow.map((p) => (
                <Link key={p.id} to={`/students/${p.id}`} className="flex items-center gap-2 bg-slate-50 hover:bg-primary-50 border border-slate-200 rounded-full pl-1 pr-3 py-1 transition-colors">
                  <Avatar name={p.nickname} hue={(p.id * 47) % 360} size={24} />
                  <span className="text-xs text-slate-700">{p.nickname}</span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty text="全部已交，无需跟进" />
          )}
        </Card>

        {/* 最近课次 */}
        <Card title="课程进度" extra={<Link to="/courses" className="text-xs text-primary-600 hover:underline">全部课次 →</Link>}>
          <div className="space-y-3 pt-1 max-h-72 overflow-y-auto pr-1">
            {[...(s.last_lesson ? [s.last_lesson] : [])].map((l) => (
              <div key={l.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color="primary">第 {l.order_no} 课</Badge>
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

        {/* 反馈主题 */}
        <Card title="下节课愿望 · 主题聚类">
          <div className="space-y-2.5 pt-1 max-h-72 overflow-y-auto pr-1">
            {s.feedback_themes.slice(0, 8).map((t) => {
              const max = s.feedback_themes[0]?.n || 1;
              return (
                <div key={t.theme}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{t.theme}</span>
                    <span className="text-slate-400">{t.n}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-400 rounded-full" style={{ width: `${(t.n / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {!s.feedback_themes.length && <Empty />}
          </div>
        </Card>
      </div>
    </div>
  );
}
