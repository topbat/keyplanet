// A single delegated listener keeps the effect working for all gallery cards.
let activeCard = null;
let pendingFrame = 0;
let point = null;

function clearCard(card) {
  if (!card) return;
  for (const name of ['--pointer-x', '--pointer-y', '--tilt-x', '--tilt-y', '--light-x', '--light-y']) {
    card.style.removeProperty(name);
  }
}

export function resetCardMotion() {
  if (pendingFrame) cancelAnimationFrame(pendingFrame);
  pendingFrame = 0;
  point = null;
  clearCard(activeCard);
  activeCard = null;
}

export function initCardMotion(gallery) {
  const capable = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  gallery.addEventListener('pointermove', event => {
    const card = event.target.closest('.game-card');
    if (!card || !gallery.contains(card) || !capable.matches || document.documentElement.dataset.motion !== 'on' || event.pointerType === 'touch') return;
    if (activeCard !== card) {
      clearCard(activeCard);
      activeCard = card;
    }
    point = {x: event.clientX, y: event.clientY};
    if (pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      if (!activeCard || !point || !activeCard.isConnected || document.documentElement.dataset.motion !== 'on' || !capable.matches) return;
      const rect = activeCard.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(-1, Math.min(1, ((point.x - rect.left) / rect.width - .5) * 2));
      const y = Math.max(-1, Math.min(1, ((point.y - rect.top) / rect.height - .5) * 2));
      activeCard.style.setProperty('--pointer-x', `${(x * 5).toFixed(2)}px`);
      activeCard.style.setProperty('--pointer-y', `${(y * 4).toFixed(2)}px`);
      activeCard.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
      activeCard.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
      activeCard.style.setProperty('--light-x', `${((x + 1) * 50).toFixed(1)}%`);
      activeCard.style.setProperty('--light-y', `${((y + 1) * 50).toFixed(1)}%`);
    });
  });
  gallery.addEventListener('pointerout', event => {
    const card = event.target.closest('.game-card');
    if (card && card === activeCard && !card.contains(event.relatedTarget)) resetCardMotion();
  });
  capable.addEventListener('change', () => { if (!capable.matches) resetCardMotion(); });
}
