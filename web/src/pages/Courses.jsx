import React, { useState } from 'react';
import { api } from '../api.js';
import { Card, Badge, Loading, Empty, useApi, fmtDay } from '../components/ui.jsx';

const docTypeColor = { doc: 'sky', sheet: 'emerald', 'online-doc': 'violet', form: 'amber', slide: 'rose' };
const docTypeName = { doc: '文档', sheet: '表格', 'online-doc': '在线文档', form: '收集表', slide: '幻灯片' };

function MinutesCard() {
  const [q, setQ] = useState('');
  const [sub, setSub] = useState('');
  const search = useApi(() => api.minutesSearch(sub), [sub]);
  const [openId, setOpenId] = useState(null);
  const detail = useApi(() => (openId ? api.minuteDetail(openId) : Promise.resolve(null)), [openId]);

  return (
    <Card
      title="课堂纪要知识库"
      extra={
        <form
          onSubmit={(e) => { e.preventDefault(); setSub(q); }}
          className="flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜关键词：如 黑客松 / 报价 / 自进化…"
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
          />
          <button className="px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs">检索</button>
        </form>
      }
    >
      <div className="space-y-2 max-h-[520px] overflow-y-auto pt-1">
        {(search.data?.hits || []).map((h) => (
          <div key={h.id} className="border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setOpenId(openId === h.id ? null : h.id)} className="text-sm font-medium text-slate-700 hover:text-primary-600 text-left">
                {h.subject}
              </button>
              {h.lesson_title && <Badge color="primary">{h.lesson_title.slice(0, 14)}</Badge>}
              {openId !== h.id && <Badge color="emerald">{h.length} 字 · 点击展开</Badge>}
              <span className="text-[11px] text-slate-400 ml-auto">{fmtDay(h.start_time)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1.5 line-clamp-2">{h.excerpt}</div>
            {openId === h.id && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                {detail.loading ? <div className="text-xs text-slate-400">加载纪要全文…</div> : (
                  <div>
                    {!!(detail.data?.speakers || []).length && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {detail.data.speakers.map((sp) => <Badge key={sp}>{sp}</Badge>)}
                      </div>
                    )}
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-slate-50 rounded-lg p-3 font-sans">{detail.data?.full_minutes}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {!search.loading && !(search.data?.hits || []).length && <Empty text={sub ? `没有匹配「${sub}」的纪要` : '暂无纪要'} />}
        {search.loading && <div className="text-xs text-slate-400 py-4 text-center">检索中…</div>}
      </div>
    </Card>
  );
}

export default function Courses() {
  const courses = useApi(api.courses);
  const lessons = useApi(api.lessons);
  const meetings = useApi(api.meetings);
  const docs = useApi(api.documents);

  if (courses.loading || lessons.loading || meetings.loading || docs.loading) return <Loading />;
  if (courses.error) return <Empty text={`加载失败：${courses.error}`} />;

  const course = courses.data?.[0];
  const lessonList = lessons.data || [];
  const meetingList = meetings.data || [];
  const docList = docs.data || [];

  return (
    <div className="space-y-6">
      {course && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">{course.name}</h2>
            <Badge color="primary">{course.status}</Badge>
            <Badge>{lessonList.length} 个课次</Badge>
            <Badge>{meetingList.length} 场会议</Badge>
            <span className="text-xs text-slate-400 ml-auto">开课 {fmtDay(course.start_date)}</span>
          </div>
          {course.description && <p className="text-sm text-slate-500 mt-2">{course.description}</p>}
        </div>
      )}

      {/* 课程进度轴 */}
      <Card title="课程进度轴">
        <div className="relative pl-6 pt-2">
          <div className="absolute left-[9px] top-3 bottom-3 w-px bg-slate-200" />
          <div className="space-y-5">
            {lessonList.map((l) => (
              <div key={l.id} className="relative">
                <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-100" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color="primary">第 {l.order_no} 课</Badge>
                  <span className="font-medium text-slate-800 text-sm">{l.title}</span>
                  <span className="text-xs text-slate-400">{fmtDay(l.lesson_date)}</span>
                  {l.meeting_code && <span className="text-[11px] text-slate-400">会议 {l.meeting_code}</span>}
                </div>
                {l.summary && <div className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-3xl">{l.summary}</div>}
              </div>
            ))}
            {!lessonList.length && <Empty />}
          </div>
        </div>
      </Card>

      {/* 课堂纪要知识库（可检索） */}
      <MinutesCard />

      {/* 腾讯文档资料 */}
      <Card title="腾讯文档 · 最近资料" extra={<Badge color="primary">{docList.length} 份</Badge>}>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pt-1">
          {docList.map((d) => (
            <div key={d.id} className="border border-slate-200 rounded-lg p-3 hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-700">{d.title}</span>
                <Badge color={docTypeColor[d.doc_type] || 'slate'}>{docTypeName[d.doc_type] || d.doc_type}</Badge>
                <span className="text-[11px] text-slate-400 ml-auto">
                  {d.owner && `${d.owner} · `}{d.last_viewed}
                </span>
              </div>
              {d.url && (
                <a href={d.url} target="_blank" rel="noreferrer" className="text-[11px] text-primary-600 hover:underline mt-1 inline-block">
                  打开文档 ↗
                </a>
              )}
            </div>
          ))}
          {!docList.length && <Empty text="暂无同步的文档资料" />}
        </div>
      </Card>

      {/* 会议记录 */}
      <Card title="会议记录" extra={<Badge color="sky">{meetingList.length} 场</Badge>}>
        <div className="space-y-2 max-h-[480px] overflow-y-auto pt-1">
          {meetingList.map((m) => (
            <div key={m.id} className="border border-slate-200 rounded-lg p-3 hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-700">{m.subject}</span>
                {m.has_minutes ? <Badge color="emerald">有纪要</Badge> : <Badge>无纪要</Badge>}
                {m.lesson_title && <Badge color="primary">{m.lesson_title.slice(0, 16)}</Badge>}
                <span className="text-[11px] text-slate-400 ml-auto">{fmtDay(m.start_time)} · 会议号 {m.meeting_code}</span>
              </div>
              {m.summary && <div className="text-xs text-slate-500 mt-1.5 line-clamp-2">{m.summary}</div>}
            </div>
          ))}
          {!meetingList.length && <Empty />}
        </div>
      </Card>
    </div>
  );
}
