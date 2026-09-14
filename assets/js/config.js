window.CONFIG = {
  unsplash: "{{ getenv "HUGO_UNSPLASH_KEY" }}",
  lastfm: "{{ getenv "HUGO_LASTFM_KEY" }}",
  simklClientId: "{{ getenv "HUGO_SIMKL_CLIENT_ID" }}",
  simklToken: "{{ getenv "HUGO_SIMKL_TOKEN" }}",
  cacheTTLMinutes: {{ site.Params.cacheTTLMinutes | default 60 }},
  researchTagLimit: {{ site.Params.researchTagLimit | default 30 }},
  screenLimit: {{ site.Params.screenLimit | default 10 }},
  navBubbleLabel: "{{ i18n "nav_bubble_label" }}",
  navBubbleTop: "{{ i18n "nav_bubble_top" }}",
  navBubbleBottom: "{{ i18n "nav_bubble_bottom" }}"
};