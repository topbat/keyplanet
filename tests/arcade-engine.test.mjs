import test from 'node:test';
import assert from 'node:assert/strict';
import {ARCADE_POOLS, createArcadeSession, answerArcade, skipArcade, summarizeArcade} from '../dist/arcade-engine.js';
const session = (pool='letters') => createArcadeSession({pool,difficulty:'beginner',count:2,now:1000,random:()=>0});
test('题库覆盖字母、数字、符号和混合',()=>{
 assert.deepEqual(Object.keys(ARCADE_POOLS),['letters','numbers','symbols','mixed']);
 for(const pool of Object.keys(ARCADE_POOLS)) assert.equal(session(pool).questions.length,2);
});
test('字母按生成字符而非物理键位匹配，大小写均可',()=>{
 let s=session(); let target=s.questions[0]; s=answerArcade(s,{key:target.toUpperCase(),code:'KeyZ',shiftKey:true},1100);
 assert.equal(s.correct,1);assert.equal(s.index,1);assert.equal(s.lastOutcome.type,'correct');
});
test('符号按实际生成字符识别 Shift 和 AltGraph',()=>{
 let s=createArcadeSession({pool:'symbols',difficulty:'expert',count:1,now:0,random:()=>0});
 s={...s,questions:['?']}; s=answerArcade(s,{key:'?',code:'Slash',shiftKey:true},2000);assert.equal(s.correct,1);
 let t=createArcadeSession({pool:'symbols',difficulty:'expert',count:1,now:0,random:()=>0});
 t={...t,questions:['@']};t=answerArcade(t,{key:'@',code:'KeyQ',ctrlKey:true,altKey:true,getModifierState:n=>n==='AltGraph'},2000);assert.equal(t.correct,1);
});
test('组合输入、重复和系统快捷键不会改变成绩',()=>{
 let s=session();for(const event of [{key:'a',isComposing:true},{key:'a',repeat:true},{key:'a',ctrlKey:true},{key:'a',metaKey:true},{key:'Dead'},{key:'Process'},{key:'Shift'}])assert.strictEqual(answerArcade(s,event,2000),s);
});
test('误按不前进；跳过和超时分别计数',()=>{
 let s=session();s=answerArcade(s,{key:'!'},1200);assert.equal(s.mistakes,1);assert.equal(s.index,0);
 s=skipArcade(s,1500,'skip');s=skipArcade(s,2000,'timeout');
 assert.equal(s.skipped,1);assert.equal(s.timedOut,1);assert.equal(s.complete,true);
 assert.deepEqual(summarizeArcade(s,9000),{total:2,correct:0,mistakes:1,skipped:1,timedOut:1,accuracy:0,completion:0,elapsedSeconds:1,speed:0});
});
test('完成后的统计使用结束时间、题目完成率与按键准确率分开',()=>{
 let s=session();s=answerArcade(s,{key:s.questions[0]},11000);s=answerArcade(s,{key:'!'},12000);s=answerArcade(s,{key:s.questions[1]},31000);
 assert.deepEqual(summarizeArcade(s,90000),{total:2,correct:2,mistakes:1,skipped:0,timedOut:0,accuracy:67,completion:100,elapsedSeconds:30,speed:4});
});
test('非法参数明确报错',()=>{
 assert.throws(()=>createArcadeSession({pool:'bad'}));assert.throws(()=>createArcadeSession({difficulty:'bad'}));assert.throws(()=>createArcadeSession({count:0}));
});
