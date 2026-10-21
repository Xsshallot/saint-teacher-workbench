import React, { useState } from 'react';
import { api } from '../api.js';
import { Badge, Card, Loading, Empty, useApi, fmtDate } from '../components/ui.jsx';

const statusColor = { 已连接: 'emerald', 未配置: 'slate', 异常: 'rose' };

export default function Settings() {
  const { loading, data, error, reload } = useApi(api.syncStatus);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');

  const runSync = async () => {
    setRunning(true);
    setRunMsg('');
    try {
      const r = await api.syncRun();
      setRunMsg(`同步完成：学员 ${r.students} 人，提交 ${r.submissions} 条，愿望 ${r.wishes} 条，会议 ${r.meetings} 条（${r.elapsed_ms} ms）`);
      reload();
    } catch (e) {
      setRunMsg(`同步失败：${e}`);
    }
    setRunning(false);
  };

  if (loading) return <Loading />;
  if (error) return <Empty text={`加载失败：${error}`} />;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 数据源 */}
      <Card title="数据源与连接器">
        <div className="space-y-2.5 pt-1">
          {data.sources.map((s) => (
            <div key={s.source_key} className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700">{s.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{s.source_key} · {s.type}</div>
              </div>
              <Badge color={statusColor[s.status] || 'slate'}>{s.status}</Badge>
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-400 mt-3 leading-relaxed">
          v0.1 已内置「本地导入」连接器；腾讯问卷 / 腾讯文档 / 腾讯会议 / 飞书连接器为预留接口，按
          <code className="mx-1 px-1 bg-slate-100 rounded">connectors/</code>
          目录规范扩展。
        </div>
      </Card>

      {/* 同步任务 */}
      <Card
        title="同步任务"
        extra={
          <button
            onClick={runSync}
            disabled={running}
            className="px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-xs font-medium transition-colors"
          >
            {running ? '同步中…' : '立即同步'}
          </button>
        }
      >
        {runMsg && <div className="mb-3 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600">{runMsg}</div>}
        {data.jobs.map((j) => (
          <div key={j.job_key} className="border border-slate-200 rounded-lg px-4 py-3 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-slate-700">{j.job_name}</span>
              <code className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{j.cron_expr}</code>
              <Badge color={j.enabled ? 'emerald' : 'slate'}>{j.enabled ? '启用' : '停用'}</Badge>
              <span className="text-[11px] text-slate-400 ml-auto">上次：{fmtDate(j.last_run_time) || '未运行'} {j.last_status && `· ${j.last_status}`}</span>
            </div>
            {!!j.logs.length && (
              <div className="mt-2 space-y-1">
                {j.logs.map((l) => (
                  <div key={l.id} className="text-[11px] text-slate-400 flex gap-2">
                    <span className={l.status === 'success' ? 'text-emerald-500' : l.status === 'failed' ? 'text-rose-500' : ''}>●</span>
                    <span>{fmtDate(l.started_at)}</span>
                    <span>{l.status}</span>
                    {l.message && <span className="truncate max-w-md">{l.message}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Skill B */}
      <Card title="工作台专属 Skill（Skill B）">
        <div className="text-sm text-slate-600 leading-relaxed">
          部署完成后，系统可自动生成这个工作台的专属 Skill 文档。把它挂到任何 AI 智能体（ZCode 等），
          即可用自然语言查询工作台数据：<em>"最近学员怎么样？""下节课备什么？"</em>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <a
            href="/api/skill-b"
            target="_blank"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            查看 / 下载 Skill B 文档
          </a>
          <a
            href="/api/contract"
            target="_blank"
            className="px-4 py-2 rounded-lg border border-slate-300 hover:border-primary-300 text-slate-600 text-xs font-medium transition-colors"
          >
            查看数据契约
          </a>
        </div>
        <div className="text-[11px] text-slate-400 mt-3">
          API 只读、无写接口；学员数据仅存于本机 data/saint.db，仓库 .gitignore 已隔离真实数据。
        </div>
      </Card>
    </div>
  );
}
