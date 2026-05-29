#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Starting ServiHogar backend container"

# Defaults matching docker-compose service "db"
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-servihogar}
DB_PASSWORD=${DB_PASSWORD:-}

MAX_RETRIES=${DB_MAX_RETRIES:-60}
SLEEP_SECS=${DB_RETRY_DELAY:-2}

export PGPASSWORD="${DB_PASSWORD}"

echo "[entrypoint] Waiting for Postgres ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME} ..."
for i in $(seq 1 ${MAX_RETRIES}); do
  if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
    echo "[entrypoint] Postgres is ready (attempt ${i})"
    break
  fi
  echo "[entrypoint] Postgres not ready yet (attempt ${i}/${MAX_RETRIES}); sleeping ${SLEEP_SECS}s"
  sleep "${SLEEP_SECS}"
  if [ "$i" -eq "${MAX_RETRIES}" ]; then
    echo "[entrypoint] ERROR: Postgres is not ready after ${MAX_RETRIES} attempts" >&2
    exit 1
  fi
done

# Preflight: if the visibility table exists (created earlier) but migration 0005 isn't recorded, fake it
echo "[entrypoint] Preflight migration checks"
TABLE_EXISTS=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -tAc "SELECT to_regclass('public.api_service_visibility') IS NOT NULL") || TABLE_EXISTS="f"
MIGRATION_APPLIED=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -tAc "SELECT EXISTS (SELECT 1 FROM django_migrations WHERE app='api' AND name='0005_categoriaservicio_documentoprofesional_and_more')") || MIGRATION_APPLIED="f"
if [ "${TABLE_EXISTS}" = "t" ] && [ "${MIGRATION_APPLIED}" != "t" ]; then
  echo "[entrypoint] Detected api_service_visibility table without migration record; faking api 0005"
  python manage.py migrate api 0005 --fake || true
fi

# Run migrations with a couple of retries in case of initial race conditions
MIGRATE_RETRIES=${MIGRATE_RETRIES:-3}
for j in $(seq 1 ${MIGRATE_RETRIES}); do
  echo "[entrypoint] Running Django migrations (try ${j}/${MIGRATE_RETRIES})"
  if python manage.py migrate --noinput; then
    echo "[entrypoint] Migrations applied successfully"
    break
  fi
  if [ "$j" -eq "${MIGRATE_RETRIES}" ]; then
    echo "[entrypoint] ERROR: migrate failed after ${MIGRATE_RETRIES} attempts" >&2
    exit 2
  fi
  sleep 2
done

echo "[entrypoint] Starting Django development server"
exec python manage.py runserver 0.0.0.0:8000
