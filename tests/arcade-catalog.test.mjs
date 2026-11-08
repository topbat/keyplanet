import test from 'node:test';
import assert from 'node:assert/strict';
import { gameCollections, arcadeGames, getArcadeGame } from '../dist/arcade-catalog.js';

test('两组各有十个可自由选择的游戏', () => {
  assert.equal(gameCollections.length,2);
  assert.equal(arcadeGames.length,20);
  for(const collection of gameCollections) assert.equal(arcadeGames.filter(g=>g.collection===collection.id).length,10);
});
test('每个游戏使用已实现的机制并具备独立主题描述', () => {
  const scenes = new Set(['race','slice','target','build','memory']);
  assert.equal(new Set(arcadeGames.map(g=>g.id)).size,20);
  for(const item of arcadeGames){assert.ok(scenes.has(item.scene));assert.ok(item.name && item.icon && item.description && item.action);assert.equal(getArcadeGame(item.id),item)}
  assert.equal(getArcadeGame('not-a-game'),undefined);
});
test('记忆玩法定义明确的展示时长',()=>{
 for(const item of arcadeGames.filter(g=>g.scene==='memory')) assert.equal(item.previewMs,2500);
});
