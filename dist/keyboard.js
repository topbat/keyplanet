/**
 * Keyboard discovery / assessment data and pure state transitions.
 * A caller owns the timer; call expireKeyboardQuestion when its countdown ends.
 * Accuracy = correct key presses / (correct + incorrect key presses). Timeouts
 * are reported separately; completion = correctly found targets / all targets.
 */

const q = (code, label, hint, finger = '') => ({code, label, hint, finger});

export const keyboardLessons = [
  {
    id:'home-row', title:'指尖出发站', subtitle:'找到基础键位',
    description:'先从 F、J 上的小凸点出发，认识手指的起点。',
    timeLimitSeconds:20,
    questions:[
      q('KeyF','F','左手食指找有凸点的 F 键。','左手食指'),
      q('KeyJ','J','右手食指找有凸点的 J 键。','右手食指'),
      q('KeyD','D','从 F 往左找，试试左手中指。','左手中指'),
      q('KeyK','K','从 J 往右找，试试右手中指。','右手中指'),
      q('KeyS','S','从 D 往左找，试试左手无名指。','左手无名指'),
      q('KeyL','L','从 K 往右找，试试右手无名指。','右手无名指'),
      q('KeyA','A','基础行最左边的字母。','左手小指'),
      q('Semicolon',';','在 L 的右边，注意切换英文输入法。','右手小指'),
    ],
  },
  {
    id:'letter-hunt', title:'字母寻宝岛', subtitle:'寻找更多字母',
    description:'观察字母在键盘上的位置，一起收集宝藏。',
    timeLimitSeconds:15,
    questions:[
      q('KeyQ','Q','字母区最上排靠左。','左手小指'),
      q('KeyW','W','在 Q 的右边。','左手无名指'),
      q('KeyE','E','在 W 的右边。','左手中指'),
      q('KeyR','R','在 E 的右边。','左手食指'),
      q('KeyT','T','在 R 的右边。','左手食指'),
      q('KeyY','Y','在 T 的右边。','右手食指'),
      q('KeyU','U','在 Y 的右边。','右手食指'),
      q('KeyI','I','在 U 的右边。','右手中指'),
      q('KeyO','O','在 I 的右边。','右手无名指'),
      q('KeyP','P','字母区最上排靠右。','右手小指'),
      q('KeyZ','Z','字母区最下排靠左。','左手小指'),
      q('KeyX','X','在 Z 的右边。','左手无名指'),
      q('KeyC','C','在 X 的右边。','左手中指'),
      q('KeyV','V','在 C 的右边。','左手食指'),
      q('KeyB','B','在 V 的右边。','左手食指'),
      q('KeyN','N','在 B 的右边。','右手食指'),
      q('KeyM','M','在 N 的右边。','右手食指'),
    ],
  },
  {
    id:'special-keys', title:'键盘工具箱', subtitle:'认识功能键',
    description:'找到空格、方向键、回车和退格，让键盘成为好帮手。',
    timeLimitSeconds:15,
    questions:[
      q('Space','空格','键盘底部最长的一条键。','拇指'),
      q('ArrowLeft','← 左方向键','找到方向键区域，向左的箭头。'),
      q('ArrowRight','→ 右方向键','找到方向键区域，向右的箭头。'),
      q('ArrowUp','↑ 上方向键','找到方向键区域，向上的箭头。'),
      q('ArrowDown','↓ 下方向键','找到方向键区域，向下的箭头。'),
      q('Enter','Enter 回车','字母区右侧较大的回车键。'),
      q('Backspace','Backspace 退格','字母区右上方，用来删除光标左边的内容。'),
      q('Tab','Tab 制表键','字母区左侧，在 Q 的左边。','左手小指'),
    ],
  },
];

const ignoredCodes = new Set(['ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft','MetaRight','CapsLock','NumLock','ScrollLock','Fn']);
const aliases = { ' ':'Space', Spacebar:'Space', Esc:'Escape', Left:'ArrowLeft', Right:'ArrowRight', Up:'ArrowUp', Down:'ArrowDown', ';':'Semicolon' };

function eventCode(event) {
  if (event.code && event.code !== 'Unidentified') return event.code;
  const key = event.key || '';
  if (aliases[key]) return aliases[key];
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return `Digit${key}`;
  return key;
}

/** New session. count is optional and selects the first N questions. */
export function createKeyboardSession(lessonId, options = {}) {
  const lesson = keyboardLessons.find(item => item.id === lessonId);
  if (!lesson) throw new Error('未知的键盘练习路线');
  const count = options.count ?? lesson.questions.length;
  if (!Number.isInteger(count) || count < 1 || count > lesson.questions.length) throw new Error('题目数量无效');
  return { lessonId, questions:lesson.questions.slice(0,count).map(item=>({...item})), index:0, correct:0, mistakes:0, timedOut:0, complete:false, history:[], lastOutcome:null };
}

/** Pass a KeyboardEvent or a plain object with its corresponding properties. */
export function answerKeyboardQuestion(session, event = {}) {
  if (session.complete || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key === 'Process' || event.key === 'Dead') return session;
  const code = eventCode(event);
  if (!code || ignoredCodes.has(code) || ['Shift','Control','Alt','Meta','CapsLock','Unidentified'].includes(code)) return session;
  const target = session.questions[session.index];
  const matched = code === target.code || (target.code === 'Enter' && code === 'NumpadEnter');
  const outcome = {type:matched?'correct':'mistake', target:target.code, pressed:code};
  const index = matched ? session.index+1 : session.index;
  return {...session, index, correct:session.correct+(matched?1:0), mistakes:session.mistakes+(matched?0:1), complete:index>=session.questions.length, history:[...session.history,outcome], lastOutcome:outcome};
}

export function expireKeyboardQuestion(session) {
  if (session.complete) return session;
  const index = session.index+1;
  const outcome = {type:'timeout', target:session.questions[session.index].code};
  return {...session, index, timedOut:session.timedOut+1, complete:index>=session.questions.length, history:[...session.history,outcome], lastOutcome:outcome};
}

export function summarizeKeyboardSession(session) {
  const total = session.questions.length;
  const presses = session.correct+session.mistakes;
  return {total, correct:session.correct, mistakes:session.mistakes, timedOut:session.timedOut, accuracy:presses ? Math.round(session.correct/presses*100) : 0, completion:total ? Math.round(session.correct/total*100) : 0};
}
