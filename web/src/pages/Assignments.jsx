import React, { useState } from 'react';
import { Link } from '../router.jsx';
import { api } from '../api.js';
import { Avatar, Badge, Loading, Empty, useApi, fmtDate } from '../components/ui.jsx';

export default function Assignments() {
  const asg = useApi(api.assignments);
  const [activeId, setActiveId] = useState(null);
  const subs = useApi(() => api.submissions(activeId ? { assignment_id: activeId } : {}), [activeId]);

  if (asg.loading) return <Loading />;
  if (asg.error) return <Empty text={`加载失败：${asg.error}`} />;
  const list = asg.data || [];
  const current = activeId || list[0]?.id;
  const currentAsg = list.find((a) => a.id === current);

  return (
    <div className="space-y-6">
      {/* 作业卡片行 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {list.map((a) => {
          const rate = a.roster ? Math.round((a.submitted / a.roster) * 100) : 0;
          const active = a.id === current;
          return (
            <button
              key={a.id}
              onClick={() => setActiveId(a.id)}
              className={`text-left bg-white border rounded-xl shadow-sm p-4 transition-all hover:shadow ${
                active ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge color={a.type === 'Skill 开发' ? 'violet' : a.type === '案例提交' ? 'sky' : 'slate'}>{a.type}</Badge>
                {!!a.late && <Badge color="rose">迟交 {a.late}</Badge>}
              </div>
              <div className="font-semibold text-slate-800 text-sm">{a.title}</div>
              <div className="text-xs text-slate-400 mt-1">截止 {a.due_date?.slice(0, 10)}</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${rate >= 60 ? 'bg-emerald-400' : rate >= 30 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${rate}%` }} />
                </div>
                <span className="text-xs text-slate-500 font-medium">{a.submitted}/{a.roster}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 提交明细 */}
      {currentAsg && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <h3 className="font-semibold text-slate-700">提交明细 · {currentAsg.title}</h3>
            {subs.loading ? <span className="text-xs text-slate-400">加载中…</span> : <Badge color="indigo">{(subs.data || []).length} 份</Badge>}
          </div>
          <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
            {(subs.data || []).map((x) => (
              <div key={x.id} className="px-5 py-3.5 hover:bg-slate-50/60">
                <div className="flex items-center gap-3 flex-wrap">
                  <Link to={`/students/${x.student_id}`} className="flex items-center gap-2.5 group">
                    <Avatar name={x.nickname} size={30} hue={(x.student_id * 47) % 360} />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">{x.nickname}</span>
                  </Link>
                  <Badge color={x.status === '迟交' ? 'rose' : 'emerald'}>{x.status}</Badge>
                  {!!x.skill_file_count && <Badge color="violet">Skill ×{x.skill_file_count}</Badge>}
                  {!!x.attachment_count && <Badge>附件 ×{x.attachment_count}</Badge>}
                  <span className="text-[11px] text-slate-400 ml-auto">{fmtDate(x.submitted_at)}</span>
                </div>
                {x.content_excerpt && (
                  <div className="text-xs text-slate-500 mt-2 ml-[42px] whitespace-pre-line line-clamp-3">{x.content_excerpt}</div>
                )}
              </div>
            ))}
            {!subs.loading && !(subs.data || []).length && <Empty text="暂无提交" />}
          </div>
        </div>
      )}
    </div>
  );
}
