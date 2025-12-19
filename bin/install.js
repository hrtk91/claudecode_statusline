#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const STATUSLINE_DEST = path.join(CLAUDE_DIR, 'statusline.js');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');

const STATUSLINE_SRC = path.join(__dirname, '..', 'src', 'statusline.js');

function log(message) {
  console.log(`\x1b[36m[claudecode-statusline]\x1b[0m ${message}`);
}

function success(message) {
  console.log(`\x1b[32m✔\x1b[0m ${message}`);
}

function error(message) {
  console.error(`\x1b[31m✖\x1b[0m ${message}`);
}

function ensureClaudeDir() {
  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
    log(`Created directory: ${CLAUDE_DIR}`);
  }
}

function copyStatuslineScript() {
  fs.copyFileSync(STATUSLINE_SRC, STATUSLINE_DEST);
  success(`Installed statusline.js to ${STATUSLINE_DEST}`);
}

function updateSettings() {
  let settings = {};

  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      const content = fs.readFileSync(SETTINGS_PATH, 'utf8');
      settings = JSON.parse(content);
      log('Found existing settings.json, merging configuration...');
    } catch (e) {
      log('Could not parse existing settings.json, creating new one...');
    }
  }

  const statusLineConfig = {
    type: 'command',
    command: `node ${STATUSLINE_DEST}`
  };

  settings.statusLine = statusLineConfig;

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
  success(`Updated settings.json with statusLine configuration`);
}

function showUsageInfo() {
  console.log('');
  console.log('\x1b[1m=== Installation Complete ===\x1b[0m');
  console.log('');
  console.log('Claude Codeを再起動すると、カスタムステータスラインが表示されます。');
  console.log('');
  console.log('\x1b[1mステータスラインの例:\x1b[0m');
  console.log('🤖 Sonnet 4.5 │ 📝 default │ 📁 myproject │ 🎫 ████░░░░░░ 150.2K (25%) │ 📊 +42/-15 │ ⏱️ 12m │ 💰 $0.0234');
  console.log('');
  console.log('\x1b[1mカスタマイズ:\x1b[0m');
  console.log(`  ${STATUSLINE_DEST} を編集してください。`);
  console.log('');
}

function main() {
  console.log('');
  console.log('\x1b[1m🚀 Claude Code Statusline Installer\x1b[0m');
  console.log('');

  try {
    ensureClaudeDir();
    copyStatuslineScript();
    updateSettings();
    showUsageInfo();
  } catch (e) {
    error(`Installation failed: ${e.message}`);
    process.exit(1);
  }
}

main();
