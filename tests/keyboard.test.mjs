import test from 'node:test';
import assert from 'node:assert/strict';
import { keyboardLessons, createKeyboardSession, answerKeyboardQuestion, expireKeyboardQuestion, summarizeKeyboardSession } from '../dist/keyboard.js';

test('课程从基础键到字母及功能键，题目都包含可识别的物理键位', () => {
  assert.equal(keyboardLessons.length, 3);
  for (const lesson of keyboardLessons) {
    assert.ok(lesson.questions.length >= 8);
    assert.ok(lesson.questions.every(q => q.code && q.label && q.hint));
  }
});

test('按对目标键进入下一题，错误保留当前题并计数', () => {
  const initial = createKeyboardSession('home-row');
  const wrong = answerKeyboardQuestion(initial, {code:'KeyA', key:'a'});
  assert.equal(wrong.index, 0);
  assert.equal(wrong.mistakes, 1);
  assert.equal(initial.mistakes, 0);
  const correct = answerKeyboardQuestion(wrong, {code:'KeyF', key:'f'});
  assert.equal(correct.index, 1);
  assert.equal(correct.correct, 1);
  assert.equal(correct.mistakes, 1);
});

test('组合输入、长按、快捷键和修饰键不会误伤评估', () => {
  const session = createKeyboardSession('home-row');
  for (const event of [
    {code:'KeyA', key:'a', isComposing:true},
    {code:'KeyA', key:'a', repeat:true},
    {code:'KeyA', key:'a', ctrlKey:true},
    {code:'ShiftLeft', key:'Shift'},
  ]) assert.equal(answerKeyboardQuestion(session,event), session);
});

test('缺少物理键位时可识别大小写、空格和方向键', () => {
  let session = createKeyboardSession('home-row');
  session = answerKeyboardQuestion(session, {key:'F'});
  assert.equal(session.index, 1);
  let special = createKeyboardSession('special-keys');
  special = answerKeyboardQuestion(special, {key:' '});
  assert.equal(special.index, 1);
  special = answerKeyboardQuestion(special, {key:'ArrowLeft'});
  assert.equal(special.index, 2);
});

test('超时进入下一题，结束汇总包含命中率和题目完成率', () => {
  let session = createKeyboardSession('home-row', {count:2});
  session = answerKeyboardQuestion(session,{code:'KeyF'});
  session = answerKeyboardQuestion(session,{code:'KeyA'});
  session = expireKeyboardQuestion(session);
  assert.equal(session.complete,true);
  assert.deepEqual(summarizeKeyboardSession(session), {total:2, correct:1, mistakes:1, timedOut:1, accuracy:50, completion:50});
  assert.equal(answerKeyboardQuestion(session,{code:'KeyJ'}),session);
});

test('未知路线安全报错且不会生成空题库', () => {
  assert.throws(() => createKeyboardSession('missing'), /未知/);
  assert.throws(() => createKeyboardSession('home-row',{count:0}), /数量/);
});
