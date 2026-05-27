const TTL = (window.CONFIG?.cacheTTLMinutes ?? 60) * 60 * 1000;
const CACHE_PREFIX = "cache:";
const SITE_PREFERENCE_KEYS = ["theme-mode", "mmFontMode"];
const SITE_PREFERENCE_PREFIXES = ["theme-palette-"];

function storageKey(key) {
  return `${CACHE_PREFIX}${key}`;
}

function parseEntry(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.__cache === true && typeof parsed.ts === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function parseLegacyEntry(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.ts === "number" && "data" in parsed) {
      return { __cache: true, ts: parsed.ts, data: parsed.data };
    }
    return null;
  } catch {
    return null;
  }
}

function isExpired(ts) {
  return Date.now() - ts > TTL;
}

export function listCacheEntries() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    const entry = parseEntry(localStorage.getItem(key));
    if (!entry) continue;
    entries.push({ key, ts: entry.ts, data: entry.data });
  }
  return entries;
}

export function clearCache() {
  for (const entry of listCacheEntries()) {
    localStorage.removeItem(entry.key);
  }
}

function isSitePreferenceKey(key) {
  if (SITE_PREFERENCE_KEYS.includes(key)) return true;
  return SITE_PREFERENCE_PREFIXES.some(prefix => key.startsWith(prefix));
}

function clearLegacyCacheEntries() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key.startsWith(CACHE_PREFIX) || isSitePreferenceKey(key)) continue;
    if (parseLegacyEntry(localStorage.getItem(key))) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

function clearSitePreferences() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isSitePreferenceKey(key)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function clearSiteStorage() {
  clearCache();
  clearLegacyCacheEntries();
  clearSitePreferences();
}

export function getCache(key) {
  const namespacedKey = storageKey(key);
  const entry = parseEntry(localStorage.getItem(namespacedKey));
  if (entry) {
    if (isExpired(entry.ts)) {
      localStorage.removeItem(namespacedKey);
      return null;
    }
    return entry.data;
  }

  const legacyRaw = localStorage.getItem(key);
  const legacyEntry = parseLegacyEntry(legacyRaw);
  if (!legacyEntry) return null;

  localStorage.removeItem(key);
  if (isExpired(legacyEntry.ts)) {
    return null;
  }

  localStorage.setItem(namespacedKey, JSON.stringify(legacyEntry));
  return legacyEntry.data;
}

export function setCache(key, data) {
  localStorage.removeItem(key);
  localStorage.setItem(storageKey(key), JSON.stringify({
    __cache: true,
    data,
    ts: Date.now(),
  }));
}
