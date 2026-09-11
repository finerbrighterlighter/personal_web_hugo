window.CONFIG = {
  unsplash: "{{ getenv "HUGO_UNSPLASH_KEY" }}",
  lastfm: "{{ getenv "HUGO_LASTFM_KEY" }}",
  cacheTTLMinutes: {{ site.Params.cacheTTLMinutes | default 60 }},
  researchTagLimit: {{ site.Params.researchTagLimit | default 30 }},
  navBubbleLabel: "{{ i18n "nav_bubble_label" }}",
  navBubbleTop: "{{ i18n "nav_bubble_top" }}",
  navBubbleBottom: "{{ i18n "nav_bubble_bottom" }}"
};