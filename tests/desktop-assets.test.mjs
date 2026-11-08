import assert from 'node:assert/strict';
import test from 'node:test';
import assets from '../desktop/assets.cjs';

test('桌面端从同一个本地来源加载首页和脚本', () => {
  assert.equal(assets.assetName('keyplanet://app/'), 'index.html');
  assert.equal(assets.assetName('keyplanet://app/arcade-play.js'), 'arcade-play.js');
});

test('桌面协议拒绝其他来源、路径穿越和非网页资源', () => {
  for (const url of [
    'https://app/index.html',
    'keyplanet://other/index.html',
    'keyplanet://app:1234/index.html',
    'keyplanet://user@app/index.html',
    'keyplanet://app/..%2fpackage.json',
    'keyplanet://app/..%5capp.js',
    'keyplanet://app/package.json',
    'keyplanet://app/app.js:stream.js',
  ]) {
    assert.equal(assets.assetName(url), null, url);
  }
});
