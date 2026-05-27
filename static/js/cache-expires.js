import { clearSiteStorage, listCacheEntries } from './cache.js';

const TTL = (window.CONFIG?.cacheTTLMinutes ?? 60) * 60 * 1000;
const FLUSH_RELOAD_DELAY = 400;  // ms before reloading after site storage reset
const line = document.getElementById('cache-expire-line');

let expiryTimer = null;
let scheduledReloadAt = null;

function soonestExpiry() {
  const entries = listCacheEntries();
  let min = Infinity;
  for (const entry of entries) {
    const rem = TTL - (Date.now() - entry.ts);
    if (rem > 0 && rem < min) min = rem;
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
  if (line) {
    line.textContent = rem ? `[expires] ${fmt(rem)}` : `[expires] ${ttl} ${ttl === 1 ? 'minute' : 'minutes'}`;
  }
  scheduleExpiryReload(rem);
}

function reloadAfterExpiry() {
  clearSiteStorage();
  scheduledReloadAt = null;
  expiryTimer = null;
  setTimeout(() => location.reload(), FLUSH_RELOAD_DELAY);
}

function scheduleExpiryReload(rem) {
  if (!rem) {
    if (expiryTimer) {
      clearTimeout(expiryTimer);
      expiryTimer = null;
    }
    scheduledReloadAt = null;
    return;
  }

  const targetAt = Date.now() + rem;
  if (scheduledReloadAt && Math.abs(scheduledReloadAt - targetAt) < 250) {
    return;
  }

  if (expiryTimer) clearTimeout(expiryTimer);
  scheduledReloadAt = targetAt;
  expiryTimer = setTimeout(reloadAfterExpiry, Math.max(rem, 0));
}

tick();
setInterval(tick, 1000);

function doFlush() {
  clearSiteStorage();
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  scheduledReloadAt = null;
  setTimeout(() => location.reload(), FLUSH_RELOAD_DELAY);
}

const btns = document.getElementById('cache-flush-btns');

function setBtns(text) {
  btns.innerHTML = `<span>${text}</span>`;
}

const clearBtn = document.getElementById('cache-clear-btn');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    setBtns('[flushing]');
    doFlush();
  });
}

const slowBtn = document.getElementById('cache-slow-btn');
if (slowBtn) {
  let running = false;
  slowBtn.addEventListener('click', () => {
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
