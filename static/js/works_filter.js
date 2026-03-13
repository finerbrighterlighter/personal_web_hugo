const buttons = document.querySelectorAll("#works-filters button[data-filter]");
const posts = document.querySelectorAll(".post");
document.querySelectorAll(".more-toggle").forEach(btn => {

    btn.addEventListener("click", () => {
  
      const tags = btn.parentElement.querySelector(".more-tags");
  
      tags.classList.toggle("collapsed");
  
      btn.textContent = tags.classList.contains("collapsed")
        ? "+ more"
        : "− less";
  
    });
  
  });
  
let filters = {
  condition: "all",
  datasource: "all",
  method: "all"
};

function updateVisibility() {

  posts.forEach(post => {

    const cond = post.dataset.condition || "";
    const datasource = post.dataset.datasource || "";
    const method = post.dataset.method || "";

    const visible =
      (filters.condition === "all" || cond.includes(filters.condition)) &&
      (filters.datasource === "all" || datasource.includes(filters.datasource)) &&
      (filters.method === "all" || method.includes(filters.method));

    post.style.display = visible ? "" : "none";
  });

  document.querySelectorAll(".year-group").forEach(group => {
    const visible = group.querySelectorAll(".post:not([style*='display: none'])").length;
    group.style.display = visible ? "" : "none";
  });

  document.querySelectorAll(".works-category").forEach(cat => {
    const visible = cat.querySelectorAll(".post:not([style*='display: none'])").length;
    cat.style.display = visible ? "" : "none";
  });
}

buttons.forEach(btn => {

  btn.addEventListener("click", () => {

    const type = btn.dataset.filter;
    const value = btn.dataset.value;

    filters[type] = value;

    /* remove active from same group */
    document
      .querySelectorAll(`#works-filters button[data-filter="${type}"]`)
      .forEach(b => b.classList.remove("active"));

    /* activate clicked button */
    btn.classList.add("active");

    updateVisibility();
  });

});