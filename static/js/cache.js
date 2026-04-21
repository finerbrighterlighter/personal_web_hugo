export function getCache(key) {
  const cached = sessionStorage.getItem(key);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

export function setCache(key, data) {
  sessionStorage.setItem(key, JSON.stringify(data));
}
