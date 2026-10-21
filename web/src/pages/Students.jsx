import React, { useState } from 'react';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { Avatar, Badge, Loading, Empty, useApi, fmtDay } from '../components/ui.jsx';

const areaColor = {
  'AI 视频/图像': 'violet',
  内容创作: 'amber',
  金融: 'emerald',
  'FDE 交付': 'sky',
  应用开发: 'indigo',
  学习与知识: 'slate',
  探索中: 'slate',
};

export default function Students() {
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('');
  const { loading, data, error } = useApi(() => api.students(q, cls), [q, cls]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索昵称 / 姓名…"
          className="border border-slate-300 rounded-lg px-3.5 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
        />
        <select
          value={cls}
          onChange={(e) => setCls(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">全部班级</option>
          <option value="AI 前沿营">AI 前沿营</option>
          <option value="主线班">主线班</option>
        </select>
        <div className="text-xs text-slate-400 ml-auto">{data ? `${data.length} 名学员` : ''}</div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <Empty text={`加载失败：${error}`} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 font-medium">学员</th>
                <th className="px-3 py-3 font-medium hidden md:table-cell">主攻方向</th>
                <th className="px-3 py-3 font-medium hidden lg:table-cell">背景</th>
                <th className="px-3 py-3 font-medium">活跃</th>
                <th className="px-3 py-3 font-medium hidden sm:table-cell">最近活跃</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/students/${s.id}`} className="flex items-center gap-3 group">
                      <Avatar name={s.nickname} hue={s.avatar_hue} />
                      <div>
                        <div className="font-medium text-slate-800 group-hover:text-indigo-600">{s.nickname}</div>
                        {s.real_name && <div className="text-xs text-slate-400">{s.real_name}</div>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(s.focus_areas || []).slice(0, 3).map((a) => (
                        <Badge key={a} color={areaColor[a] || 'slate'}>{a}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="text-xs text-slate-500 max-w-[220px] truncate">{s.background || '—'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, (s.activity_count / 8) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{s.activity_count}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell text-xs text-slate-400">{fmtDay(s.last_active)}</td>
                </tr>
              ))}
              {!data.length && (
                <tr>
                  <td colSpan={5}><Empty text="没有匹配的学员" /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
