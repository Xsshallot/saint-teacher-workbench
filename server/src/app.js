/**
 * SAINT 服务端入口：HTTP 服务（API + 静态托管 web/dist）+ 内置每日同步调度
 * 零 npm 依赖：node:http + node:sqlite
 * 启动：npm start  （即 node --experimental-sqlite server/src/app.js）
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi, PORT } from './routes.js';
import { all, get, run, insert } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', '..', 'web', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function serveStatic(res, urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(DIST, p);
  if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
    return;
  }
  // SPA 回退
  const index = path.join(DIST, 'index.html');
  if (fs.existsSync(index)) {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    fs.createReadStream(index).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>SAINT · 超级教师工作台</h1><p>API 已运行，但前端尚未构建。</p><p>请执行 <code>npm run build</code>，或使用 <code>npm run dev:web</code> 开发模式。</p><p><a href="/api/health">/api/health</a></p>`);
  }
}

// ---------- 初始化系统配置 ----------
function ensureDefaults() {
  const d = [
    ['teacher_name', '恒', '教师名称'],
    ['base_url', `http://localhost:${PORT}`, '工作台地址'],
    ['sync_hour', '6', '每日同步时间（点）'],
  ];
  for (const [k, v, remark] of d) {
    if (!get(`SELECT id FROM sys_config WHERE config_key=?`, k)) insert('sys_config', { config_key: k, config_value: v, remark });
  }
  const jobs = [
    ['daily-import', '每日增量同步（本地导入连接器）', '0 6 * * *'],
  ];
  for (const [key, name, cron] of jobs) {
    if (!get(`SELECT id FROM sys_cron_job WHERE job_key=?`, key)) insert('sys_cron_job', { job_key: key, job_name: name, cron_expr: cron, enabled: 1 });
  }
  const sources = [
    ['local-import', '本地导入（训练营采集数据）', '本地导入', '已连接', { dir: 'data/raw' }],
    ['tencent-survey', '腾讯问卷', '问卷', '未配置', {}],
    ['tencent-docs', '腾讯文档', '文档', '未配置', {}],
    ['tencent-meeting', '腾讯会议', '会议', '未配置', {}],
    ['feishu', '飞书（兼容渠道）', '问卷/文档', '未配置', {}],
  ];
  for (const [key, name, type, status, config] of sources) {
    if (!get(`SELECT id FROM syn_source WHERE source_key=?`, key)) insert('syn_source', { source_key: key, name, type, status, config });
  }
}

// ---------- 内置调度器：每日到点自动跑同步 ----------
function startScheduler() {
  setInterval(async () => {
    try {
      const job = get(`SELECT * FROM sys_cron_job WHERE job_key='daily-import' AND enabled=1 AND is_deleted=0`);
      if (!job) return;
      const hour = Number(get(`SELECT config_value AS v FROM sys_config WHERE config_key='sync_hour'`)?.v || 6);
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      const last = (job.last_run_time || '').slice(0, 10);
      if (now.getHours() >= hour && last !== todayKey) {
        console.log(`[scheduler] 触发每日同步 daily-import …`);
        await fetch(`http://localhost:${PORT}/api/sync/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
          .then((r) => r.json())
          .then((j) => console.log('[scheduler] 同步完成', JSON.stringify(j.data || j.error)))
          .catch((e) => console.warn('[scheduler] 同步失败', String(e)));
      }
    } catch (e) { /* 调度失败不影响服务 */ }
  }, 60_000).unref?.();
}

ensureDefaults();
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = u.pathname;
  if (pathname.startsWith('/api/')) {
    const query = Object.fromEntries(u.searchParams.entries());
    await handleApi(req, res, pathname.replace(/\/+$/, ''), query);
  } else {
    serveStatic(res, pathname);
  }
});
server.listen(PORT, () => {
  console.log(`SAINT · 超级教师工作台已启动`);
  console.log(`  本地地址:  http://localhost:${PORT}`);
  console.log(`  健康检查:  http://localhost:${PORT}/api/health`);
  console.log(`  Skill B :  http://localhost:${PORT}/api/skill-b`);
  console.log(`  数据库  :  data/saint.db`);
});
startScheduler();
