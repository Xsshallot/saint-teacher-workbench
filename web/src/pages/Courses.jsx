import React from 'react';
import { api } from '../api.js';
import { Card, Badge, Loading, Empty, useApi, fmtDay } from '../components/ui.jsx';

export default function Courses() {
  const courses = useApi(api.courses);
  const lessons = useApi(api.lessons);
  const meetings = useApi(api.meetings);

  if (courses.loading || lessons.loading || meetings.loading) return <Loading />;
  if (courses.error) return <Empty text={`加载失败：${courses.error}`} />;

  const course = courses.data?.[0];
  const lessonList = lessons.data || [];
  const meetingList = meetings.data || [];

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
