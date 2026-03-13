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

    // --------------------------------------------------
    // Click header to toggle collapse
    // Ignore clicks on the fake window control buttons
    // --------------------------------------------------
    header.addEventListener("click", (e) => {

      if (e.target.closest(".window-controls")) return;

      win.classList.toggle("collapsed");

      // --------------------------------------------------
      // Save state only for right sidebar panels
      // --------------------------------------------------
      if (win.classList.contains("panel")) {

        const key = win.dataset.storageKey;

        sessionStorage.setItem(
          key,
          win.classList.contains("collapsed")
        );
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

      if (e.matches && !isHome) {
        win.classList.add("collapsed");
      } else {
        win.classList.remove("collapsed");
      }

    });

  }

  // Run once on load
  applyLayout(mq);

  // Run again when crossing mobile breakpoint
  mq.addEventListener("change", applyLayout);

});
