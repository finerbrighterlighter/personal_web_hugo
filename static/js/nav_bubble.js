document.addEventListener("DOMContentLoaded", () => {

  // --------------------------------------------------
  // Floating section-navigation bubble
  // Self-gating: only engages when a page has 2+ .category-header
  // (home, works, posts list, blood).
  // --------------------------------------------------

  const headers = [...document.querySelectorAll(".category-header")];
  if (headers.length < 2) return;

  const reducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileMQ = window.matchMedia("(max-width: 767px)");
  const CONFIG = window.CONFIG || {};
  const label = CONFIG.navBubbleLabel || "Jump to section";
  const topLabel = CONFIG.navBubbleTop || "Top";
  const bottomLabel = CONFIG.navBubbleBottom || "Bottom";

  const GLYPH_CLOSED = "≡";
  const GLYPH_OPEN = "×";

  // --------------------------------------------------
  // Build the bubble button + menu
  // --------------------------------------------------

  const bubble = document.createElement("button");
  bubble.type = "button";
  bubble.id = "nav-bubble";
  bubble.setAttribute("aria-haspopup", "true");
  bubble.setAttribute("aria-expanded", "false");
  bubble.setAttribute("aria-controls", "nav-bubble-menu");
  bubble.setAttribute("aria-label", label);
  bubble.textContent = GLYPH_CLOSED;

  const menu = document.createElement("div");
  menu.id = "nav-bubble-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", label);
  menu.hidden = true;

  function makeRow(kind, markerChar, labelText) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-bubble-row";
    btn.setAttribute("role", "menuitem");
    btn.dataset.kind = kind;

    const marker = document.createElement("span");
    marker.className = "nav-bubble-marker";
    marker.textContent = markerChar;

    const text = document.createElement("span");
    text.className = "nav-bubble-label";
    text.textContent = labelText;

    btn.append(text, marker);
    menu.appendChild(btn);
    return btn;
  }

  const items = [];
  const sectionRows = [];

  // Fixed "scroll to top" row — always first.
  const topRow = makeRow("top", "↑", topLabel);
  topRow.addEventListener("click", () => scrollToEdge(0));
  items.push(topRow);

  // Section rows — one per .category-header.
  headers.forEach((header, i) => {
    const btn = makeRow("section", "•", header.textContent.trim().replace(/\s+/g, " "));
    btn.addEventListener("click", () => jumpTo(i));
    sectionRows.push(btn);
    items.push(btn);
  });

  // Fixed "scroll to bottom" row — always last.
  const bottomRow = makeRow("bottom", "↓", bottomLabel);
  bottomRow.addEventListener("click", () => scrollToEdge(document.documentElement.scrollHeight));
  items.push(bottomRow);

  document.body.appendChild(menu);
  document.body.appendChild(bubble);

  // --------------------------------------------------
  // Positioning:
  //   mobile (<768px): fixed bottom-right of viewport
  //   desktop (>=768px): fixed bottom, aligned to the right edge of
  //   .main-content so the right-panels column stays untouched.
  // The `right` offset is JS-owned to avoid a flash in the wrong
  // column on desktop.
  // --------------------------------------------------

  function position() {
    const main = document.querySelector(".main-content");
    let right = 20;
    if (!mobileMQ.matches && main) {
      right = Math.max(20, window.innerWidth - main.getBoundingClientRect().right + 24);
    }
    bubble.style.right = right + "px";
    // Anchor the pill stack's right edge to the main column's right edge.
    // Width is content-driven (CSS width:auto) so all pills share one
    // uniform width = the longest listing's content width.
    if (main) {
      const m = main.getBoundingClientRect();
      menu.style.right = window.innerWidth - m.right + "px";
    }
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // --------------------------------------------------
  // Radial mask solid radius
  // (removed in v13 — per-row pills need no shared mask geometry)
  // --------------------------------------------------

  function onViewportChange() {
    position();
  }

  position();
  window.addEventListener("resize", debounce(onViewportChange, 150));
  mobileMQ.addEventListener("change", onViewportChange);

  // --------------------------------------------------
  // Open / close
  // --------------------------------------------------

  let closeTimer = null;

  function openMenu() {
    clearTimeout(closeTimer);
    menu.classList.remove("is-open");
    menu.hidden = false;
    requestAnimationFrame(() => {
      menu.classList.add("is-open");
    });
    bubble.textContent = GLYPH_OPEN;
    bubble.setAttribute("aria-expanded", "true");
    const first = items[0];
    if (first) first.focus();
  }

  function closeMenu(returnFocus) {
    clearTimeout(closeTimer);
    menu.classList.remove("is-open");
    bubble.textContent = GLYPH_CLOSED;
    bubble.setAttribute("aria-expanded", "false");
    if (returnFocus) bubble.focus();
    closeTimer = setTimeout(() => {
      menu.hidden = true;
    }, 170);
  }

  bubble.addEventListener("click", () => {
    if (menu.hidden) openMenu();
    else closeMenu(false);
  });

  // Click outside the bubble/menu closes it (bubble's own clicks
  // are excluded so its toggle listener wins).
  document.addEventListener("click", (e) => {
    if (menu.hidden) return;
    if (e.target !== bubble && !menu.contains(e.target)) closeMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      e.preventDefault();
      closeMenu(true);
    }
  });

  // --------------------------------------------------
  // Active-section highlight
  // --------------------------------------------------

  function setActive(i) {
    sectionRows.forEach((btn, idx) => {
      if (btn.dataset.kind !== "section") return;
      btn.classList.toggle("active", idx === i);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    let current = -1;
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio > 0) {
        const idx = headers.indexOf(entry.target);
        if (idx > current) current = idx;
      }
    }
    if (current !== -1) setActive(current);
  }, { rootMargin: "0px 0px -70% 0px", threshold: 0 });

  headers.forEach((h) => observer.observe(h));

  // --------------------------------------------------
  // Jump to section
  // --------------------------------------------------

  function jumpTo(i) {
    const target = headers[i];
    if (!target) return;
    target.scrollIntoView({
      block: "start",
      behavior: reducedMotion ? "auto" : "smooth"
    });
    closeMenu(false);
    bubble.focus();
  }

  // Scroll the window to an absolute offset (Top row / Bottom row).
  function scrollToEdge(top) {
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    closeMenu(true);
  }

});
