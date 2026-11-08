const sceneNames = {race:'极速赛道',slice:'水果快切',target:'星光投递',build:'梦想工坊',memory:'记忆翻牌'};
const templates = {
 race:`<div class="arcade-scene__sky"><span class="arcade-cloud cloud-one">☁</span><span class="arcade-cloud cloud-two">☁</span><span class="arcade-sun">✦</span><div class="arcade-mountains"></div></div><div class="race-track"><div class="race-lanes"></div><div class="race-finish">🏁</div><div class="race-car"><span>🚙</span><i>✦</i></div></div><div class="arcade-ground"></div>`,
 slice:`<div class="slice-sun">☀</div><div class="slice-foliage">🌿 <span>🍃</span> 🌿</div><div class="slice-fruit"><span class="fruit-half fruit-left">🍉</span><span class="fruit-half fruit-right">🍉</span><div class="arcade-scene__target fruit-target"></div></div><div class="slice-table"></div>`,
 target:`<div class="target-stars">✧　✦　·　✧　✦</div><div class="target-orbit orbit-one"></div><div class="target-orbit orbit-two"></div><div class="target-platform">🚀<span class="target-trail">✦</span></div><div class="target-bullseye"><div class="arcade-scene__target"></div></div>`,
 build:`<div class="build-sun">☀</div><div class="build-cloud">☁　☁</div><div class="build-land"></div><div class="build-tower"><div class="build-roof">▲</div><div class="build-floor floor-four">▣</div><div class="build-floor floor-three">▣</div><div class="build-floor floor-two">▣</div><div class="build-floor floor-one">▣</div></div><div class="build-crane">🏗️</div><div class="arcade-scene__target build-target"></div>`,
 memory:`<div class="memory-stars">✦　✧　✦</div><div class="memory-cards"></div><div class="memory-bottom">观察 · 记住 · 输入</div>`
};
const escapeTarget = value => String(value ?? '').slice(0,32);
const allowedBackdrops = new Set(['sunset','fruit','space','sky','ocean','forest','garden']);
const chapterTokens = {slice: '◐', target: '✦', memory: '◇'};

/** Keep the same scenery in place so progress transitions survive each new prompt. */
export function mountArcadeScene(container, {type, icon, backdrop}) {
  const kind = Object.hasOwn(templates, type) ? type : 'race';
  const scene = document.createElement('div');
  scene.className = `arcade-scene scene-${kind}`;
  if (allowedBackdrops.has(backdrop)) scene.classList.add(`backdrop-${backdrop}`);
  scene.setAttribute('role', 'img');
  scene.innerHTML = templates[kind];

  const iconText = Array.from(icon || '').slice(0, 8).join('');
  if (iconText) {
    if (kind === 'race') scene.querySelector('.race-car span').textContent = iconText;
    if (kind === 'slice') scene.querySelectorAll('.fruit-half').forEach(part => { part.textContent = iconText; });
    if (kind === 'target') scene.querySelector('.target-platform').firstChild.textContent = iconText;
    if (kind === 'build') scene.querySelector('.build-crane').textContent = iconText;
  }
  let prompt = scene.querySelector('.arcade-scene__target');
  if (kind === 'race' || kind === 'memory') {
    prompt = document.createElement(kind === 'memory' ? 'span' : 'div');
    prompt.className = kind === 'memory' ? 'memory-card' : 'arcade-scene__target race-target';
    (kind === 'memory' ? scene.querySelector('.memory-cards') : scene).append(prompt);
  }
  const effects = document.createElement('div');
  effects.className = 'arcade-impact';
  effects.setAttribute('aria-hidden', 'true');
  const tokens = [];
  if (chapterTokens[kind]) {
    const shelf = document.createElement('div');
    shelf.className = 'arcade-chapters';
    shelf.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 4; index++) {
      const token = document.createElement('span');
      token.textContent = chapterTokens[kind];
      tokens.push(token);
      shelf.append(token);
    }
    scene.append(shelf);
  }
  scene.append(effects);
  container.replaceChildren(scene);

  function update({target = '', progress, combo, hidden = false}) {
    // In memory games, keep the answer out of the DOM while the card is face down.
    prompt.textContent = hidden ? (iconText || '?') : escapeTarget(target);
    prompt.hidden = !hidden && target === '';
    scene.classList.toggle('feedback-hidden', hidden);
    scene.classList.toggle('ap-boost', combo >= 3);
    const chapter = Math.floor(progress * 4);
    scene.dataset.stage = String(chapter);
    tokens.forEach((token, index) => token.classList.toggle('chapter-earned', index < chapter));
    scene.style.setProperty('--arcade-progress', String(progress));
    scene.setAttribute('aria-label', `${sceneNames[kind]}，场景进度 ${Math.round(progress * 100)}%`);
  }

  function impact(outcome, {combo = 0, milestone = false} = {}) {
    const effect = document.createElement('div');
    effect.className = `impact-event impact-${outcome}`;
    if (combo >= 3 || milestone) effect.classList.add('impact-powered');
    if (outcome === 'hit' && kind === 'slice') {
      for (const side of ['left', 'right']) {
        const piece = document.createElement('span');
        piece.className = `impact-fruit impact-fruit-${side}`;
        piece.textContent = iconText || '🍉';
        effect.append(piece);
      }
    }
    if (outcome === 'hit' || outcome === 'finish') {
      const sparks = document.createElement('span');
      sparks.className = 'impact-sparks';
      sparks.textContent = '✦   ·   ✧';
      effect.append(sparks);
    }
    effects.replaceChildren(effect);
    effect.addEventListener('animationend', event => {
      if (event.target === effect) effect.remove();
    });
  }

  return {update, impact, clearEffects: () => effects.replaceChildren()};
}
