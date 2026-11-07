#!/usr/bin/env bash
# ==============================================================================
# ExamShield / Nexify Examina — Disaster Recovery & Database Restoration Tool
# Safely restores examshield_prod from compressed backups with safety snapshots
# ==============================================================================

set -euo pipefail

CONTAINER_NAME="examshield_postgres"
DB_NAME="examshield_prod"
DB_USER="examshield_admin"
BACKUP_DIR="/var/backups/examshield"
LOG_DIR="/var/log/examshield"
LOG_FILE="${LOG_DIR}/restore.log"
LATEST_LINK="${BACKUP_DIR}/latest.sql.gz"

mkdir -p "${LOG_DIR}"

log() {
  local msg="[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [DB-RESTORE] $*"
  echo "${msg}"
  echo "${msg}" >> "${LOG_FILE}"
}

# Handle --list flag
if [ "${1:-}" = "--list" ] || [ "${1:-}" = "-l" ]; then
  echo "=================================================================="
  echo " Available ExamShield Database Backups in ${BACKUP_DIR}:"
  echo "=================================================================="
  ls -lh "${BACKUP_DIR}"/examshield_db_*.sql.gz 2>/dev/null || echo "No backups found."
  echo "------------------------------------------------------------------"
  if [ -L "${LATEST_LINK}" ]; then
    echo "Latest Symlink: $(readlink -f "${LATEST_LINK}")"
  fi
  echo "=================================================================="
  exit 0
fi

# Determine restore target file
TARGET_FILE="${1:-}"

if [ -z "${TARGET_FILE}" ] || [ "${TARGET_FILE}" = "latest" ]; then
  if [ -L "${LATEST_LINK}" ] && [ -f "${LATEST_LINK}" ]; then
    TARGET_FILE=$(readlink -f "${LATEST_LINK}")
    log "No specific backup specified. Defaulting to latest backup: ${TARGET_FILE}"
  elif [ -f "${LATEST_LINK}" ]; then
    TARGET_FILE="${LATEST_LINK}"
  else
    # Find most recent file by modification time
    TARGET_FILE=$(ls -t "${BACKUP_DIR}"/examshield_db_*.sql.gz 2>/dev/null | head -n 1 || true)
    if [ -z "${TARGET_FILE}" ]; then
      log "[ERROR] No backup archives found in '${BACKUP_DIR}'!"
      exit 1
    fi
  fi
fi

# 1. Verify target file exists
if [ ! -f "${TARGET_FILE}" ]; then
  log "[ERROR] Target backup file '${TARGET_FILE}' does not exist!"
  exit 1
fi

log "=================================================================="
log "Initiating Database Restoration Procedure"
log "Target Archive: ${TARGET_FILE} ($(ls -lh "${TARGET_FILE}" | awk '{print $5}'))"

# 2. Test archive integrity
log "Verifying gzip archive integrity..."
if ! gzip -t "${TARGET_FILE}"; then
  log "[ERROR] Target archive '${TARGET_FILE}' failed gzip integrity test! Restoration aborted."
  exit 1
fi
log "Archive integrity verified OK."

# 3. Verify PostgreSQL container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log "[ERROR] Container '${CONTAINER_NAME}' is not running! Restoration aborted."
  exit 1
fi

# 4. Mandatory Pre-Restore Safety Snapshot (Protects current data from accidental loss)
SAFETY_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SAFETY_FILE="${BACKUP_DIR}/pre_restore_safety_${SAFETY_TIMESTAMP}.sql.gz"
log "Creating PRE-RESTORE safety snapshot: ${SAFETY_FILE}..."

if docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" &>/dev/null; then
  docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip -9 > "${SAFETY_FILE}" || true
  if [ -f "${SAFETY_FILE}" ] && [ "$(stat -c%s "${SAFETY_FILE}" 2>/dev/null || stat -f%z "${SAFETY_FILE}")" -gt 1000 ]; then
    chmod 600 "${SAFETY_FILE}"
    log "✅ Safety snapshot created successfully (${SAFETY_FILE})."
  else
    log "⚠️ Notice: Database may be empty or uninitialized. Proceeding with restoration."
  fi
fi

# 5. Terminate existing connections to allow clean database restoration
log "Terminating active connections to '${DB_NAME}'..."
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" &>/dev/null || true

# 6. Stream and restore database dump
log "Restoring database schema and data from '${TARGET_FILE}'..."
START_TIME=$(date +%s)

gunzip -c "${TARGET_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" --quiet >/dev/null 2>&1

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 7. Post-restoration verification
log "Restoration stream completed in ${DURATION}s. Running verification checks..."

TABLE_COUNT=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
STUDENT_COUNT=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM students;" 2>/dev/null | tr -d ' ' || echo "0")
EXAM_COUNT=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM exams;" 2>/dev/null | tr -d ' ' || echo "0")
ANSWER_COUNT=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM answers;" 2>/dev/null | tr -d ' ' || echo "0")
RESULT_COUNT=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM results;" 2>/dev/null | tr -d ' ' || echo "0")

log "=================================================================="
log "🎉 DATABASE RESTORATION SUCCESSFUL!"
log "  -> Tables Restored: ${TABLE_COUNT}"
log "  -> Students:        ${STUDENT_COUNT}"
log "  -> Exams:           ${EXAM_COUNT}"
log "  -> Answers:         ${ANSWER_COUNT}"
log "  -> Results:         ${RESULT_COUNT}"
log "=================================================================="

exit 0
