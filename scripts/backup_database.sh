#!/usr/bin/env bash
# ==============================================================================
# ExamShield / Nexify Examina — Automated Database Backup Guardian
# Comprehensive, Compressed, Self-Verifying PostgreSQL 18 Backup System
# ==============================================================================

set -euo pipefail

# Configuration
CONTAINER_NAME="examshield_postgres"
DB_NAME="examshield_prod"
DB_USER="examshield_admin"
BACKUP_DIR="/var/backups/examshield"
LOG_DIR="/var/log/examshield"
LOG_FILE="${LOG_DIR}/backup.log"
RETENTION_DAYS=14
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/examshield_db_${TIMESTAMP}.sql.gz"
LATEST_LINK="${BACKUP_DIR}/latest.sql.gz"
MIN_EXPECTED_BYTES=50000 # 50 KB minimum sanity threshold

# Ensure directories exist with secure permissions (root access only)
mkdir -p "${BACKUP_DIR}" "${LOG_DIR}"
chmod 700 "${BACKUP_DIR}"

log() {
  local msg="[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [DB-BACKUP] $*"
  echo "${msg}"
  echo "${msg}" >> "${LOG_FILE}"
}

log "=================================================================="
log "Starting automated database backup for: ${DB_NAME}"

# 1. Verify Postgres container is healthy and running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log "[ERROR] PostgreSQL container '${CONTAINER_NAME}' is NOT running! Backup aborted."
  exit 1
fi

# 2. Check Postgres readiness
if ! docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" &>/dev/null; then
  log "[ERROR] PostgreSQL service in '${CONTAINER_NAME}' is not accepting connections! Backup aborted."
  exit 1
fi

# 3. Execute streaming compressed backup
START_TIME=$(date +%s)
log "Dumping database '${DB_NAME}' via pg_dump..."

docker exec "${CONTAINER_NAME}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  | gzip -9 > "${BACKUP_FILE}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 4. Verify backup file existence and size
if [ ! -f "${BACKUP_FILE}" ]; then
  log "[ERROR] Backup file '${BACKUP_FILE}' was not created!"
  exit 1
fi

FILE_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
HUMAN_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')

if [ "${FILE_SIZE}" -lt "${MIN_EXPECTED_BYTES}" ]; then
  log "[ERROR] Backup file size (${FILE_SIZE} bytes) is suspiciously small (< ${MIN_EXPECTED_BYTES} bytes)! Potential corruption."
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# 5. Verify gzip archive integrity
if ! gzip -t "${BACKUP_FILE}"; then
  log "[ERROR] Gzip integrity test failed for '${BACKUP_FILE}'! Archive is corrupted."
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Set secure file permissions
chmod 600 "${BACKUP_FILE}"

# 6. Update 'latest.sql.gz' symbolic link
ln -sf "${BACKUP_FILE}" "${LATEST_LINK}"

# 7. Query live statistics to document backup contents
TOTAL_STUDENTS=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM students;" 2>/dev/null | tr -d ' ' || echo "N/A")
TOTAL_ANSWERS=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM answers;" 2>/dev/null | tr -d ' ' || echo "N/A")
TOTAL_EXAMS=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM exams;" 2>/dev/null | tr -d ' ' || echo "N/A")
TOTAL_RESULTS=$(docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM results;" 2>/dev/null | tr -d ' ' || echo "N/A")

log "[SUCCESS] Backup successfully created in ${DURATION}s."
log "  -> File: ${BACKUP_FILE} (${HUMAN_SIZE})"
log "  -> Live Records: Students=${TOTAL_STUDENTS}, Answers=${TOTAL_ANSWERS}, Exams=${TOTAL_EXAMS}, Results=${TOTAL_RESULTS}"
log "  -> Symlink updated: ${LATEST_LINK}"

# 8. Retention Pruning (Remove backups older than RETENTION_DAYS)
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
OLD_BACKUPS_COUNT=$(find "${BACKUP_DIR}" -type f -name "examshield_db_*.sql.gz" -mtime +"${RETENTION_DAYS}" | wc -l)

if [ "${OLD_BACKUPS_COUNT}" -gt 0 ]; then
  find "${BACKUP_DIR}" -type f -name "examshield_db_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
  log "Removed ${OLD_BACKUPS_COUNT} outdated backup archive(s)."
else
  log "No expired backups found (Retention policy: ${RETENTION_DAYS} days)."
fi

TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -type f -name "examshield_db_*.sql.gz" | wc -l)
AVAILABLE_DISK=$(df -h "${BACKUP_DIR}" | awk 'NR==2 {print $4}')
log "Active backups retained: ${TOTAL_BACKUPS} | Available disk space: ${AVAILABLE_DISK}"
log "=================================================================="

exit 0
