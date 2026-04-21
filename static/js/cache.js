const TTL = (window.CONFIG?.cacheTTLMinutes ?? 60) * 60 * 1000;

export function getCache(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCache(key, data) {
  localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
}
