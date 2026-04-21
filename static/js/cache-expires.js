const TTL = (window.CONFIG?.cacheTTLMinutes ?? 60) * 60 * 1000;
const line = document.getElementById('cache-expire-line');

function soonestExpiry() {
  let min = Infinity;
  for (let i = 0; i < localStorage.length; i++) {
    try {
      const { ts } = JSON.parse(localStorage.getItem(localStorage.key(i)));
      if (typeof ts === 'number') {
        const rem = TTL - (Date.now() - ts);
        if (rem > 0 && rem < min) min = rem;
      }
    } catch {}
  }
  return min === Infinity ? null : min;
}

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const mins = `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  const secs = `${sec} ${sec === 1 ? 'second' : 'seconds'}`;
  return m > 0 ? `${mins} ${secs}` : secs;
}

function tick() {
  const rem = soonestExpiry();
  const ttl = window.CONFIG?.cacheTTLMinutes ?? 60;
  line.textContent = rem ? `[expires] ${fmt(rem)}` : `[expires] ${ttl} ${ttl === 1 ? 'minute' : 'minutes'}`;
}

tick();
setInterval(tick, 1000);

function doFlush() {
  localStorage.clear();
  setTimeout(() => location.reload(), 400);
}

const btns = document.getElementById('cache-flush-btns');

function setBtns(text) {
  btns.innerHTML = `<a>${text}</a>`;
}

const clearBtn = document.getElementById('cache-clear-btn');
if (clearBtn) {
  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setBtns('[flushing]');
    doFlush();
  });
}

const slowBtn = document.getElementById('cache-slow-btn');
if (slowBtn) {
  let running = false;
  slowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (running) return;
    running = true;
    const steps = [
      ['Really?',    2000],
      ['Why though?',2000],
      ['Okay...',    2000],
      ['Whatever.',  3000],
      ['It is 10.',  1000],
    ];
    function run(i) {
      if (i >= steps.length) {
        setBtns('[flushing]');
        doFlush();
        return;
      }
      setBtns(steps[i][0]);
      setTimeout(() => run(i + 1), steps[i][1]);
    }
    run(0);
  });
}
