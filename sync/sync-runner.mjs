/**
 * 同步任务运行器（CLI）：手动或由系统 cron 调用。
 * 服务端内置调度器也会每日自动执行同等逻辑。
 * 运行：npm run sync
 */
import { insert, run, all, get } from '../server/src/db.js';

const started = new Date().toISOString().slice(0, 19).replace('T', ' ');
const logId = insert('syn_log', { job_key: 'daily-import', source_key: 'local-import', started_at: started, status: 'running' });

try {
  const { runImport } = await import('../connectors/local-import/import-training-camp.mjs');
  const r = await runImport();
  run(`UPDATE syn_log SET finished_at=?, status='success', added=?, updated=?, message=? WHERE id=?`,
    new Date().toISOString().slice(0, 19).replace('T', ' '), r.added, r.updated,
    `导入完成：学员 ${r.students} 人，提交 ${r.submissions} 条，愿望 ${r.wishes} 条，会议 ${r.meetings} 条`, logId);
  run(`UPDATE sys_cron_job SET last_run_time=datetime('now','localtime'), last_status='success' WHERE job_key='daily-import'`);
  console.log('✅ 同步完成：', JSON.stringify(r, null, 2));
} catch (e) {
  run(`UPDATE syn_log SET finished_at=?, status='failed', message=? WHERE id=?`,
    new Date().toISOString().slice(0, 19).replace('T', ' '), String(e), logId);
  run(`UPDATE sys_cron_job SET last_run_time=datetime('now','localtime'), last_status='failed' WHERE job_key='daily-import'`);
  console.error('❌ 同步失败：', e);
  process.exit(1);
}
