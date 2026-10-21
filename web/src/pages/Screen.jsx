import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

/** 讲课数据大屏：直播/复盘用。全屏深色，30s 自动刷新，愿望轮播。路由 #/screen */
function useStats(intervalMs = 30000) {
  const [state, setState] = useState({ loading: true, data: null });
  useEffect(() => {
    let alive = true;
    const load = () => api.stats().then(
      (data) => alive && setState({ loading: false, data }),
      () => alive && setState((s) => ({ ...s, loading: false }))
    );
    load();
    const t = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(t); };
  }, [intervalMs]);
  return state;
}

function BigStat({ label, value, unit, accent = 'text-white' }) {
  return (
    <div className="text-center">
      <div className={`text-6xl xl:text-7xl font-black leading-none ${accent} tabular-nums tracking-tight`}>{value}<span className="text-2xl text-slate-400 ml-1">{unit}</span></div>
      <div className="text-slate-400 text-sm mt-3 tracking-widest">{label}</div>
    </div>
  );
}

export default function Screen() {
  const { loading, data: s } = useStats();
  const [wishIdx, setWishIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setWishIdx((i) => i + 1), 4000);
    return () => clearInterval(t);
  }, []);

  if (loading || !s) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-lg">SAINT 数据大屏加载中…</div>;
  }

  const wishes = s.recent_wishes || [];
  const wish = wishes.length ? wishes[wishIdx % wishes.length] : null;
  const sat = s.satisfaction || {};
  const clock = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  const trend = (s.weekly_activity || []).slice(-12);
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 xl:p-10 flex flex-col gap-6 overflow-hidden select-none">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-2xl font-black">S</div>
          <div>
            <div className="text-2xl font-bold tracking-wide">SAINT · 超级教师工作台</div>
            <div className="text-slate-500 text-sm">讲课数据大屏 · 数据实时同步</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold tabular-nums text-primary-300">{clock}</div>
          <div className="text-slate-500 text-sm mt-1">数据截至 {s.data_cutoff?.slice(0, 16) || '-'} · 30s 自动刷新</div>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <BigStat label="学员总数" value={s.student_count} unit="人" />
        <BigStat label="近 30 天活跃" value={s.active_30d} unit="人" accent="text-primary-300" />
        <BigStat label="课堂出勤（发言）" value={s.attendance_total} unit="人次" accent="text-emerald-300" />
        <BigStat label="平均满意度" value={sat.avg ?? '-'} unit={`/5`} accent="text-amber-300" />
        <BigStat label="NPS" value={sat.nps ?? '-'} unit="" accent={(sat.nps ?? 0) >= 50 ? 'text-emerald-300' : 'text-primary-300'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* 提交趋势大图 */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col min-h-[320px]">
          <div className="text-slate-400 text-sm tracking-widest mb-4">作业提交趋势（近 12 周）</div>
          <div className="flex-1 flex items-stretch gap-2 min-h-0">
            {trend.map((t) => (
              <div key={t.week} className="flex-1 flex flex-col justify-end items-center gap-2 group h-full min-w-0">
                <div className="text-xs text-slate-400 tabular-nums opacity-60 group-hover:opacity-100 transition-opacity">{t.count}</div>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary-700 to-primary-400 hover:from-primary-600 hover:to-primary-300 transition-all"
                  style={{ height: `${Math.max(4, (t.count / maxTrend) * 82)}%` }}
                />
                <div className="text-[10px] text-slate-600 whitespace-nowrap">{t.week.slice(5)}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-800 text-center">
            <div>
              <div className="text-2xl font-bold tabular-nums">{s.assignment_count}</div>
              <div className="text-slate-500 text-xs mt-1">作业任务</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-sky-300">{s.meeting_count}</div>
              <div className="text-slate-500 text-xs mt-1">课堂会议</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-rose-300">{s.pending_follow_count}</div>
              <div className="text-slate-500 text-xs mt-1">待跟进学员</div>
            </div>
          </div>
        </div>

        {/* 右侧：下节课 + 愿望弹幕 */}
        <div className="flex flex-col gap-6 min-h-0">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
            <div className="text-slate-400 text-sm tracking-widest mb-3">下节课</div>
            {s.next_lesson ? (
              <>
                <div className="text-xl font-bold leading-snug">{s.next_lesson.title}</div>
                <div className="text-primary-300 text-sm mt-2">{s.next_lesson.lesson_date?.slice(0, 16)}</div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold">最近一课：{s.last_lesson?.title?.slice(0, 18) || '-'}</div>
                <div className="text-slate-500 text-sm mt-2">{s.last_lesson?.lesson_date} · 下一期待排期</div>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-primary-900/60 to-slate-900/70 border border-primary-800/50 rounded-2xl p-6 flex-1 flex flex-col justify-center min-h-0">
            <div className="text-slate-400 text-sm tracking-widest mb-3">学员想学 · 实时愿望</div>
            {wish ? (
              <div key={wishIdx} className="animate-[fadeIn_.6s]">
                <div className="text-lg leading-relaxed line-clamp-4">“{wish.wish_text?.slice(0, 90)}”</div>
                <div className="text-primary-300 text-sm mt-3">—— {wish.nickname} · {wish.theme}</div>
              </div>
            ) : <div className="text-slate-600">暂无</div>}
          </div>

          <a href="#/" className="text-center text-slate-600 hover:text-slate-400 text-xs transition-colors py-1">← 返回工作台</a>
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
