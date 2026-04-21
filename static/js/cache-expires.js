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
