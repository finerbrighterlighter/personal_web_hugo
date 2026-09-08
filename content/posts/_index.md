+++
title = "Posts"

# Only publish bundle resources that a template actually references
# (Permalink/RelPermalink); raw multi-MB originals stay out of public/.
[[cascade]]
  [cascade.build]
    publishResources = false
  [cascade.target]
    path = "/posts/**"
    kind = "page"
+++
