# Claude Code Status Line

Claude Codeのステータスラインをカスタマイズするためのスクリプトです。

## 機能

以下の情報をステータスラインに表示します:

- モデル名
- 出力スタイル
- ディレクトリ情報
- トークン使用状況（プログレスバー付き）
- コード変更統計（追加/削除行数）
- セッション時間
- コスト

## インストール

### 1. ファイルの配置

以下のファイルを `%USERPROFILE%\.claude\` 直下に配置してください:

**Windows:**
```
%USERPROFILE%\.claude\statusline.js
%USERPROFILE%\.claude\settings.json
```

**macOS/Linux:**
```
~/.claude/statusline.js
~/.claude/settings.json
```

### 2. 配置手順

```bash
# Windowsの場合
copy statusline.js %USERPROFILE%\.claude\
copy settings.json %USERPROFILE%\.claude\

# macOS/Linuxの場合
cp statusline.js ~/.claude/
cp settings.json ~/.claude/
```

### 3. settings.jsonの確認

`settings.json`のパスが正しいことを確認してください:

**Windows:**
```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:\\Users\\ht912\\.claude\\statusline.js"
  }
}
```

**macOS/Linux:**
```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline.js"
  }
}
```

ユーザー名の部分は環境に合わせて変更してください。

## カスタマイズ

### 表示項目の順序変更

`statusline.js`の`DISPLAY_ORDER`配列を編集することで、表示順序を変更できます:

```javascript
const DISPLAY_ORDER = [
  'model',
  'outputStyle',
  'directory',
  'tokens',
  'codeStats',
  'sessionTime',
  'cost'
];
```

不要な項目は配列から削除してください。

### デバッグ

利用可能なデータを確認するには、`%USERPROFILE%\.claude\statusline-debug.json`を参照してください。このファイルは自動的に生成されます。

## 動作確認

Claude Codeを起動すると、ステータスラインにカスタム情報が表示されます。

例:
```
🤖 Sonnet 4.5 │ 📝 default │ 📁 myproject │ 🎫 ████░░░░░░ 150.2K (25%) │ 📊 +42/-15 │ ⏱️ 12m │ 💰 $0.0234
```
