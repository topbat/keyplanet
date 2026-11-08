import assert from 'node:assert/strict';
import test from 'node:test';
import { releaseNotes } from '../scripts/release-notes.mjs';

const entry = '## [0.2.0] - 2026-11-09\n\n### 新增\n\n- 增加 Windows 安装包。';
const history = `# 修改历史\n\n${entry}\n\n## [0.1.0] - 2026-11-08\n\n- 首次发布。\n`;

test('Release 正文只提取目标版本的中文修改历史', () => {
  assert.equal(releaseNotes(history, '0.2.0'), `${entry}\n`);
});

test('缺少、重复或没有中文条目的版本不能发布', () => {
  assert.throws(() => releaseNotes(history, '0.3.0'), /唯一/);
  assert.throws(() => releaseNotes(`${history}\n${entry}`, '0.2.0'), /唯一/);
  assert.throws(() => releaseNotes(entry.replace('增加 Windows 安装包。', 'Added Windows installer.'), '0.2.0'), /中文/);
  assert.throws(() => releaseNotes(entry.replace('- 增加 Windows 安装包。', ''), '0.2.0'), /中文/);
});
