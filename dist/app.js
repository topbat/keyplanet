import {scoreAttempt, adviceFor, nextLevel} from './engine.js';
import {adventures, progressFor, starsFor} from './adventures.js';
import {celebrate, playSound, setSoundEnabled, isSoundEnabled} from './celebration.js';
import {keyboardLessons, createKeyboardSession, answerKeyboardQuestion, expireKeyboardQuestion, summarizeKeyboardSession} from './keyboard.js';
import {getCoachFeedback} from './coach.js';
import {gameCollections, arcadeGames, getArcadeGame} from './arcade-catalog.js';
import {mountArcadePlay} from './arcade-play.js';
import {initCardMotion, resetCardMotion} from './card-interaction.js';
import {renderGrowthDashboard} from './growth-dashboard.js';

const courses = {
  keyboard:{name:'键盘基础', english:'KEYBOARD BASICS', icon:'⌨', color:'mint', tag:'从零开始', description:'认识字母和键位，找到手指的节奏。', instruction:'切换到英文输入法，照着字母输入。', levels:[{title:'认识基础键', target:'asdf jkl;'}, {title:'字母小探险',target:'fj dk sl ag'}, {title:'熟悉键盘',target:'the quick fox'}]},
  pinyin:{name:'拼音输入', english:'PINYIN ADVENTURE', icon:'拼', color:'orange', tag:'词语与句子', description:'从熟悉的词语开始，练习表达。', instruction:'切换到电脑上的拼音输入法，输入下面的汉字。', levels:[{title:'温暖的词语',target:'你好 世界'}, {title:'快乐的一天',target:'阳光 小猫 森林'}, {title:'写下一句话',target:'我们一起快乐地学习。'}]},
  wubi:{name:'五笔入门', english:'WUBI BASICS', icon:'五', color:'blue', tag:'86 版编码', description:'认识常用字简码，探索汉字的奥秘。', instruction:'切换到英文输入法，按照下方提示输入五笔 86 版一级简码。', levels:[{title:'认识常用字简码', target:'g f d w',hint:'一 = g　 二 = f　 大 = d　 人 = w'}, {title:'认识更多简码',target:'s k j e',hint:'木 = s　 口 = k　 日 = j　 月 = e'}, {title:'简码小复习',target:'w s k g',hint:'人 = w　 木 = s　 口 = k　 一 = g'}]}
};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const key='keyplanet-records-v1';
function loadRecords(){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
let records=loadRecords(), route='keyboard', level=0, startTime=null, timerId=null, finished=false, composing=false, worldId=null;
let quiz=null, quizMode='practice', quizTimer=null, deadline=0, quizStarted=0;
let arcadeCleanup=null, arcadeOrigin='courses';
const names={home:'冒险首页',courses:'练习地图',keylab:'键盘训练营',records:'成长记录',practice:'练习中',arcade:'游戏挑战'};
function navigate(view){
  if(view!=='practice') stopTimer();
  if(view!=='keylab') stopQuiz();
  if(view!=='arcade'&&arcadeCleanup){arcadeCleanup();arcadeCleanup=null}
  $$('.view').forEach(el=>el.classList.toggle('active-view',el.id===view));
  $$('.nav').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
  $('#page-name').textContent=names[view];
  if(view==='records'||view==='home') renderRecords();
  if(view==='keylab') renderLab();
  if(view==='home') setMotion(motion);
  window.scrollTo({top:0,behavior:'instant'});
}
function courseCard(id){const c=courses[id];return `<article class="course"><div class="course-head"><div class="course-icon ${c.color}">${c.icon}</div><span class="tag">${c.tag}</span></div><h3>${c.name}</h3><p>${c.description}</p><button class="text-button" data-start="${id}">进入练习 <span>→</span></button></article>`}
$('#home-courses').innerHTML=Object.keys(courses).map(courseCard).join('');
$('#all-courses').innerHTML=Object.keys(courses).map(courseCard).join('');
$('#worlds').innerHTML=Object.entries(adventures).map(([id,w])=>`<article class="world ${w.color}"><div class="world-icon">${w.icon}</div><span class="world-tag">${w.tag}</span><h3>${w.name}</h3><p>${w.description}</p><button class="world-button" data-world="${id}">开启故事 →</button></article>`).join('');
$('#today').textContent=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
function renderGallery(){
 $('#game-gallery').innerHTML=`<div class="arcade-config"><div><strong>设置你的挑战</strong><span>所有游戏都可以选择题目和节奏</span></div><label>练习内容<select id="gallery-pool"><option value="letters">字母</option><option value="numbers">数字</option><option value="symbols">符号</option><option value="mixed">综合</option></select></label><label>难度<select id="gallery-difficulty"><option value="beginner">初阶</option><option value="intermediate">熟悉</option><option value="expert">专家</option></select></label><label>模式<select id="gallery-mode"><option value="practice">自由练习 · 不限时</option><option value="assessment">挑战考核 · 限时</option></select></label></div><p class="gallery-note">20 个原创主题，共用赛车、切水果、投靶、建造和记忆 5 类互动玩法。符号题请使用英文输入法，部分符号需要 Shift。</p>${gameCollections.map(group=>`<div class="gallery-section"><div class="gallery-heading"><div><h2>${group.name}</h2><p>${group.description}</p></div><span>10 个主题</span></div><div class="game-grid">${arcadeGames.filter(g=>g.collection===group.id).map(game=>`<article class="game-card game-${game.backdrop}" data-scene="${game.scene}"><div class="game-art"><div class="card-scenery" aria-hidden="true"><i class="card-orbit"></i><i class="card-path"></i><i class="card-spark card-spark-one">✦</i><i class="card-spark card-spark-two">✧</i><span class="card-subject">${game.icon}</span></div><small>${{race:'竞速',slice:'切水果',target:'投靶',build:'建造',memory:'记忆'}[game.scene]}</small></div><div class="game-copy"><h3>${game.name}</h3><p>${game.description}</p><button data-play-game="${game.id}">开始游戏 <span>↗</span></button></div></article>`).join('')}</div></div>`).join('')}`;
}
renderGallery();
initCardMotion($('#game-gallery'));
function startArcade(id,options={}){
 const game=getArcadeGame(id);if(!game)return;
 const pool=options.pool||$('#gallery-pool').value,difficulty=options.difficulty||$('#gallery-difficulty').value,mode=options.mode||$('#gallery-mode').value;
 arcadeOrigin=options.origin||'courses';navigate('arcade');
 arcadeCleanup=mountArcadePlay($('#arcade-mount'),{game,pool,difficulty,mode,onExit:()=>navigate(arcadeOrigin),onResult:(summary,session)=>{
   const mistakes={};for(const event of session.history)if(event.type==='mistake'&&/^[a-z]$/i.test(event.target)){const key=event.target.toLowerCase();mistakes[key]=(mistakes[key]||0)+1}
   records.unshift({route:'keyboard',title:`${game.name} · ${mode==='assessment'?'考核':'练习'}`,date:new Date().toISOString(),accuracy:summary.accuracy,completion:summary.completion,timedOut:summary.timedOut,speed:summary.speed,metric:'key-press',mistakes});records=records.slice(0,200);try{localStorage.setItem(key,JSON.stringify(records))}catch{}
 }});
}
$('#game-gallery').addEventListener('click',e=>{const button=e.target.closest('[data-play-game]');if(button)startArcade(button.dataset.playGame)});
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function elapsed(){return startTime ? Math.max(1,(Date.now()-startTime)/1000) : 0}
function updateTimer(){const n=Math.floor(elapsed());$('#timer').textContent=`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function openPractice(id, idx=0){
  route=id;level=idx;startTime=null;finished=false;composing=false;stopTimer();const c=route==='story'?storyCourse():courses[route], item=c.levels[level];
  $('#practice-route').textContent=c.english;$('#practice-title').textContent=item.title;$('#practice-instruction').textContent=c.instruction;
  $('#level-pill').textContent=`第 ${level+1} / ${c.levels.length} 关`;$('#target').textContent=item.target;$('#typing').value='';$('#typing').disabled=false;
  $('#input-hint').textContent=item.hint||'从第一次输入开始计时';$('#timer').textContent='00:00';$('#result').classList.add('hidden');$('#finish').disabled=false;
  const story=$('#story-intro');story.classList.toggle('hidden',route!=='story');$('#mission-progress').classList.toggle('hidden',route!=='story');
  if(route==='story'){story.innerHTML=`<strong>✦ ${adventures[worldId].name} · 故事任务</strong>${item.story}`;$('#progress-label').textContent='0%';$('#progress-fill').style.width='0%'}
  navigate('practice');$('#typing').focus();
}
function storyCourse(){const w=adventures[worldId];return {name:w.name,english:'STORY ADVENTURE',instruction:'使用电脑的中文输入法，输入文字帮助故事继续。',levels:w.episodes}}
function openStory(id){if(!adventures[id])return;worldId=id;openPractice('story')}
function renderRecords(){
 const count=records.length, textRecords=records.filter(r=>r.metric!=='key-press'), avg=textRecords.length?Math.round(textRecords.reduce((a,b)=>a+b.accuracy,0)/textRecords.length):null;
 const lastName=count?(records[0].route==='story'?'故事冒险':courses[records[0].route]?.name||'练习'):'--';
 $('#total-sessions').textContent=count;$('#avg-accuracy').textContent=avg===null?'--':`${avg}%`;$('#last-route').textContent=lastName;
 if(!$('#records').classList.contains('active-view'))return;
 renderGrowthDashboard($('#growth-dashboard'), records);
 $('#clear-records').disabled = count === 0;
 const coach=getCoachFeedback(records), panel=$('#coach-panel');panel.replaceChildren();
 const title=document.createElement('h3');title.textContent='✦ 练习小伙伴的观察';panel.append(title);
 [coach.observation,coach.memory,coach.feedback,`建议：${coach.recommendation.text}`].forEach(text=>{const p=document.createElement('p');p.textContent=text;panel.append(p)});
 const note=document.createElement('small');note.textContent=`${coach.mode} · 只使用此浏览器的学习记录`;panel.append(note);
}
document.addEventListener('click',e=>{const nav=e.target.closest('[data-view]'), go=e.target.closest('[data-go]'), start=e.target.closest('[data-start]'), world=e.target.closest('[data-world]');if(nav)navigate(nav.dataset.view);if(go){e.preventDefault();navigate(go.dataset.go)}if(start&&courses[start.dataset.start]){worldId=null;openPractice(start.dataset.start)}if(world)openStory(world.dataset.world)});
$('#typing').addEventListener('compositionstart',()=>{composing=true});
$('#typing').addEventListener('compositionend',()=>{composing=false;updateStoryProgress()});
function updateStoryProgress(){if(route!=='story'||composing)return;const p=progressFor(storyCourse().levels[level].target,$('#typing').value);$('#progress-label').textContent=`${p.percent}%`;$('#progress-fill').style.width=`${p.percent}%`}
$('#typing').addEventListener('input',()=>{if(!startTime){startTime=Date.now();timerId=setInterval(updateTimer,1000)}updateStoryProgress()});
$('#finish').addEventListener('click',()=>{
 if(finished||composing)return;const value=$('#typing').value;
 if(!value){$('#input-hint').textContent='先输入一些内容，再完成练习哦。';$('#typing').focus();return}
 stopTimer();finished=true;$('#typing').disabled=true;$('#finish').disabled=true;const c=route==='story'?storyCourse():courses[route], score=scoreAttempt(c.levels[level].target,value,elapsed()), stars=starsFor(score.accuracy);
 records.unshift({route,title:c.levels[level].title,date:new Date().toISOString(),accuracy:score.accuracy,speed:score.speed,metric:'final-text'});records=records.slice(0,200);
 try{localStorage.setItem(key,JSON.stringify(records))}catch{$('#input-hint').textContent='浏览器未能保存记录，本次成绩仅在当前页面可见。'}
 const result=$('#result');result.classList.remove('hidden');result.innerHTML=`<h2>${stars>=2?'✦ 挑战完成，真棒！':'✦ 完成一次练习，继续加油！'}</h2><div class="stars" aria-label="获得 ${stars} 颗星">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><div class="metrics"><div><strong>${score.accuracy}%</strong><span>完成准确率</span></div><div><strong>${score.speed}</strong><span>正确字符 / 分钟</span></div></div><p>${adviceFor(score)}</p><p>星星按准确率获得：50% 一颗、80% 两颗、95% 三颗。最终提交的文字与题目逐字符比较；修改过的错误不单独计数。中文输入速度包含选字时间。</p><button class="outline" id="retry">再练一次</button> <button class="primary" id="next">${level===c.levels.length-1?'从头再来':'下一关'} <span>→</span></button>`;
 if(stars>=2)celebrate({motion,sound:true});else playSound('error');
 $('#retry').addEventListener('click',()=>openPractice(route,level));$('#next').addEventListener('click',()=>openPractice(route,nextLevel(level,c.levels.length)));result.scrollIntoView({behavior:'smooth',block:'nearest'});
});
$('#clear-records').addEventListener('click',()=>{if(records.length&&confirm('确定清空当前浏览器中的全部练习记录吗？')){records=[];try{localStorage.removeItem(key)}catch{}renderRecords()}});

function stopQuiz(){if(quizTimer){clearInterval(quizTimer);quizTimer=null}quiz=null}
function renderLab(){
 stopQuiz();$('#keylab-content').innerHTML=`<div class="training-hero"><div><span>KEYBOARD TRAINING</span><h2>每个按键，都是新的发现</h2><p>先选想认识的键，再用游戏练习。初阶慢慢来，熟悉和专家解锁更多字符。</p></div><div class="training-keys" aria-hidden="true"><kbd>A</kbd><kbd>7</kbd><kbd>?</kbd></div></div><div class="training-settings"><label>游戏玩法 <select id="lab-game"><option value="comet-race">流星赛车</option><option value="watermelon-slice">西瓜切切乐</option><option value="star-target">星光射击</option><option value="spring-garden">春日花园</option><option value="treasure-memory">宝藏密码</option></select></label><label>练习难度 <select id="lab-difficulty"><option value="beginner">初阶</option><option value="intermediate" selected>熟悉</option><option value="expert">专家</option></select></label></div><div class="training-grid">${[{pool:'letters',title:'字母探险',icon:'Aa',text:'认识字母与键位，熟悉 26 个英文字母。'}, {pool:'numbers',title:'数字寻宝',icon:'123',text:'练习 0–9 数字键，找到数字的位置。'}, {pool:'symbols',title:'符号工坊',icon:'! ?',text:'认识标点和常用符号，包括需要 Shift 的字符。'}, {pool:'mixed',title:'综合挑战',icon:'A7!',text:'将字母、数字和符号组合起来练习。'}].map(x=>`<article class="training-card"><div class="training-icon">${x.icon}</div><h3>${x.title}</h3><p>${x.text}</p><div><button class="outline" data-pool="${x.pool}" data-game-mode="practice">自由练习</button><button class="primary" data-pool="${x.pool}" data-game-mode="assessment">游戏考核</button></div></article>`).join('')}</div><div class="notice">✦ 游戏题目按选择的难度抽取；初阶只包含部分字母和符号，选择熟悉或专家可以练习更多字符。使用英文输入法，部分符号需配合 Shift。</div><div class="section-heading"><div><div class="section-overline">FIND THE KEYS</div><h2>键位认识与功能键</h2><p>认识 F、J 基础指位，探索空格、方向键和回车等功能键。</p></div></div><div class="lab-grid">${keyboardLessons.map((lesson,i)=>`<article class="lab-card"><div class="course-icon ${['mint','orange','blue'][i]}">${['⌨','✦','↵'][i]}</div><h2>${lesson.title}</h2><p>${lesson.description}</p><div class="lab-actions"><button class="outline" data-lesson="${lesson.id}" data-mode="practice">开始练习</button><button class="primary" data-lesson="${lesson.id}" data-mode="assessment">开始考核</button></div></article>`).join('')}</div>`;
}
function startQuiz(id,mode){
 stopQuiz();quiz=createKeyboardSession(id);quizMode=mode;quizStarted=Date.now();
 $('#keylab-content').innerHTML='<div class="lab-area" id="lab-area" tabindex="0" role="region" aria-label="键盘挑战区域"><div id="lab-screen"></div><div class="lab-foot"><p>点击挑战区域后使用键盘作答；按 Esc 返回。练习中请使用英文输入法。</p><button class="outline" id="lab-exit">退出挑战</button></div></div>';
 $('#lab-exit').addEventListener('click',renderLab);
 $('#lab-area').addEventListener('keydown',handleQuizKey);
 resetDeadline();drawQuiz();$('#lab-area').focus();
 if(mode==='assessment')quizTimer=setInterval(tickQuiz,200);
}
function resetDeadline(){const lesson=keyboardLessons.find(x=>x.id===quiz.lessonId);deadline=Date.now()+lesson.timeLimitSeconds*1000}
function tickQuiz(){
 if(!quiz||quiz.complete)return;
 const left=Math.max(0,Math.ceil((deadline-Date.now())/1000)), clock=$('#quiz-clock');if(clock)clock.textContent=`剩余 ${left} 秒`;
 if(left===0){quiz=expireKeyboardQuestion(quiz);if(quiz.complete)finishQuiz();else{resetDeadline();drawQuiz()}}
}
function drawQuiz(){
 if(!quiz||quiz.complete)return;
 const lesson=keyboardLessons.find(x=>x.id===quiz.lessonId), item=quiz.questions[quiz.index], assessment=quizMode==='assessment';
 const hint=assessment?'考核中不显示位置提示，试着自己找到它。':`${item.hint}${item.finger?` 建议使用${item.finger}。`:''}`;
 $('#lab-screen').innerHTML=`<div class="lab-top"><span>${lesson.title} · ${assessment?'独立考核':'自由练习'}</span><span id="quiz-clock">${assessment?`剩余 ${lesson.timeLimitSeconds} 秒`:'不限时'}</span></div><div class="lab-prompt"><p>找到并按下这个键</p><div class="key-tile">${item.label}</div></div><div class="lab-hint">${hint}</div><div class="lab-status" aria-live="polite">第 ${quiz.index+1} / ${quiz.questions.length} 题 · 已找对 ${quiz.correct} 个</div>`;
}
function handleQuizKey(e){
 if(e.target!==$('#lab-area')||!quiz||quiz.complete)return;
 if(e.key==='Escape'){e.preventDefault();renderLab();return}
 if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
 const previous=quiz;quiz=answerKeyboardQuestion(quiz,e);if(quiz===previous)return;
 e.preventDefault();
 if(quiz.lastOutcome.type==='mistake'){playSound('error');const status=$('.lab-status');status.textContent='没关系，再找一找，试试另一个键。';status.classList.add('error-text');return}
 playSound('tap');if(quiz.complete){finishQuiz();return}resetDeadline();drawQuiz();
}
function finishQuiz(){
 if(quizTimer){clearInterval(quizTimer);quizTimer=null}
 const summary=summarizeKeyboardSession(quiz), lesson=keyboardLessons.find(x=>x.id===quiz.lessonId), mistakes={};
 for(const event of quiz.history){if(event.type==='mistake'&&/^Key[A-Z]$/.test(event.target)){const key=event.target.slice(3).toLowerCase();mistakes[key]=(mistakes[key]||0)+1}}
 records.unshift({route:'keyboard',title:`${lesson.title} · ${quizMode==='assessment'?'考核':'练习'}`,date:new Date().toISOString(),accuracy:summary.accuracy,completion:summary.completion,timedOut:summary.timedOut,speed:0,metric:'key-press',mistakes});records=records.slice(0,200);
 try{localStorage.setItem(key,JSON.stringify(records))}catch{}
 const passed=summary.completion>=80&&summary.accuracy>=70;
 $('#lab-screen').innerHTML=`<div class="lab-result" aria-live="polite"><div class="stars">${passed?'★★★':'★☆☆'}</div><h2>${passed?'挑战完成！你真棒':'又完成了一次探索！'}</h2><p>找到 ${summary.correct} / ${summary.total} 个目标键 · 按键正确率 ${summary.accuracy}% · 错按 ${summary.mistakes} 次${quizMode==='assessment'?` · 超时 ${summary.timedOut} 题`:''}</p><p>按键正确率 = 正确次数 ÷（正确次数 + 错按次数）；超时题单独统计。${passed?'继续去发现更多键位吧！':'可以先用练习模式熟悉位置，再试一次。'}</p></div>`;
 if(passed)celebrate({motion,sound:true});else playSound('error');
}
$('#keylab-content').addEventListener('click',e=>{const button=e.target.closest('[data-lesson]'), game=e.target.closest('[data-pool]');if(button)startQuiz(button.dataset.lesson,button.dataset.mode);if(game)startArcade($('#lab-game').value,{pool:game.dataset.pool,difficulty:$('#lab-difficulty').value,mode:game.dataset.gameMode,origin:'keylab'})});
function renderSound(){const on=isSoundEnabled();$('#sound-toggle').textContent=`音效：${on?'开':'关'}`;$('#sound-toggle').setAttribute('aria-pressed',String(on))}
$('#sound-toggle').addEventListener('click',()=>{setSoundEnabled(!isSoundEnabled());renderSound();if(isSoundEnabled())playSound('tap')});renderSound();
renderRecords();

// A small software-projected 3D island; no external graphics library is needed.
const canvas=$('#planet'),ctx=canvas.getContext('2d');let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches, frame=0, last=0;
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function renderPlanet(t=0){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const dpr=Math.min(devicePixelRatio||1,2);canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const w=rect.width,h=rect.height,cx=w*.5,cy=h*.54,r=Math.min(w*.32,h*.43),a=t*.00018;
 ellipse(cx,cy+r*.69,r*1.14,r*.19,'#93d8c481');
 const project=(x,y,z)=>{let X=x*Math.cos(a)-z*Math.sin(a),Z=x*Math.sin(a)+z*Math.cos(a);return [cx+X*r,cy+y*r*.75+Z*r*.35]};
 function poly(points,color){ctx.beginPath();points.forEach(([x,y,z],i)=>{const [px,py]=project(x,y,z);i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath();ctx.fillStyle=color;ctx.fill()}
 // Rotating low-poly island with sides sorted by depth.
 const verts=Array.from({length:10},(_,i)=>{const th=i*Math.PI*2/10;return [Math.cos(th),0,Math.sin(th)]});
 const sides=verts.map((v,i)=>{const q=verts[(i+1)%10];return {depth:(v[0]+q[0])*Math.sin(a)+(v[2]+q[2])*Math.cos(a),points:[v,q,[q[0]*.65,.48,q[2]*.65],[v[0]*.65,.48,v[2]*.65]]}}).sort((p,q)=>p.depth-q.depth);
 sides.forEach((s,i)=>poly(s.points,i%2?'#61bca0':'#79cbb0'));poly(verts,'#a4e2c2');
 // Raised geometric blocks on the island.
 function box(x,z,size,height,top,side){const p=[[x-size,-height,z-size],[x+size,-height,z-size],[x+size,-height,z+size],[x-size,-height,z+size]];const b=p.map(v=>[v[0],0,v[2]]);[0,1,2,3].forEach(i=>poly([p[i],p[(i+1)%4],b[(i+1)%4],b[i]],side));poly(p,top)}
 box(-.3,-.05,.17,.34,'#f8d275','#eab562');box(.25,.17,.21,.46,'#fff9df','#e3d4ae');box(.34,-.27,.12,.24,'#80cdb7','#64b69f');
 ctx.fillStyle='#efb94f';ctx.font=`${Math.max(15,r*.22)}px sans-serif`;ctx.fillText('✦',cx-r*.95,cy-r*.7);ctx.fillStyle='#5cbca0';ctx.fillText('✧',cx+r*.82,cy-r*.57);
 if(motion)frame=requestAnimationFrame(renderPlanet);
}
function setMotion(on){motion=on;document.documentElement.dataset.motion=on?'on':'off';if(!on)resetCardMotion();$('#motion-toggle').textContent=`动态效果：${on?'开':'关'}`;$('#motion-toggle').setAttribute('aria-pressed',String(on));cancelAnimationFrame(frame);renderPlanet(performance.now())}
$('#motion-toggle').addEventListener('click',()=>setMotion(!motion));window.addEventListener('resize',()=>{cancelAnimationFrame(frame);renderPlanet(performance.now())});setMotion(motion);
