#!/usr/bin/env bash
export PATH="/home/finer/.config/nvm/versions/node/v25.9.0/bin:$PATH"
OUT="$(dirname "$0")"
# Results are written to docs/pa11y/{palette}/

# Audit with Duck light theme (the site default palette).
# To switch to colorblind light instead, change PALETTE to: colorblind
PALETTE="${1:-duck}"

echo "Running pa11y audit [theme: $PALETTE light]..."
node "$OUT/run_audit.js" "$PALETTE" "$OUT"
echo "All done."
