import test from 'node:test';
import assert from 'node:assert/strict';
import { progressFor, starsFor, adventures } from '../dist/adventures.js';
test('故事输入按正确前缀显示推进，并避免错误输入冒领奖励',()=>{
  assert.deepEqual(progressFor('春天来了','春天好'),{correctPrefix:2,total:4,percent:50});
});
test('空内容不产生虚假进度',()=>assert.deepEqual(progressFor('',''),{correctPrefix:0,total:0,percent:0}));
test('星星依据准确率分档，未达基本目标不颁发星星',()=>{
 assert.equal(starsFor(100),3);assert.equal(starsFor(85),2);assert.equal(starsFor(60),1);assert.equal(starsFor(10),0);
});
test('每个故事世界都有可玩的剧情关卡',()=>{
 assert.equal(Object.keys(adventures).length,3);
 for(const world of Object.values(adventures)) {assert.ok(world.episodes.length>=2);for(const item of world.episodes) assert.ok(item.target.length>4)}
});
