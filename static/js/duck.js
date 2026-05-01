(() => {
  const wrapper = document.querySelector('.avatar-wrapper');
  if (!wrapper) return;

  const msg = document.createElement('div');
  msg.textContent = '> quack';
  msg.style.cssText = 'font-family:monospace;font-size:var(--font-xs);color:var(--primary-color);text-align:center;opacity:0;transition:opacity 0.4s;pointer-events:none;';
  wrapper.parentNode.insertBefore(msg, wrapper.nextSibling);

  wrapper.style.cursor = 'pointer';

  let timer;
  wrapper.addEventListener('click', () => {
    clearTimeout(timer);
    msg.style.opacity = '1';
    timer = setTimeout(() => { msg.style.opacity = '0'; }, 2000);
  });
})();
