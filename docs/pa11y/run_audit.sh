#!/usr/bin/env bash
export PATH="/home/finer/.config/nvm/versions/node/v25.9.0/bin:$PATH"
OUT="$(dirname "$0")"
# Results are written to docs/pa11y/{palette}-{mode}/

# Audit with Duck light theme (the site default palette).
# To switch variants, pass: palette mode
# Examples: colorblind light, duck dark, colorblind dark
PALETTE="${1:-duck}"
MODE="${2:-light}"

echo "Running pa11y audit [theme: $PALETTE $MODE]..."
node "$OUT/run_audit.js" "$PALETTE" "$MODE" "$OUT"
echo "All done."
