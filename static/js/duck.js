(() => {
  const wrapper = document.querySelector('.avatar-wrapper');
  if (!wrapper) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const QUACK_POOL_SIZE = 3;
  const quackPool = Array.from({ length: QUACK_POOL_SIZE }, () => {
    const audio = new Audio('/general/duck_quack.mp3');
    audio.preload = 'auto';
    return audio;
  });
  let quackCursor = 0;

  /* Duck overlay — preloaded and layered above avatar, below scan beam */
  const duck = document.createElement('img');
  duck.src = '/general/duck_mascot.png';
  duck.alt = '';
  duck.setAttribute('aria-hidden', 'true');
  duck.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.3s;z-index:2;pointer-events:none;';
  wrapper.appendChild(duck);

  /* Three quacks: mid(1) → right(2) → left(0) → repeat */
  const CYCLE = [1, 2, 0];
  const DIM   = '0.25';

  const quackRow = document.createElement('div');
  quackRow.setAttribute('aria-hidden', 'true');
  quackRow.style.cssText = 'display:flex;justify-content:center;gap:0.4em;font-family:monospace;font-size:var(--font-xs);color:var(--primary-color);pointer-events:none;';

  const quacks = [0, 1, 2].map(() => {
    const span = document.createElement('span');
    span.textContent = 'quack';
    span.style.cssText = 'opacity:0;transition:opacity 0.3s;';
    quackRow.appendChild(span);
    return span;
  });

  wrapper.parentNode.insertBefore(quackRow, wrapper.nextSibling);
  wrapper.style.cursor = 'pointer';
  wrapper.setAttribute('aria-keyshortcuts', 'Enter Space');

  wrapper.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wrapper.click(); }
  });

  let duckTimer;
  const quackTimers = [null, null, null];
  let clickCount = 0;
  let idleTimer = null;

  function hideAllQuacks() {
    quacks.forEach((span, i) => {
      clearTimeout(quackTimers[i]);
      span.style.transition = prefersReducedMotion.matches ? 'none' : 'opacity 0.8s';
      span.style.opacity = '0';
    });
    clickCount = 0;
  }

  wrapper.addEventListener('click', () => {
    const reducedMotion = prefersReducedMotion.matches;

    /* Duck: glitch and slow fade-in start together; hold, then 1.5s fade out */
    clearTimeout(duckTimer);
    if (reducedMotion) {
      wrapper.classList.remove('duck-reveal');
      duck.style.transition = 'none';
      duck.style.opacity = '1';
      duckTimer = setTimeout(() => {
        duck.style.opacity = '0';
      }, 120);
    } else {
      wrapper.classList.remove('duck-reveal');
      void wrapper.offsetWidth;
      wrapper.classList.add('duck-reveal');
      duck.style.transition = 'opacity 1s';
      duck.style.opacity = '1';
      duckTimer = setTimeout(() => {
        duck.style.transition = 'opacity 1.5s';
        duck.style.opacity = '0';
      }, 1800);
    }

    /* Quack: cycle mid → right → left, flicker the active one */
    const idx = CYCLE[clickCount % 3];
    clickCount++;

    const span = quacks[idx];
    clearTimeout(quackTimers[idx]);
    span.style.transition = 'none';
    span.style.opacity = '0';
    void span.offsetHeight;
    span.style.transition = reducedMotion ? 'none' : 'opacity 0.12s';
    span.style.opacity = '1';
    quackTimers[idx] = setTimeout(() => {
      span.style.transition = reducedMotion ? 'none' : 'opacity 0.8s';
      span.style.opacity = DIM;
    }, 600);

    if (!reducedMotion) {
      const quackAudio = quackPool[quackCursor];
      quackCursor = (quackCursor + 1) % quackPool.length;
      quackAudio.currentTime = 0;
      quackAudio.play().catch(() => {});
    }

    /* Hide all quacks after idle */
    clearTimeout(idleTimer);
    idleTimer = setTimeout(hideAllQuacks, 1500);
  });
})();
