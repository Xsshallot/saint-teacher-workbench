import React, { useState } from 'react';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { Avatar, Badge, Card, Loading, Empty, useApi, fmtDate } from '../components/ui.jsx';

export default function Feedback() {
  const [theme, setTheme] = useState('');
  const { loading, data, error } = useApi(() => api.feedback(theme), [theme]);

  return (
    <div className="space-y-5">
      {/* 主题筛选 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTheme('')}
          className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
            theme === '' ? 'bg-primary-500 text-white border-primary-500' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
          }`}
        >
          全部
        </button>
        {(data?.themes || []).map((t) => (
          <button
            key={t.theme}
            onClick={() => setTheme(t.theme)}
            className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
              theme === t.theme ? 'bg-primary-500 text-white border-primary-500' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
            }`}
          >
            {t.theme} <span className="opacity-60">{t.n}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <Empty text={`加载失败：${error}`} />
      ) : (
        <Card title="下节课想学什么 · 学员愿望墙" pad={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {(data?.wishes || []).map((w) => (
              <div key={w.id} className="p-4 hover:bg-amber-50/40 transition-colors">
                <div className="flex items-center gap-2.5 mb-2">
                  <Link to={`/students/${w.student_id}`}>
                    <Avatar name={w.nickname} size={26} hue={(w.student_id * 47) % 360} />
                  </Link>
                  <span className="text-xs font-medium text-slate-600">{w.nickname}</span>
                  <Badge color="amber">{w.theme}</Badge>
                  <span className="text-[10px] text-slate-400 ml-auto">{fmtDate(w.created_at).slice(2)}</span>
                </div>
                <div className="text-xs text-slate-600 whitespace-pre-line line-clamp-5 leading-relaxed">{w.wish_text}</div>
                {w.source && <div className="text-[10px] text-slate-300 mt-1.5">来源：{w.source}</div>}
              </div>
            ))}
          </div>
          {!(data?.wishes || []).length && <Empty text="该主题下暂无愿望" />}
        </Card>
      )}
    </div>
  );
}
