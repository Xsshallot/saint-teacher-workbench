/**
 * SAINT 数据层：node:sqlite（Node >= 22.5，零 npm 依赖）
 * 统一入口：open / all / get / run / insert / update
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..', '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const DB_PATH = process.env.SAINT_DB || path.join(DATA_DIR, 'saint.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// 轻量迁移：为已存在的旧库补列（幂等）
try { db.exec(`ALTER TABLE asg_followup ADD COLUMN source TEXT DEFAULT 'local-import'`); } catch { /* 列已存在 */ }

const plain = (r) => (r === undefined || r === null ? undefined : JSON.parse(JSON.stringify(r)));

export function all(sql, ...args) {
  return db.prepare(sql).all(...args).map(plain);
}
export function get(sql, ...args) {
  return plain(db.prepare(sql).get(...args));
}
export function run(sql, ...args) {
  return db.prepare(sql).run(...args);
}
/** 通用插入：obj 的键为列名，返回 lastInsertRowid */
export function insert(table, obj) {
  const keys = Object.keys(obj);
  const vals = keys.map((k) => {
    const v = obj[k];
    return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
  });
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
  const r = db.prepare(sql).run(...vals);
  return Number(r.lastInsertRowid);
}
/** 通用更新：按 id 更新给定字段 */
export function update(table, id, obj) {
  const keys = Object.keys(obj);
  const vals = keys.map((k) => {
    const v = obj[k];
    return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
  });
  vals.push(id);
  db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(',')} WHERE id=?`).run(...vals);
}
/** 解析 JSON 列（容错） */
export function J(v, fallback = []) {
  if (v === null || v === undefined || v === '') return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}
export { db };
