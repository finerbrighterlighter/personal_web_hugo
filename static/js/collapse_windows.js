document.addEventListener("DOMContentLoaded", () => {

  // --------------------------------------------------
  // Responsive breakpoint used by CSS (mobile layout)
  // --------------------------------------------------
  const mq = window.matchMedia("(max-width: 767px)");

  // Detect homepage so we don't auto-collapse there
  const isHome =
    window.location.pathname === "/" ||
    window.location.pathname === "";

  // --------------------------------------------------
  // PANEL COLLAPSE / EXPAND BEHAVIOR
  // --------------------------------------------------
  document.querySelectorAll(".terminal-window").forEach(win => {

    const header = win.querySelector(".window-header");

    // Make the header keyboard-navigable as a toggle button
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");

    // --------------------------------------------------
    // RIGHT SIDEBAR: restore saved state
    // Each panel stores its state using its window title
    // Example key: "panel-music.sh"
    // --------------------------------------------------
    if (win.classList.contains("panel")) {

      const title = win.querySelector(".window-title")?.textContent.trim();
      const key = `panel-${title}`;

      const saved = sessionStorage.getItem(key);

      if (saved !== null) {
        win.classList.toggle("collapsed", saved === "true");
      }

      // Store the key on the element so we don't recompute it later
      win.dataset.storageKey = key;
    }

    // Set initial aria-expanded to match current visual state
    header.setAttribute("aria-expanded", !win.classList.contains("collapsed"));

    const content = win.querySelector(".window-content");
    if (content) {
      if (!content.id) {
        const title = win.querySelector(".window-title")?.textContent.trim() || "";
        const idx = Array.from(win.parentNode.children).indexOf(win);
        content.id = "window-content-" + (title || "panel") + "-" + idx;
      }
      header.setAttribute("aria-controls", content.id);
    }

    function togglePanel() {
      win.classList.toggle("collapsed");
      header.setAttribute("aria-expanded", !win.classList.contains("collapsed"));

      if (win.classList.contains("panel")) {
        const key = win.dataset.storageKey;
        sessionStorage.setItem(key, win.classList.contains("collapsed"));
      }
    }

    // --------------------------------------------------
    // Click header to toggle collapse
    // Ignore clicks on the fake window control buttons
    // --------------------------------------------------
    header.addEventListener("click", (e) => {
      if (e.target.closest(".window-controls")) return;
      togglePanel();
    });

    // Keyboard: Enter or Space activates the toggle
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        togglePanel();
      }
    });
  });


  // --------------------------------------------------
  // LEFT SIDEBAR AUTO-COLLAPSE (mobile layout)
  //
  // Logic:
  // mobile + not homepage → collapse
  // desktop OR homepage → expand
  //
  // This runs when the page loads AND when the viewport
  // crosses the mobile breakpoint.
  // --------------------------------------------------
  function applyLayout(e) {

    document.querySelectorAll(".sidebar").forEach(win => {
      const header = win.querySelector(".window-header");
      const hasPostToc = win.dataset.hasPostToc === "true";

      if (hasPostToc) {
        win.classList.add("collapsed");
      } else if (e.matches && !isHome) {
        win.classList.add("collapsed");
      } else {
        win.classList.remove("collapsed");
      }

      if (header) {
        header.setAttribute("aria-expanded", !win.classList.contains("collapsed"));
      }
    });

  }

  // Run once on load
  applyLayout(mq);

  // Run again when crossing mobile breakpoint
  mq.addEventListener("change", applyLayout);

});
