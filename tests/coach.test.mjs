import test from 'node:test';
import assert from 'node:assert/strict';
import { getCoachFeedback } from '../dist/coach.js';

test('没有记录时推荐从键盘入门，并明确为本地规则反馈', () => {
 const result = getCoachFeedback([]);
 assert.equal(result.recommendation.route, 'keyboard');
 assert.match(result.mode, /本地.*规则/);
 assert.equal(result.dataPoints, 0);
});
test('反馈基于最近练习路线，不比较不同路线的准确率', () => {
 const result = getCoachFeedback([
  {route:'pinyin',accuracy:60}, {route:'keyboard',accuracy:25}, {route:'pinyin',accuracy:70}, {route:'wubi',accuracy:92}
 ]);
 assert.equal(result.recommendation.route,'pinyin');
 assert.match(result.observation,/65%/);
 assert.match(result.observation,/最终文本准确率/);
 assert.equal(result.dataPoints,4);
});
test('键盘考核与文本练习不混算，且按当前口径明确标注', () => {
 const result = getCoachFeedback([
  {route:'keyboard',metric:'key-press',accuracy:50},
  {route:'keyboard',metric:'final-text',accuracy:100},
  {route:'keyboard',accuracy:100},
  {route:'keyboard',metric:'key-press',accuracy:70}
 ]);
 assert.match(result.observation,/按键正确率/);
 assert.match(result.observation,/60%/);
 assert.doesNotMatch(result.memory,/相比/);
});
test('同路线同口径足够时才对比新旧表现，旧记录默认最终文本口径', () => {
 const result = getCoachFeedback([
  {route:'wubi',accuracy:90}, {route:'wubi',metric:'key-press',accuracy:0},
  {route:'wubi',metric:'final-text',accuracy:90}, {route:'wubi',accuracy:70}, {route:'wubi',accuracy:70}
 ]);
 assert.match(result.memory,/最终文本准确率/);
 assert.match(result.memory,/提高了 20 个百分点/);
});
test('键盘考核错键仍参与分析，不接受任意文本', () => {
 const result = getCoachFeedback([{route:'keyboard',accuracy:100}, {route:'keyboard',metric:'key-press',accuracy:70,mistakes:{a:3,j:1,'<script>':99}}]);
 assert.match(result.feedback,/A/);
 assert.doesNotMatch(JSON.stringify(result),/<script>/);
});
test('无效记录和未知口径不会污染结果或导致异常', () => {
 const result = getCoachFeedback([null, {route:'keyboard',accuracy:NaN},{route:'other',accuracy:91},{route:'keyboard',metric:'unknown',accuracy:20}]);
 assert.equal(result.dataPoints,0);
 assert.equal(result.recommendation.route,'keyboard');
});

test('键盘考核完成率低时优先提醒超时，避免按键正确率高造成错误鼓励', () => {
 const result = getCoachFeedback([{route:'keyboard',metric:'key-press',accuracy:100,completion:10,timedOut:9,mistakes:{a:2}}]);
 assert.match(result.observation,/完成率.*10%/);
 assert.match(result.observation,/超时.*9/);
 assert.match(result.feedback,/完成率|超时/);
 assert.doesNotMatch(result.feedback,/已经很认真|继续保持节奏/);
});
test('无完成率字段的旧键盘记录仍然正常反馈', () => {
 const result = getCoachFeedback([{route:'keyboard',metric:'key-press',accuracy:100}]);
 assert.doesNotMatch(result.observation,/完成率/);
 assert.doesNotMatch(result.feedback,/超时/);
});
