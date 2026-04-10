(function () {
    const raw  = JSON.parse(document.getElementById('theme-data').textContent);
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const root   = document.documentElement;
    const toggle = document.getElementById('theme-toggle');
    const select = document.getElementById('theme-palette-select');

    // ── helpers ──────────────────────────────────────────────────────────────
    
    function isDefault(t, mode) {
        return Array.isArray(t.default)
            ? t.default.includes(mode)
            : t.default === mode;
    }
 
    const defaultDark  = data.find(t => isDefault(t, 'dark'));
    const defaultLight = data.find(t => isDefault(t, 'light'));

    function findById(id) {
        return data.find(t => t.id === id) || null;
    }

    function getCurrentMode() {
        return root.dataset.theme || 'light';
    }

    function getSavedPaletteId(mode) {
        return localStorage.getItem('theme-palette-' + mode);
    }

    function getActivePalette(mode) {
        const saved = getSavedPaletteId(mode);
        return (saved && findById(saved)) || (mode === 'dark' ? defaultDark : defaultLight);
    }

    // ── apply vars ───────────────────────────────────────────────────────────
    // Writes --{mode}-* custom properties as inline styles on :root.
    // Called from the inline script on load; called here only when palette changes.

    function applyPalette(palette, modeKey) {
        const c = palette[modeKey];
        const p = modeKey + '-';
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

    // ── UI sync ───────────────────────────────────────────────────────────────

    function updateEmoji(mode) {
        toggle.textContent = mode === 'dark' ? '☀️' : '🌙';
    }

    function updateSelectValue(mode) {
        const paletteId = getActivePalette(mode).id;
        select.value = mode + '-' + paletteId;
    }

    // Puts ✓ only in the OTHER mode's group — the native select checkmark
    // already marks the current mode's active option, so we avoid doubling.
    function updateTicks(currentMode) {
        const otherMode = currentMode === 'dark' ? 'light' : 'dark';
        const otherId   = getActivePalette(otherMode).id;
 
        const otherGroup   = otherMode === 'light' ? lightGroup : darkGroup;
        const currentGroup = currentMode === 'dark' ? darkGroup  : lightGroup;
 
        otherGroup.querySelectorAll('option').forEach(opt => {
            const id = opt.value.slice((otherMode + '-').length);
            // opt.textContent = (id === otherId ? '✓ ' : '  ') + findById(id).label;
        });
 
        currentGroup.querySelectorAll('option').forEach(opt => {
            const id = opt.value.slice((currentMode + '-').length);
            // opt.textContent = findById(id).label;
        });
    }
    

    // ── build dropdown ────────────────────────────────────────────────────────

    const lightGroup = select.querySelector('optgroup[data-mode="light"]');
    const darkGroup  = select.querySelector('optgroup[data-mode="dark"]');

    data.forEach(theme => {
        const lo = document.createElement('option');
        lo.value       = 'light-' + theme.id;
        lo.textContent = theme.label;
        lightGroup.appendChild(lo);

        const do_ = document.createElement('option');
        do_.value       = 'dark-' + theme.id;
        do_.textContent = theme.label;
        darkGroup.appendChild(do_);
    });

    // ── init UI (vars already applied by inline script) ───────────────────────

    const initialMode = getCurrentMode();
    updateEmoji(initialMode);
    updateSelectValue(initialMode);
    updateTicks(initialMode);

    function dispatchThemeChanged() {
        document.dispatchEvent(new CustomEvent('theme-changed'));
    }
 
    // ── toggle: switch between the two ticked themes ──────────────────────────
 
    toggle.addEventListener('click', function () {
        const current = getCurrentMode();
        const next    = current === 'dark' ? 'light' : 'dark';
 
        root.dataset.theme = next;
        localStorage.setItem('theme-mode', next);
 
        updateEmoji(next);
        updateSelectValue(next);
        updateTicks(next);
        dispatchThemeChanged();
    });
 
    // ── dropdown: pick any mode + palette, tick moves ─────────────────────────
 
    select.addEventListener('change', function () {
        const dash      = select.value.indexOf('-');
        const mode      = select.value.slice(0, dash);
        const paletteId = select.value.slice(dash + 1);
 
        const palette = findById(paletteId);
        if (!palette) return;
 
        applyPalette(palette, mode);
 
        root.dataset.theme = mode;
        localStorage.setItem('theme-mode',            mode);
        localStorage.setItem('theme-palette-' + mode, paletteId);
 
        updateEmoji(mode);
        updateSelectValue(mode);
        updateTicks(mode);
        dispatchThemeChanged();
    });

})();
