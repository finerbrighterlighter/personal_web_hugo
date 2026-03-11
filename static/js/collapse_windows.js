document.querySelectorAll(".terminal-window").forEach(win => {
  const header = win.querySelector(".window-header");

  header.addEventListener("click", (e) => {
  if (e.target.closest(".window-controls")) return;
  win.classList.toggle("collapsed");
});
});