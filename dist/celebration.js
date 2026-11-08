/**
 * Child-friendly story settings and low-distraction feedback.
 * Audio is created lazily: call these functions from a trusted user gesture.
 */
export const THEMES = Object.freeze([
  Object.freeze({
    id: 'journey',
    name: '云山奇遇',
    subtitle: '踏上取经路',
    icon: '☁',
    description: '跟着小行者穿过云山，收集智慧星，帮助旅途上的朋友。',
    opening: '小行者来到了云山脚下，一座彩虹桥等着你用灵巧的手指点亮。',
    encouragement: '太棒啦！云上的小伙伴为你敲起了庆祝的鼓。',
    prompt: '每按对一个键，就为彩虹桥添上一块石头。',
    accent: '#e8a447',
    backdrop: 'linear-gradient(135deg, #fff2d8, #f8e3cb 55%, #e5f5e9)'
  }),
  Object.freeze({
    id: 'seasons',
    name: '四季花园',
    subtitle: '和季节一起旅行',
    icon: '❀',
    description: '穿过春花、夏雨、秋叶和冬雪，让花园随着练习慢慢苏醒。',
    opening: '花园邮差收到一封来自春天的信，需要你的帮助才能打开。',
    encouragement: '花儿在风里轻轻点头，庆祝你完成了一次探索！',
    prompt: '每一次认真输入，都是送给花园的一滴雨露。',
    accent: '#61bfa5',
    backdrop: 'linear-gradient(135deg, #e3f7e9, #fdf4d9 54%, #e4f3fb)'
  }),
  Object.freeze({
    id: 'animals',
    name: '动物小镇',
    subtitle: '和朋友们一起出发',
    icon: '🐾',
    description: '帮助小熊、小兔和小鸟完成心愿，一起布置温暖的小镇。',
    opening: '小兔要给森林朋友送信，请你帮忙找到通往邮局的路。',
    encouragement: '小动物们围成一圈，给你送来一场欢乐的掌声！',
    prompt: '每个正确的按键，都让森林邮包离朋友更近一步。',
    accent: '#80a7e7',
    backdrop: 'linear-gradient(135deg, #e5f4fe, #e8f4dd 53%, #fff1de)'
  })
]);

const SOUND_KEY = 'keyplanet-sound-enabled-v1';
let soundEnabled = true;
let audioContext;
let arcadeVoice;
const activeVoices = new Set();
try { soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false'; } catch { /* storage can be unavailable */ }

export function isSoundEnabled() { return soundEnabled; }

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
  if (!soundEnabled) activeVoices.forEach(stopVoice);
  try { localStorage.setItem(SOUND_KEY, String(soundEnabled)); } catch { /* optional persistence */ }
  return soundEnabled;
}

function stopVoice(voice) {
  voice.forEach(oscillator => {
    try { oscillator.stop(); } catch { /* already ended */ }
  });
  voice.clear();
  activeVoices.delete(voice);
}

function playNotes(notes, pitch = 1) {
  if (!soundEnabled || typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const voice = new Set();
  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const start = audioContext.currentTime + .015;
    activeVoices.add(voice);
    for (const [frequency, offset, duration, wave = 'sine', endFrequency = frequency] of notes) {
      const onset = start + offset;
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency * pitch, onset);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency * pitch, onset + duration);
      volume.gain.setValueAtTime(.0001, onset);
      volume.gain.exponentialRampToValueAtTime(.04, onset + .015);
      volume.gain.exponentialRampToValueAtTime(.0001, onset + duration);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      voice.add(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect();
        volume.disconnect();
        voice.delete(oscillator);
        if (!voice.size) activeVoices.delete(voice);
      };
      oscillator.start(onset);
      oscillator.stop(onset + duration + .01);
    }
    return voice;
  } catch {
    stopVoice(voice);
  }
}

const soundCues = {
  tap: [[660, 0, .07]],
  error: [[330, 0, .12], [294, .12, .17]],
  success: [[523, 0, .12], [659, .11, .12], [784, .22, .23]]
};

const arcadeHits = {
  race: [[300, 0, .16, 'triangle', 520]],
  slice: [[840, 0, .085, 'triangle', 310], [440, .055, .09]],
  target: [[620, 0, .09, 'sine', 910], [988, .06, .12]],
  build: [[310, 0, .09, 'triangle'], [465, .065, .1, 'triangle']],
  memory: [[587, 0, .12], [784, .085, .14]]
};

export function playSound(kind = 'success') {
  return Boolean(playNotes(soundCues[kind] || soundCues.success));
}

export function stopArcadeSound() {
  if (arcadeVoice) stopVoice(arcadeVoice);
  arcadeVoice = undefined;
}

export function playArcadeSound(kind, outcome, combo = 0, milestone = false) {
  stopArcadeSound();
  if (outcome === 'finish') {
    arcadeVoice = playNotes([[523, 0, .14], [659, .10, .14], [784, .20, .16], [1047, .32, .26]]);
  } else if (outcome === 'hit') {
    const notes = arcadeHits[kind] || arcadeHits.target;
    const pitch = 1 + Math.max(0, Math.min(combo - 1, 5)) * .075;
    arcadeVoice = playNotes(milestone ? [...notes, [784, .14, .16], [1047, .23, .18]] : notes, pitch);
  } else if (outcome !== 'skip') {
    arcadeVoice = playNotes(outcome === 'timeout' ? [[392, 0, .12], [330, .08, .13]] : [[392, 0, .12, 'sine', 329]]);
  }
}

/** Trigger a non-blocking celebration. Pass motion:false to suppress moving confetti. */
export function celebrate({ motion = true, sound = true } = {}) {
  if (sound) playSound('success');
  if (typeof document === 'undefined') return;
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!motion || reduced) return;
  const layer = document.createElement('div');
  layer.className = 'kp-celebration';
  layer.setAttribute('aria-hidden', 'true');
  const colors = ['#f7b75d', '#5ec8a3', '#80b6f1', '#f48f9a', '#f5d875', '#b2a7ed'];
  for (let i = 0; i < 44; i += 1) {
    const piece = document.createElement('i');
    piece.className = 'kp-confetti';
    piece.style.setProperty('--kp-x', `${8 + Math.random() * 84}vw`);
    piece.style.setProperty('--kp-drift', `${Math.round((Math.random() - 0.5) * 180)}px`);
    piece.style.setProperty('--kp-rotation', `${Math.round((Math.random() - 0.5) * 900)}deg`);
    piece.style.setProperty('--kp-delay', `${(Math.random() * 0.45).toFixed(2)}s`);
    piece.style.setProperty('--kp-duration', `${(2.1 + Math.random() * 1.2).toFixed(2)}s`);
    piece.style.setProperty('--kp-color', colors[i % colors.length]);
    if (i % 3 === 0) piece.classList.add('kp-confetti-round');
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4000);
}
