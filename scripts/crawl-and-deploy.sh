#!/usr/bin/env bash
# crawl-and-deploy.sh — Automation script for crawl → export → git push
#
# Usage:
#   ./scripts/crawl-and-deploy.sh
#
# This script:
#   1. Runs the crawler pipeline (akiya_hunter_v1.js)
#   2. Exports listings to src/data/listings-live.json
#   3. Commits and pushes changes to trigger Vercel deploy
#
# Safety:
#   - Crawler errors do NOT stop the export step
#   - Export errors do NOT stop git operations
#   - git push failure does NOT cause non-zero exit (logged only)
#   - No personal data (phone/email) is stored

set -u  # treat unset variables as errors (but NOT set -e, so failures don't halt)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S %Z')"
LOG_FILE="$PROJECT_ROOT/data/crawl-$(date '+%Y%m%d-%H%M%S').log"

mkdir -p "$PROJECT_ROOT/data"

log() {
  echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=== crawl-and-deploy started at $TIMESTAMP ==="
log "Project root: $PROJECT_ROOT"

# --- Step 1: Run crawler ---
CRAWL_EXIT=0
log "Step 1: Running crawler..."
if [ -f "$PROJECT_ROOT/saiyasu-crawler-src/akiya_hunter_v1.js" ]; then
  cd "$PROJECT_ROOT"
  node saiyasu-crawler-src/akiya_hunter_v1.js >> "$LOG_FILE" 2>&1 || CRAWL_EXIT=$?
  if [ $CRAWL_EXIT -ne 0 ]; then
    log "WARNING: Crawler exited with code $CRAWL_EXIT (continuing to export)"
  else
    log "Crawler completed successfully."
  fi
else
  log "WARNING: Crawler script not found at saiyasu-crawler-src/akiya_hunter_v1.js"
  CRAWL_EXIT=1
fi

# --- Step 2: Export listings ---
EXPORT_EXIT=0
log "Step 2: Exporting listings..."
if [ -f "$PROJECT_ROOT/scripts/export-listings.js" ]; then
  cd "$PROJECT_ROOT"
  node scripts/export-listings.js >> "$LOG_FILE" 2>&1 || EXPORT_EXIT=$?
  if [ $EXPORT_EXIT -ne 0 ]; then
    log "WARNING: Export exited with code $EXPORT_EXIT (continuing to git)"
  else
    log "Export completed successfully."
  fi
else
  log "WARNING: Export script not found at scripts/export-listings.js"
  EXPORT_EXIT=1
fi

# --- Step 3: Git commit and push ---
log "Step 3: Git commit & push..."
cd "$PROJECT_ROOT"

# Only commit if there are changes to listings data
if git diff --quiet -- src/data/listings-live.json 2>/dev/null; then
  log "No changes to listings-live.json — skipping commit."
else
  git add src/data/listings-live.json >> "$LOG_FILE" 2>&1

  git commit -m "$(cat <<'EOF'
物件データ自動更新

Automated crawl-and-deploy run.
EOF
  )" >> "$LOG_FILE" 2>&1 || {
    log "WARNING: git commit failed (maybe no staged changes)"
  }

  git push >> "$LOG_FILE" 2>&1 || {
    log "WARNING: git push failed — will retry next run. Crawler data is NOT lost."
  }

  log "Git push completed (or was skipped)."
fi

# --- Summary ---
log "=== crawl-and-deploy finished ==="
log "  Crawler exit: $CRAWL_EXIT"
log "  Export exit:   $EXPORT_EXIT"
log "  Log file:     $LOG_FILE"

# Clean up old logs (keep last 30 days)
find "$PROJECT_ROOT/data" -name 'crawl-*.log' -mtime +30 -delete 2>/dev/null || true
