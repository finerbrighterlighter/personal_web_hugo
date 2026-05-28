import { getCache, setCache } from './cache.js';

(async () => {

  const article = document.querySelector('article[data-doi]');
  if (!article) return;

  const doi = article.dataset.doi;
  if (!doi) return;

  const el = document.getElementById('work-cite-count');
  if (!el) return;

  const cacheKey = `openalex-work-${doi}`;
  const cached = getCache(cacheKey);

  if (cached !== null) {
    render(cached.count, cached.workId);
    return;
  }

  try {
    const res = await fetch(`https://api.openalex.org/works/doi:${doi}`);
    if (!res.ok) return;
    const data = await res.json();
    const count = data.cited_by_count ?? 0;
    const workId = (data.id ?? '').replace('https://openalex.org/', '');
    setCache(cacheKey, { count, workId });
    render(count, workId);
  } catch {
    // API unavailable — fail silently
  }

  function render(count, workId) {
    if (count < 1) return;
    const citingUrl = workId
      ? `https://openalex.org/works?filter=cites:${workId}`
      : null;
    if (citingUrl) {
      el.innerHTML = `<a href="${citingUrl}" target="_blank" rel="noreferrer noopener">${count} cited</a> ·`;
    } else {
      el.textContent = `${count} cited ·`;
    }
  }

})();
