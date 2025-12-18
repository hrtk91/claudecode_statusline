#!/usr/bin/env node

const path = require('path');

// Read JSON from stdin
let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(inputData);

    // DEBUG: Write to file to see all available data
    const fs = require('fs');
    const debugPath = require('path').join(require('os').homedir(), '.claude', 'statusline-debug.json');
    fs.writeFileSync(debugPath, JSON.stringify(data, null, 2), 'utf8');

    displayStatusLine(data);
  } catch (error) {
    // Fallback if JSON parsing fails
    console.log('📁 ' + path.basename(process.cwd()));
  }
});

// ============================================
// Display order configuration
// ============================================
const DISPLAY_ORDER = [
  'model',
  'outputStyle',
  'directory',
  'tokens',
  'codeStats',
  'sessionTime',
  'cost'
];

// ============================================
// UI Component Functions
// ============================================

function getOutputStyle(data) {
  if (data.output_style && data.output_style.name) {
    const styleName = data.output_style.name === 'default' ? 'default' : data.output_style.name;
    return `📝 ${styleName}`;
  }
  return null;
}

function getDirectory(data) {
  const currentDir = data.workspace?.current_dir || data.cwd || process.cwd();
  const projectDir = data.workspace?.project_dir;

  if (projectDir && currentDir !== projectDir) {
    // Show both if different
    const shortProject = path.basename(projectDir);
    const shortCwd = path.basename(currentDir);
    return `📦 ${shortProject} → 📁 ${shortCwd}`;
  } else {
    // Show only current dir
    const shortCwd = path.basename(currentDir);
    return `📁 ${shortCwd}`;
  }
}

function getTokens(data) {
  if (!data.context_window) return null;

  const ctx = data.context_window;
  const currentUsage = ctx.current_usage || {};

  // Calculate total context window consumption
  // Note: output_tokens do NOT count against context window
  const totalUsed =
    (currentUsage.input_tokens || 0) +
    (currentUsage.cache_creation_input_tokens || 0) +
    (currentUsage.cache_read_input_tokens || 0);

  const windowSize = ctx.context_window_size || 200000;
  const remaining = windowSize - totalUsed;
  const usagePercentage = (totalUsed / windowSize) * 100;

  // Create progress bar (shorter, 10 chars)
  const progressBar = createProgressBar(usagePercentage, 10);

  // Format numbers
  const remainingStr = formatTokens(remaining);
  const percentStr = Math.round(usagePercentage);

  return `🎫 ${progressBar} ${remainingStr} (${percentStr}%)`;
}

function getModel(data) {
  if (data.model) {
    return `🤖 ${data.model.display_name || data.model.id}`;
  }
  return null;
}

function getCost(data) {
  if (data.cost && data.cost.total_cost_usd > 0) {
    const costStr = `$${data.cost.total_cost_usd.toFixed(4)}`;
    return `💰 ${costStr}`;
  }
  return null;
}

function getCodeStats(data) {
  if (!data.cost) return null;

  const added = data.cost.total_lines_added || 0;
  const removed = data.cost.total_lines_removed || 0;

  // Only show if there are changes
  if (added === 0 && removed === 0) return null;

  return `📊 +${added}/-${removed}`;
}

function getSessionTime(data) {
  if (!data.cost || !data.cost.total_duration_ms) return null;

  const ms = data.cost.total_duration_ms;
  const totalMinutes = Math.floor(ms / 60000);

  if (totalMinutes < 60) {
    return `⏱️ ${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `⏱️ ${hours}h ${minutes}m`;
}

// ============================================
// Main Display Function
// ============================================

const COMPONENT_MAP = {
  outputStyle: getOutputStyle,
  directory: getDirectory,
  tokens: getTokens,
  model: getModel,
  cost: getCost,
  codeStats: getCodeStats,
  sessionTime: getSessionTime
};

function displayStatusLine(data) {
  const parts = [];

  // Build status line based on display order
  for (const componentName of DISPLAY_ORDER) {
    const componentFunc = COMPONENT_MAP[componentName];
    if (componentFunc) {
      const result = componentFunc(data);
      if (result) {
        parts.push(result);
      }
    }
  }

  // Output status line
  console.log(parts.join(' │ '));
}

function createProgressBar(percentage, width = 20) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  // Color based on usage
  let fillChar = '█';
  if (percentage > 80) {
    fillChar = '█'; // Keep it simple, terminal colors vary
  }

  const bar = fillChar.repeat(filled) + '░'.repeat(empty);
  return bar;
}

function formatTokens(tokens) {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}
