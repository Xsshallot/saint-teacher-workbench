#!/usr/bin/env node
/**
 * Skill B 生成器（CLI）：调用工作台 /api/skill-b 接口，
 * 把生成的「工作台专属 Skill」写入 skills/skill-b/generated/SKILL.md
 *
 * 用法：npm run skill-b   或   node skills/skill-b/generate.mjs [baseUrl]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'generated', 'SKILL.md');
const base = process.argv[2] || process.env.SAINT_BASE || `http://localhost:${process.env.PORT || 8787}`;

const res = await fetch(`${base}/api/skill-b`);
if (!res.ok) {
  console.error(`无法访问工作台（${base}/api/skill-b，HTTP ${res.status}）。请先 npm start 启动服务。`);
  process.exit(1);
}
const md = await res.text();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md, 'utf8');
console.log(`✅ Skill B 已生成：${OUT}`);
console.log(`   把这份 SKILL.md 挂载到任何 AI 智能体，即可用自然语言查询工作台数据。`);
