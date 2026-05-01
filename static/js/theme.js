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
        if (getActivePalette(mode).id === 'duck') {
            const filter = mode === 'light' ? 'grayscale(100%)' : 'none';
            toggle.innerHTML = `<img src="/favicon-32x32.png" alt="duck" style="width:1.1rem;height:1.1rem;vertical-align:middle;filter:${filter};">`;
        } else {
            toggle.textContent = mode === 'dark' ? '○' : '●';
        }
    }

    function updateSelectValue(mode) {
        const paletteId = getActivePalette(mode).id;
        select.value = mode + '-' + paletteId;
    }

    // Bolds the session-active palette in each group so both cycle targets are visible.
    function updateTicks() {
        [[lightGroup, 'light'], [darkGroup, 'dark']].forEach(([group, mode]) => {
            const activeId = getActivePalette(mode).id;
            group.querySelectorAll('option').forEach(opt => {
                const id = opt.value.slice((mode + '-').length);
                opt.textContent      = findById(id).label;
                opt.style.fontWeight = id === activeId ? 'bold' : '';
                opt.style.fontStyle  = id === activeId ? 'italic' : '';
            });
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
    root.dataset.palette = getActivePalette(initialMode).id;

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
        updateCvdBtn(next);
        root.dataset.palette = getActivePalette(next).id;
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
        updateCvdBtn(mode);
        root.dataset.palette = paletteId;
        dispatchThemeChanged();
    });

    // ── CVD shortcut ──────────────────────────────────────────────────────────

    const cvdBtn = document.getElementById('cvd-shortcut');

    function syncSelectTo(mode, paletteId) {
        const target = mode + '-' + paletteId;
        Array.from(select.options).forEach(opt => {
            opt.selected = opt.value === target;
        });
    }

    function updateCvdBtn(mode) {
        if (!cvdBtn) return;
        const active = getActivePalette(mode).id === 'colorblind';
        cvdBtn.setAttribute('aria-pressed', String(active));
    }

    if (cvdBtn) {
        updateCvdBtn(initialMode);

        cvdBtn.addEventListener('click', function () {
            const mode    = getCurrentMode();
            const current = getActivePalette(mode).id;

            const targetId = current === 'colorblind'
                ? (mode === 'dark' ? defaultDark : defaultLight).id
                : 'colorblind';

            const palette = findById(targetId);
            if (!palette) return;

            applyPalette(palette, mode);
            localStorage.setItem('theme-palette-' + mode, targetId);

            syncSelectTo(mode, targetId);
            updateTicks();
            updateCvdBtn(mode);
            root.dataset.palette = targetId;
            dispatchThemeChanged();
        });
    }

})();
