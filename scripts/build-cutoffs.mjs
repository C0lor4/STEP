/**
 * 把 public/downloads/stats/ 下逐年逐卷的 JSON，合并成一个
 * public/downloads/stats/cutoffs.json 索引。
 *
 * 首页趋势图原本要发 26 x 3 = 78 个请求，只为了读每个文件里的
 * gradeCutoffs 字段（bins 全部丢弃）。合并后首页只需要 1 个请求。
 *
 * 用法：
 *   node scripts/build-cutoffs.mjs
 *
 * 每次新增/更新 stats 数据后跑一次即可。
 * 索引文件不存在时前端会自动回退到逐个拉取，所以忘了跑也不会白屏。
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const STATS_DIR = join(process.cwd(), 'public', 'downloads', 'stats');
const OUTPUT_FILE = join(STATS_DIR, 'cutoffs.json');
const FILE_PATTERN = /^(\d{4})_(I|II|III)\.json$/;
const GRADE_KEYS = ['S', '1', '2', '3'];

const readGradeCutoffs = (value) => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const parsed = {};
  for (const key of GRADE_KEYS) {
    if (typeof value[key] === 'number') {
      parsed[key] = value[key];
    }
  }

  return Object.keys(parsed).length > 0 ? parsed : null;
};

const main = async () => {
  const entries = await readdir(STATS_DIR);
  const index = {};
  const jsonKeys = new Set();
  const pngKeys = new Set();
  let matched = 0;
  let withCutoffs = 0;

  for (const name of entries) {
    const png = /^(\d{4})_(I|II|III)\.png$/.exec(name);
    if (png) {
      pngKeys.add(`${png[1]}_${png[2]}`);
    }
  }

  for (const name of entries.sort()) {
    const match = FILE_PATTERN.exec(name);
    if (!match) {
      continue;
    }

    const [, year, step] = match;
    matched += 1;
    jsonKeys.add(`${year}_${step}`);

    let parsed;
    try {
      parsed = JSON.parse(await readFile(join(STATS_DIR, name), 'utf8'));
    } catch (error) {
      console.warn(`跳过 ${name}：JSON 解析失败 (${error.message})`);
      continue;
    }

    if (!Array.isArray(parsed)) {
      console.warn(`跳过 ${name}：顶层不是数组`);
      continue;
    }

    // 与前端 loadScoreDistribution 一致：分数线放在数组第一项
    const cutoffs = readGradeCutoffs(parsed[0]);
    if (cutoffs) {
      withCutoffs += 1;
    } else {
      console.warn(`注意 ${name}：没读到 gradeCutoffs`);
    }

    index[year] ??= {};
    index[year][step] = cutoffs;
  }

  await writeFile(OUTPUT_FILE, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  console.log(`扫描 ${matched} 个 JSON，其中 ${withCutoffs} 个含分数线`);
  console.log(`已写入 ${OUTPUT_FILE}`);

  // 有截图但还没转成 JSON 的，提醒一下（这些年份不会出现在趋势图里）
  const pending = [...pngKeys].filter((key) => !jsonKeys.has(key)).sort();
  if (pending.length > 0) {
    console.log(`\n有 PNG 但缺 JSON（趋势图会少这些点）：${pending.join(', ')}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
