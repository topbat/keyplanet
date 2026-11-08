import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreAttempt, adviceFor, nextLevel } from '../dist/engine.js';

test('完整且正确的练习按字符计算准确率和速度', () => {
  assert.deepEqual(scoreAttempt('abcd', 'abcd', 60, 1), {accuracy: 100, speed: 4, correct: 4, total: 4});
});
test('错误输入计入准确率且速度不为负数', () => {
  assert.deepEqual(scoreAttempt('abcd', 'abxd', 30, 5), {accuracy: 75, speed: 6, correct: 3, total: 4});
});
test('建议依据表现变化', () => {
  assert.match(adviceFor({accuracy: 65}), /准确/);
  assert.match(adviceFor({accuracy: 98}), /稳定/);
});
test('课程顺序循环，末关不越界', () => {
  assert.equal(nextLevel(0, 3), 1);
  assert.equal(nextLevel(2, 3), 0);
});
