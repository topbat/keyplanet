import {createArcadeSession,answerArcade,skipArcade,summarizeArcade} from './arcade-engine.js';
import {mountArcadeScene} from './arcade-scenes.js';
import {celebrate,playArcadeSound,stopArcadeSound} from './celebration.js';

const timeFor={beginner:20,intermediate:15,expert:10};
const countFor={beginner:8,intermediate:10,expert:12};
const sceneFeedback = {
  race: ['向前冲！', '起跑成功', '驶过半程', '进入最后冲刺'],
  slice: ['漂亮的一刀！', '果盘有了第一份收获', '果盘装到一半了', '快要装满果盘啦'],
  target: ['星标命中！', '点亮第一组星标', '星光过半', '最后一组星标等你点亮'],
  build: ['放好一块材料！', '第一层落成', '第二层落成', '第三层落成'],
  memory: ['记对啦！', '解开第一段线索', '线索收集过半', '离谜底又近一步']
};
const node=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e};
const button=(text,className)=>{const e=node('button',className,text);e.type='button';return e};

/** Mount one complete game. The returned cleanup removes timers and listeners. */
export function mountArcadePlay(container,{game,pool='mixed',difficulty='beginner',mode='practice',onExit=()=>{},onResult=()=>{}}={}){
  if(!container||!game)throw new TypeError('需要游戏和挂载容器');
  const memory=game.scene==='memory', assessment=mode==='assessment';
  const previewMs=Math.max(0,Number.isFinite(game.previewMs)?game.previewMs:2500);
  const questionTime=(timeFor[difficulty]||20)*1000;
  let session,phase,phaseStart=0,deadline=0,paused=false,pauseStart=0,disposed=false,timer=null,announced=false;
  const root=node('section','ap-shell');
  const top=node('div','ap-top');
  const name=node('div','ap-name');
  name.append(node('span','ap-icon',game.icon||'✦'));
  const names=node('div'); names.append(node('h2','',game.name||'键盘挑战'),node('p','',game.description||'跟随提示完成键盘挑战。'));name.append(names);
  const exitButton=button('退出游戏','ap-button ap-outline');top.append(name,exitButton);
  const stats=node('div','ap-stats');
  const progressLabel=node('span','ap-progress-label');const correctLabel=node('span');const wrongLabel=node('span');const comboLabel=node('span','ap-combo');const clockLabel=node('strong','ap-clock');
  stats.append(progressLabel,correctLabel,wrongLabel,comboLabel,clockLabel);
  const progressTrack=node('div','ap-track');progressTrack.setAttribute('role','progressbar');progressTrack.setAttribute('aria-valuemin','0');progressTrack.setAttribute('aria-valuemax','100');
  const progressFill=node('div','ap-track-fill');progressTrack.append(progressFill);
  const stage=node('div','ap-stage');stage.tabIndex=0;stage.setAttribute('role','region');stage.setAttribute('aria-label','键盘游戏区域，点击后按提示输入');
  const scene=node('div','ap-scene'); const cue=node('div','ap-cue');const hint=node('p','ap-hint');
  const scenery = mountArcadeScene(scene, {type: game.scene, icon: game.icon, backdrop: game.backdrop});
  const live=node('div','ap-live');live.setAttribute('aria-live','polite');
  stage.append(scene,cue,hint,live);
  const controls=node('div','ap-controls');
  const focusButton=button('点击这里开始输入','ap-button ap-primary');
  const pauseButton=button('暂停','ap-button ap-outline');
  const skipButton=button('跳过这一题','ap-button ap-outline');
  controls.append(focusButton,pauseButton,skipButton);
  const notes=node('p','ap-notes','先切换到英文输入法。请点击游戏区域后输入；按 Tab 可移动到按钮，按 Esc 可退出。符号按实际输入的字符判定。');
  const result=node('div','ap-result');result.hidden=true;result.setAttribute('aria-live','polite');
  root.append(top,stats,progressTrack,stage,controls,notes,result);container.replaceChildren(root);

  function begin(){
    stopArcadeSound();
    scenery.clearEffects();
    stage.tabIndex = 0;
    cue.hidden = hint.hidden = live.hidden = false;
    live.textContent = '';
    delete live.dataset.outcome;
    session=createArcadeSession({pool,difficulty,count:countFor[difficulty]||8,now:Date.now()});
    paused=false;announced=false;result.hidden=true;controls.hidden=false;stage.hidden=false;stats.hidden=false;progressTrack.hidden=false;notes.hidden=false;
    nextQuestion();update();if(!timer)timer=setInterval(tick,100);stage.focus();
  }
  function nextQuestion(){
    phaseStart=performance.now();phase=memory&&previewMs>0?'preview':'answer';
    deadline=phase==='preview'?phaseStart+previewMs:(assessment?phaseStart+questionTime:0);
  }
  // Time spent displaying a memorisation prompt does not count toward speed.
  function endPreview(now){
    session={...session,startTime:session.startTime+Math.max(0,now-phaseStart)};
    phase='answer';phaseStart=now;deadline=assessment?now+questionTime:0;
  }
  function tick(){
    if(disposed||paused||!session||session.complete)return;
    const now=performance.now();
    if(phase==='preview'&&now>=deadline){endPreview(now);update();return}
    if(phase==='answer'&&assessment&&now>=deadline){
      session=skipArcade(session,Date.now(),'timeout');
      if(session.complete){finish();return}
      nextQuestion();update();
      showFeedback('timeout', '时间到了，看看下一题。');
      return;
    }
    updateClock(now);
  }
  function updateClock(now=performance.now()){
    clockLabel.textContent=paused?'已暂停':phase==='preview'?`观察 ${Math.max(0,Math.ceil((deadline-now)/1000))} 秒`:assessment?`剩余 ${Math.max(0,Math.ceil((deadline-now)/1000))} 秒`:'不限时';
  }
  function combo(){let n=0;for(let i=session.history.length-1;i>=0;i--){if(session.history[i].type!=='correct')break;n++}return n}
  function showFeedback(outcome, message, streak = 0, milestone = false){
    live.textContent = message;
    live.dataset.outcome = outcome;
    scenery.impact(outcome, {combo: streak, milestone});
    playArcadeSound(game.scene, outcome, streak, milestone);
  }
  function update(){
    if(disposed||!session||session.complete)return;
    const target=session.questions[session.index],hide=memory&&(phase==='answer'||paused);
    const ratio=session.index/session.questions.length;
    progressLabel.textContent=`第 ${session.index+1} / ${session.questions.length} 题`;
    const streak = combo();
    correctLabel.textContent=`命中 ${session.correct}`;wrongLabel.textContent=`错按 ${session.mistakes}`;comboLabel.textContent=`${streak} 连击`;
    comboLabel.classList.toggle('ap-combo-powered', streak >= 3);
    progressTrack.setAttribute('aria-valuenow',String(Math.round(ratio*100)));progressFill.style.width=`${ratio*100}%`;
    cue.textContent=paused?'游戏已暂停':phase==='preview'?`记住这个字符：${target}`:hide?'请回忆刚才的字符':`请输入：${target}`;
    const instructions={race:'按对字符，赛车前进；连续命中让赛车加速。',slice:'按对水果上的字符，切开水果。',target:'按对靶心字符，点亮目标。',build:'每答对一题，向完成建筑迈进一步。',memory:'仔细观察，字符隐藏后再输入。'};
    hint.textContent=paused?'点击继续，再回到游戏区域。':phase==='preview'?instructions.memory:hide?'输入刚才看到的字符；忘记了可以跳过。':(instructions[game.scene]||'看准字符，用键盘输入。');
    pauseButton.textContent=paused?'继续':'暂停';pauseButton.setAttribute('aria-pressed',String(paused));
    focusButton.disabled=paused;skipButton.disabled=paused;
    scenery.update({target: hide || paused ? '' : target, progress: session.correct / session.questions.length, combo: paused ? 0 : streak, hidden: hide});
    updateClock();
  }
  function handleKey(e){
    if(e.target!==stage||!session||session.complete)return;
    if(e.key==='Escape'){e.preventDefault();leave();return}
    if(paused||phase==='preview'||e.key===' '||e.key==='Tab')return;
    if(assessment&&performance.now()>=deadline){tick();return}
    const previous=session;session=answerArcade(session,e,Date.now());
    if(previous===session)return;
    e.preventDefault();
    if(session.lastOutcome.type==='correct'){
      if(session.complete){finish();return}
      const streak = combo();
      const chapter = Math.floor(4 * session.correct / session.questions.length);
      const milestone = chapter > Math.floor(4 * previous.correct / session.questions.length);
      const lines = sceneFeedback[game.scene] || sceneFeedback.race;
      const message = milestone ? lines[chapter] : lines[0];
      nextQuestion();update();
      showFeedback('hit', streak >= 3 ? `${message} · ${streak} 连击` : message, streak, milestone || streak === 3);
    } else {
      update();
      showFeedback('miss', '看准当前字符，再试一次。');
    }
  }
  function togglePause(){
    if(!session||session.complete)return;
    const now=performance.now();
    delete live.dataset.outcome;
    if(!paused){paused=true;pauseStart=now;live.textContent='已暂停。';scenery.clearEffects();stopArcadeSound()}
    else{const duration=Math.max(0,now-pauseStart);paused=false;phaseStart+=duration;if(deadline)deadline+=duration;session={...session,startTime:session.startTime+duration};live.textContent='继续挑战。'}
    update();
    if(!paused)stage.focus();
  }
  function skip(){
    if(!session||paused||session.complete)return;
    if(phase==='preview')endPreview(performance.now());
    session=skipArcade(session,Date.now(),'skip');
    if(session.complete)finish();else{nextQuestion();update();showFeedback('skip', '已跳过，继续下一题。');stage.focus()}
  }
  function finish(){
    if(disposed||announced)return;announced=true;
    if(timer){clearInterval(timer);timer=null}
    stopArcadeSound();
    const summary=summarizeArcade(session,Date.now());
    const passed=summary.completion>=80&&summary.accuracy>=70;
    stats.hidden=true;progressTrack.hidden=true;controls.hidden=true;notes.hidden=true;result.hidden=false;result.replaceChildren();
    stage.tabIndex = -1;
    cue.hidden = hint.hidden = live.hidden = true;
    scenery.clearEffects();
    scenery.update({progress: summary.correct / summary.total, combo: 0});
    result.append(node('div','ap-result-stars',passed?'★★★':'★☆☆'),node('h3','',passed?'挑战完成，太棒了！':'完成一次探索，继续加油！'));
    result.append(node('p','',`完成 ${summary.correct} / ${summary.total} 题 · 按键正确率 ${summary.accuracy}% · 完成率 ${summary.completion}%`));
    result.append(node('p','',`错按 ${summary.mistakes} 次 · 跳过 ${summary.skipped} 题 · 超时 ${summary.timedOut} 题 · 有效用时 ${summary.elapsedSeconds} 秒`));
    result.append(node('p','ap-result-note','按键正确率按正确与错按次数计算；完成率按总题数计算。跳过与超时单独记录。'));
    const resultActions=node('div','ap-result-actions'),retry=button('再玩一次','ap-button ap-primary'),back=button('返回游戏地图','ap-button ap-outline');resultActions.append(retry,back);result.append(resultActions);
    retry.addEventListener('click',begin);back.addEventListener('click',leave);
    if(passed){
      scenery.impact('finish');
      playArcadeSound(game.scene, 'finish');
      celebrate({motion: document.documentElement.dataset.motion !== 'off', sound: false});
    } else if (session.lastOutcome.type !== 'correct') {
      playArcadeSound(game.scene, session.lastOutcome.type);
    }
    onResult(summary,session);
    if(!disposed)retry.focus();
  }
  function leave(){if(disposed)return;cleanup();onExit()}
  function cleanup(){if(disposed)return;disposed=true;if(timer)clearInterval(timer);timer=null;stopArcadeSound();stage.removeEventListener('keydown',handleKey);container.replaceChildren()}
  stage.addEventListener('keydown',handleKey);stage.addEventListener('pointerdown',()=>{if(!session.complete)stage.focus()});exitButton.addEventListener('click',leave);focusButton.addEventListener('click',()=>stage.focus());pauseButton.addEventListener('click',togglePause);skipButton.addEventListener('click',skip);
  begin();return cleanup;
}
