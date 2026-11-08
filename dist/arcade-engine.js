/** Layout-independent character-based keyboard challenge engine.
 * Match `event.key`, never physical `event.code`: labels may be in different
 * positions on international keyboards. Shift-produced symbols and AltGraph
 * are supported. The caller owns timers and may report a timeout via skipArcade.
 */
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = ".,!?@#$%&*+-=/;:'\"()_";
export const ARCADE_POOLS = Object.freeze({
  letters: Object.freeze({name:'字母', characters:LETTERS}),
  numbers: Object.freeze({name:'数字', characters:NUMBERS}),
  symbols: Object.freeze({name:'符号', characters:SYMBOLS}),
  mixed: Object.freeze({name:'综合', characters:LETTERS+NUMBERS+SYMBOLS})
});
const DIFFICULTY_CHARACTERS = Object.freeze({
  beginner: Object.freeze({letters:'asdfjkl',numbers:'1234567890',symbols:'.,!?',mixed:'asdfjkl1234567890.,!?'}),
  intermediate: Object.freeze({letters:LETTERS,numbers:NUMBERS,symbols:'.,!?@+-=/',mixed:LETTERS+NUMBERS+'.,!?@+-=/'}),
  expert: Object.freeze({letters:LETTERS,numbers:NUMBERS,symbols:SYMBOLS,mixed:LETTERS+NUMBERS+SYMBOLS})
});

/** Select each full round without replacement. `random` may be seeded for tests. */
export function createArcadeSession({pool='mixed',difficulty='beginner',count=10,now=Date.now(),random=Math.random}={}) {
  if (!Object.hasOwn(ARCADE_POOLS,pool)) throw new Error('未知题库');
  if (!Object.hasOwn(DIFFICULTY_CHARACTERS,difficulty)) throw new Error('未知难度');
  if (!Number.isInteger(count)||count<1||count>60) throw new Error('题目数量必须在 1 到 60 之间');
  if (typeof random !== 'function') throw new Error('随机数生成器无效');
  const source=Array.from(DIFFICULTY_CHARACTERS[difficulty][pool]), questions=[];
  while(questions.length<count){
    const shuffled=source.slice();
    for(let i=shuffled.length-1;i>0;i--){
      const draw=Number(random());
      if(!Number.isFinite(draw))throw new Error('随机数无效');
      const j=Math.min(i,Math.max(0,Math.floor(draw*(i+1))));
      [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
    }
    questions.push(...shuffled.slice(0,count-questions.length));
  }
  const startTime=Number.isFinite(now)?now:Date.now();
  return {pool,difficulty,questions,index:0,correct:0,mistakes:0,skipped:0,timedOut:0,complete:false,startTime,endTime:null,history:[],lastOutcome:null};
}
function safeTime(now,start){return Number.isFinite(now)?Math.max(start,now):Math.max(start,Date.now())}
function codepoint(key){return typeof key==='string'&&Array.from(key).length===1?key:null}
function altGraph(event){try{return typeof event.getModifierState==='function'&&event.getModifierState('AltGraph')===true}catch{return false}}
function validEvent(event){
  if(!event||event.isComposing||event.repeat||event.metaKey||event.keyCode===229)return false;
  const alternate=altGraph(event);
  if((event.ctrlKey||event.altKey)&&!alternate)return false;
  return codepoint(event.key)!==null;
}
function matches(target,key){return /^[a-z]$/.test(target)?key.toLowerCase()===target:key===target}
function completedAt(session,index,now){return index>=session.questions.length?safeTime(now,session.startTime):null}

/** Ignore modifiers, dead keys, IME composition and shortcuts; wrong keys stay on target. */
export function answerArcade(session,event,now=Date.now()){
  if(!session||session.complete||!validEvent(event))return session;
  const target=session.questions[session.index], match=matches(target,event.key);
  const outcome={type:match?'correct':'mistake',target};
  const index=session.index+(match?1:0), endTime=completedAt(session,index,now);
  return {...session,index,correct:session.correct+(match?1:0),mistakes:session.mistakes+(match?0:1),complete:endTime!==null,endTime,history:[...session.history,outcome],lastOutcome:outcome};
}
/** Skip a question explicitly or after the caller's question timer expires. */
export function skipArcade(session,now=Date.now(),reason='skip'){
  if(!session||session.complete)return session;
  if(reason!=='skip'&&reason!=='timeout')throw new Error('无效的跳过原因');
  const target=session.questions[session.index],index=session.index+1,endTime=completedAt(session,index,now),outcome={type:reason,target};
  return {...session,index,skipped:session.skipped+(reason==='skip'?1:0),timedOut:session.timedOut+(reason==='timeout'?1:0),complete:endTime!==null,endTime,history:[...session.history,outcome],lastOutcome:outcome};
}
/** Accuracy excludes skips; completion measures correctly found questions. */
export function summarizeArcade(session,now=Date.now()){
  const total=session.questions.length,presses=session.correct+session.mistakes;
  const elapsedSeconds=Math.max(0,Math.round(((session.endTime??safeTime(now,session.startTime))-session.startTime)/1000));
  return {total,correct:session.correct,mistakes:session.mistakes,skipped:session.skipped,timedOut:session.timedOut,
    accuracy:presses?Math.round(session.correct/presses*100):0,
    completion:total?Math.round(session.correct/total*100):0,
    elapsedSeconds,speed:elapsedSeconds?Math.round(session.correct*60/elapsedSeconds):0};
}
