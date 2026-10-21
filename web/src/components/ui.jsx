import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export function Card({ title, extra, children, className = '', pad = true }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>
      {(title || extra) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="font-semibold text-slate-700">{title}</h3>
          {extra}
        </div>
      )}
      <div className={pad ? 'px-5 pb-5 pt-2' : ''}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, sub, tone = 'indigo', icon }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex items-center gap-4">
      {icon && <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl ${tones[tone]}`}>{icon}</div>}
      <div className="min-w-0">
        <div className="text-slate-500 text-xs">{label}</div>
        <div className="text-2xl font-bold text-slate-800 leading-tight">{value}</div>
        {sub && <div className="text-xs text-slate-400 truncate">{sub}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, color = 'slate' }) {
  const map = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[color] || map.slate} whitespace-nowrap`}>{children}</span>;
}

export function Avatar({ name, hue = 210, size = 36 }) {
  const ch = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, background: `hsl(${hue}, 65%, 55%)`, fontSize: size * 0.42 }}
    >
      {ch}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      加载中…
    </div>
  );
}

export function Empty({ text = '暂无数据' }) {
  return <div className="text-center text-slate-400 py-12 text-sm">{text}</div>;
}

export function ErrorBox({ error, retry }) {
  return (
    <div className="text-center py-12">
      <div className="text-rose-500 mb-2">⚠️ {String(error)}</div>
      {retry && <button onClick={retry} className="text-indigo-600 hover:underline text-sm">重试</button>}
    </div>
  );
}

/** 简单 SVG 柱状图（周度活跃） */
export function BarChart({ data = [], height = 160, color = '#6366f1' }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.count / max) * (height - 24);
          return (
            <g key={i}>
              <rect x={i * w + w * 0.18} y={height - 18 - h} width={w * 0.64} height={h} rx="1.5" fill={color} opacity={0.85}>
                <title>{`${d.week}：${d.count} 份提交`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{data[0]?.week?.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.week?.slice(5)}</span>
        <span>{data[data.length - 1]?.week?.slice(5)}</span>
      </div>
    </div>
  );
}

/** 通用 hooks */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => alive && setState({ loading: false, data, error: null }),
      (error) => alive && setState({ loading: false, data: null, error })
    );
    return () => { alive = false; };
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export const fmtDate = (t) => (t || '').replace('T', ' ').slice(0, 16);
export const fmtDay = (t) => (t || '').slice(0, 10);
