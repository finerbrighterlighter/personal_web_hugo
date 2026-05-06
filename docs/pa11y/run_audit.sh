#!/usr/bin/env bash
export PATH="/home/finer/.config/nvm/versions/node/v25.9.0/bin:$PATH"
BASE=http://localhost:1313
OUT="$(dirname "$0")"

pages=(
  "index $BASE/"
  "about $BASE/about/"
  "works $BASE/works/"
  "work_single $BASE/works/journal/2023_transitions_from_hypertension_to_cvd_outcomes/"
  "posts $BASE/posts/"
  "post_single $BASE/posts/260417-phd-journal-club/"
  "blood $BASE/blood/"
)

for entry in "${pages[@]}"; do
  name="${entry%% *}"
  url="${entry#* }"
  echo "Auditing $name ($url)..."
  pa11y --wait 10000 --reporter csv "$url" > "$OUT/$name.csv"
  echo "  -> $(( $(wc -l < "$OUT/$name.csv") - 1 )) errors"
done

echo "All done."
