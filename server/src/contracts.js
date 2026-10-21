/**
 * 数据契约加载器：读取 docs/contracts/*.schema.json 并汇总返回。
 * 连接器写入、网站渲染、Skill B 讲解共用同一契约。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACT_DIR = path.resolve(__dirname, '..', '..', 'docs', 'contracts');

export function contracts() {
  const out = {};
  if (!fs.existsSync(CONTRACT_DIR)) return out;
  for (const f of fs.readdirSync(CONTRACT_DIR).filter((x) => x.endsWith('.schema.json'))) {
    const name = f.replace('.schema.json', '');
    out[name] = JSON.parse(fs.readFileSync(path.join(CONTRACT_DIR, f), 'utf8'));
  }
  return out;
}
