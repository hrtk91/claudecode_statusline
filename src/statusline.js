#!/usr/bin/env node

// ============================================
// かわいい & カラフル ステータスライン ✨
// 1行目: モデル・ブランチ・コスト
// 2行目: コンテキスト使用率・レートリミット (context関連をまとめて下部に)
// ============================================

const { execSync } = require('child_process');
const path = require('path');

// ANSIエスケープコード
const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  // 前景色 (明るめ)
  pink:    '\x1b[38;5;213m',
  lavender:'\x1b[38;5;183m',
  mint:    '\x1b[38;5;158m',
  peach:   '\x1b[38;5;216m',
  sky:     '\x1b[38;5;117m',
  yellow:  '\x1b[38;5;228m',
  coral:   '\x1b[38;5;210m',
  lilac:   '\x1b[38;5;147m',
  white:   '\x1b[38;5;255m',
  gray:    '\x1b[38;5;245m',
};

let inputData = '';
process.stdin.on('data', (chunk) => { inputData += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(inputData);
    displayStatusLine(data);
  } catch {
    process.stdout.write(`✨ ${path.basename(process.cwd())}\n`);
  }
});

// モデル名を短く可愛くする + effort表示
function getModel(data) {
  if (!data.model) return null;
  const name = data.model.display_name || data.model.id || '';
  // "Claude 3.5 Sonnet" → "Sonnet 3.5" 等に短縮
  const m = name.match(/Claude\s+([\d.]+)\s+(\w+)/i);
  let shortName = m ? `${m[2]} ${m[1]}` : name;
  // effort level があれば付与 (例: "Opus 4.6(high)")
  if (data.model.reasoning_effort) {
    shortName += `${c.gray}(${data.model.reasoning_effort})${c.pink}`;
  }
  return shortName;
}

// gitブランチ取得
function getBranch() {
  try {
    return execSync('git -C "$(pwd)" rev-parse --abbrev-ref HEAD 2>/dev/null', { encoding: 'utf8', stdio: ['pipe','pipe','ignore'] }).trim();
  } catch {
    return null;
  }
}

// コンテキスト使用率をハート絵文字バーで表示
// 🤍🤍🤍🤍🤍 (0-20%) → 💜🤍🤍🤍🤍 (20-40%) → etc.
function getContextBar(data) {
  if (!data.context_window) return null;
  const used = data.context_window.used_percentage ?? null;
  if (used === null) return null;

  const filled = Math.round(used / 20); // 0〜5
  const bar = pctToBar(used, filled);
  const pctStr = `${Math.round(used)}%`;
  return `${c.lilac}cx${c.reset} ${bar} ${c.gray}${pctStr}${c.reset}`;
}

// コスト表示
function getCost(data) {
  if (data.cost && data.cost.total_cost_usd > 0) {
    return `${c.yellow}$${data.cost.total_cost_usd.toFixed(4)}${c.reset}`;
  }
  return null;
}

// レートリミットの生パーツ(装飾なし、joinしていない状態)を返す
function getRateLimitsRaw(data) {
  if (!data.rate_limits) return null;
  const rl = data.rate_limits;
  const parts = [];

  if (rl.five_hour) {
    const pct = rl.five_hour.used_percentage ?? 0;
    const bar = pctToBar(pct);
    const pctStr = `${c.gray}${Math.round(pct)}%${c.reset}`;
    const reset = rl.five_hour.resets_at ? ` ${c.gray}(${formatReset(rl.five_hour.resets_at)})${c.reset}` : '';
    parts.push(`${c.sky}5h${c.reset} ${bar} ${pctStr}${reset}`);
  }

  if (rl.seven_day) {
    const pct = rl.seven_day.used_percentage ?? 0;
    const bar = pctToBar(pct);
    const pctStr = `${c.gray}${Math.round(pct)}%${c.reset}`;
    const reset = rl.seven_day.resets_at ? ` ${c.gray}(${formatReset(rl.seven_day.resets_at)})${c.reset}` : '';
    parts.push(`${c.lavender}7d${c.reset} ${bar} ${pctStr}${reset}`);
  }

  if (parts.length === 0) return null;
  return parts.join(`  ${c.gray}·${c.reset}  `);
}

// 後方互換のため残しておく(現在は未使用)
function getRateLimits(data) {
  const raw = getRateLimitsRaw(data);
  if (!raw) return null;
  return `${c.dim}┗${c.reset} ` + raw;
}

// 使用率を横長バーに変換 (▰=使用済み, ▱=残り)
function pctToBar(pct, filled) {
  if (filled === undefined) filled = Math.round(pct / 20);
  let barColor = c.mint;
  if (pct >= 80) barColor = c.coral;
  else if (pct >= 60) barColor = c.peach;
  else if (pct >= 40) barColor = c.yellow;
  return `${barColor}${'▰'.repeat(filled)}${c.gray}${'▱'.repeat(5 - filled)}${c.reset}`;
}

function formatReset(epochSec) {
  const d = new Date(epochSec * 1000);
  const now = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  // 日付が今日と異なる場合は MM/DD を先頭に付ける
  const sameDay = d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
  if (!sameDay) {
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `~${mo}/${day} ${h}:${min}`;
  }
  return `~${h}:${min}`;
}

function displayStatusLine(data) {
  const sep = `${c.gray} · ${c.reset}`;
  const line1Parts = [];

  // 🌸 モデル名
  const model = getModel(data);
  if (model) line1Parts.push(`${c.pink}${model}${c.reset}`);

  // 🌿 gitブランチ
  const branch = getBranch();
  if (branch) line1Parts.push(`${c.mint}${branch}${c.reset}`);

  // 💰 コスト
  const cost = getCost(data);
  if (cost) line1Parts.push(cost);

  const line1 = line1Parts.join(sep);

  // 2行目: コンテキスト使用率 + レートリミット (context関連をまとめて下部に)
  const line2Parts = [];

  const ctxBar = getContextBar(data);
  if (ctxBar) line2Parts.push(ctxBar);

  // レートリミットをコンテキスト情報と同じ行にまとめて表示する
  const rawRateLimits = getRateLimitsRaw(data);
  if (rawRateLimits) line2Parts.push(rawRateLimits);

  if (line2Parts.length > 0) {
    const line2 = `${c.dim}┗${c.reset} ` + line2Parts.join(`  ${c.gray}·${c.reset}  `);
    process.stdout.write(`${line1}\n${line2}\n`);
  } else {
    process.stdout.write(`${line1}\n`);
  }
}
