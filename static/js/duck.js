(() => {
  const wrapper = document.querySelector('.avatar-wrapper');
  if (!wrapper) return;

  /* Duck overlay — preloaded and layered above avatar, below scan beam */
  const duck = document.createElement('img');
  duck.src = '/general/duck_mascot.png';
  duck.alt = '';
  duck.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.3s;z-index:2;pointer-events:none;';
  wrapper.appendChild(duck);

  /* Quack message */
  const msg = document.createElement('div');
  msg.textContent = '> quack';
  msg.style.cssText = 'font-family:monospace;font-size:var(--font-xs);color:var(--primary-color);text-align:center;opacity:0;pointer-events:none;';
  wrapper.parentNode.insertBefore(msg, wrapper.nextSibling);

  wrapper.style.cursor = 'pointer';

  let duckTimer, quackTimer;

  wrapper.addEventListener('click', () => {
    /* Duck: glitch and slow fade-in start together; hold, then 1.5s fade out */
    clearTimeout(duckTimer);
    wrapper.classList.remove('duck-reveal');
    void wrapper.offsetWidth;           // restart glitch animation on rapid clicks
    wrapper.classList.add('duck-reveal');
    duck.style.transition = 'opacity 1s';
    duck.style.opacity = '1';
    duckTimer = setTimeout(() => {
      duck.style.transition = 'opacity 1.5s';
      duck.style.opacity = '0';
    }, 1800);

    /* Quack text: flicker on each click */
    clearTimeout(quackTimer);
    msg.style.transition = 'none';
    msg.style.opacity = '0';
    void msg.offsetHeight;
    msg.style.transition = 'opacity 0.12s';
    msg.style.opacity = '1';
    quackTimer = setTimeout(() => {
      msg.style.transition = 'opacity 0.8s';
      msg.style.opacity = '0';
    }, 600);
  });
})();
