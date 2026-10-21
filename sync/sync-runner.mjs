/**
 * 同步任务运行器（CLI）：手动或由系统 cron 调用。
 * 服务端内置调度器也会每日自动执行同等逻辑。
 * 依次执行：local-import（存量采集数据）→ tencent-import（腾讯系连接器数据）
 * 运行：npm run sync
 */
import { insert, run, cnNow } from '../server/src/db.js';

// 统一中国时间（Asia/Shanghai）
const now = () => cnNow();

async function runJob(jobKey, sourceKey, importPath, label) {
  const logId = insert('syn_log', { job_key: jobKey, source_key: sourceKey, started_at: now(), status: 'running' });
  try {
    const { runImport } = await import(importPath);
    const r = await runImport();
    run(`UPDATE syn_log SET finished_at=?, status='success', added=?, updated=?, message=? WHERE id=?`,
      now(), r.added ?? 0, r.updated ?? 0, `${label}完成：${JSON.stringify(r)}`, logId);
    run(`UPDATE sys_cron_job SET last_run_time=?, last_status='success' WHERE job_key=?`, now(), jobKey);
    console.log(`✅ ${label}：`, JSON.stringify(r));
    return r;
  } catch (e) {
    run(`UPDATE syn_log SET finished_at=?, status='failed', message=? WHERE id=?`, now(), String(e), logId);
    run(`UPDATE sys_cron_job SET last_run_time=?, last_status='failed' WHERE job_key=?`, now(), jobKey);
    console.error(`❌ ${label}失败：`, e);
    return { error: String(e) };
  }
}

const r1 = await runJob('daily-import', 'local-import',
  '../connectors/local-import/import-training-camp.mjs', '本地导入（训练营采集数据）');
const r2 = await runJob('tencent-sync', 'tencent-import',
  '../connectors/tencent-import/import-tencent.mjs', '腾讯连接器同步（问卷/会议/文档）');

if (r1.error || r2.error) process.exit(1);
