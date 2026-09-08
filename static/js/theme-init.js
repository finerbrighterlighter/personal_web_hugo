/**
 * theme-init.js — blocking boot script (classic, non-module).
 *
 * Loaded synchronously in <head> from partials/theme-data.html so it runs
 * before the body paints (no flash of wrong theme). It used to be an inline
 * script; it lives here so the site can ship a Content-Security-Policy
 * without 'unsafe-inline' for scripts.
 *
 * Inputs (all read from the DOM, no template interpolation):
 *   <script id="theme-data" type="application/json">   palette list (data/themes.yml)
 *   <script src="/js/theme-init.js" data-ttl="60" data-lang="en">
 *       data-ttl   cache TTL in minutes (site.Params.cacheTTLMinutes)
 *       data-lang  Hugo language key; "mm" enables the Burmese font-mode check
 *   <meta name="theme-color">                         updated to the active background
 *
 * Responsibilities:
 *   1. Flush expired localStorage cache entries (shared TTL with cache.js).
 *   2. Resolve mode (saved → system preference) and palettes (saved → defaults).
 *   3. Write --dark-* / --light-* CSS custom properties onto :root.
 *   4. Set data-theme, data-mm-font, and the theme-color meta.
 */
(function () {
    var script = document.currentScript;
    var TTL = (parseInt(script && script.dataset.ttl, 10) || 60) * 60 * 1000;
    var LANG = (script && script.dataset.lang) || 'en';
    var CACHE_PREFIX = 'cache:';
    var SITE_KEYS = ['theme-mode', 'mmFontMode'];
    var SITE_PREFIXES = ['theme-palette-'];

    function isSitePreferenceKey(key) {
        if (SITE_KEYS.indexOf(key) !== -1) return true;
        for (var i = 0; i < SITE_PREFIXES.length; i++) {
            if (key.indexOf(SITE_PREFIXES[i]) === 0) return true;
        }
        return false;
    }

    function parseCacheEntry(raw) {
        if (!raw) return null;
        try {
            var parsed = JSON.parse(raw);
            if (parsed && parsed.__cache === true && typeof parsed.ts === 'number') {
                return parsed;
            }
            if (parsed && typeof parsed.ts === 'number' && Object.prototype.hasOwnProperty.call(parsed, 'data')) {
                return parsed;
            }
        } catch (error) {}
        return null;
    }

    function hasExpiredCacheSession() {
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (!key) continue;
                if (key.indexOf(CACHE_PREFIX) !== 0 && isSitePreferenceKey(key)) continue;
                var entry = parseCacheEntry(localStorage.getItem(key));
                if (!entry) continue;
                if (Date.now() - entry.ts > TTL) return true;
            }
        } catch (error) {}
        return false;
    }

    function clearSiteStorage() {
        try {
            var remove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (!key) continue;
                if (key.indexOf(CACHE_PREFIX) === 0 || isSitePreferenceKey(key) || parseCacheEntry(localStorage.getItem(key))) {
                    remove.push(key);
                }
            }
            for (var j = 0; j < remove.length; j++) {
                localStorage.removeItem(remove[j]);
            }
        } catch (error) {}
    }

    if (hasExpiredCacheSession()) {
        clearSiteStorage();
    }

    var raw  = JSON.parse(document.getElementById('theme-data').textContent);
    var data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    function isDefault(t, mode) {
        return Array.isArray(t.default)
            ? t.default.indexOf(mode) !== -1
            : t.default === mode;
    }

    var defaultDark  = null;
    var defaultLight = null;
    for (var i = 0; i < data.length; i++) {
        if (isDefault(data[i], 'dark'))  defaultDark  = data[i];
        if (isDefault(data[i], 'light')) defaultLight = data[i];
    }

    var savedMode = null, savedDarkPalette = null, savedLightPalette = null;
    try {
        savedMode         = localStorage.getItem('theme-mode');
        savedDarkPalette  = localStorage.getItem('theme-palette-dark');
        savedLightPalette = localStorage.getItem('theme-palette-light');
    } catch (error) {}

    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = savedMode || (systemDark ? 'dark' : 'light');

    function findById(id) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].id === id) return data[i];
        }
        return null;
    }

    var darkPalette  = (savedDarkPalette  && findById(savedDarkPalette))  || defaultDark;
    var lightPalette = (savedLightPalette && findById(savedLightPalette)) || defaultLight;

    var root = document.documentElement;

    function applyPalette(palette, modeKey) {
        var c = palette[modeKey];
        var p = modeKey + '-';
        root.style.setProperty('--' + p + 'background-color',        c.background);
        root.style.setProperty('--' + p + 'font-color',              c.font);
        root.style.setProperty('--' + p + 'invert-font-color',       c.invert_font);
        root.style.setProperty('--' + p + 'primary-color',           c.primary);
        root.style.setProperty('--' + p + 'secondary-color',         c.secondary);
        root.style.setProperty('--' + p + 'tertiary-color',          c.tertiary || c.secondary);
        root.style.setProperty('--' + p + 'error-color',             c.error);
        root.style.setProperty('--' + p + 'progress-bar-background', c.progress_bar_background);
        root.style.setProperty('--' + p + 'progress-bar-fill',       c.progress_bar_fill);
        root.style.setProperty('--' + p + 'code-bg-color',           c.code_bg);
    }

    applyPalette(darkPalette,  'dark');
    applyPalette(lightPalette, 'light');

    root.dataset.theme = mode;

    // Browser chrome colour (mobile address bar, PWA title bar) follows the active background.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        var active = mode === 'dark' ? darkPalette : lightPalette;
        meta.setAttribute('content', active[mode].background);
    }

    // Burmese pages: restore the "neat" (clear) font mode chosen via mm_font_toggle.js.
    if (LANG === 'mm') {
        try {
            if (localStorage.getItem('mmFontMode') === 'clear') {
                root.dataset.mmFont = 'clear';
            }
        } catch (error) {}
    }
})();
