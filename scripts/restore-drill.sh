#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/docker-compose.dev.yml")
SERVICE="${POSTGRES_SERVICE:-postgres}"
DB="${POSTGRES_DB:-app}"
DB_USER="${POSTGRES_USER:-app}"
DRILL_DB="${DRILL_DB:-app_restore_drill}"
DUMP="/tmp/trade-scope-restore-drill-$$.dump"

cleanup() {
	"${COMPOSE[@]}" exec -T "$SERVICE" rm -f "$DUMP" >/dev/null 2>&1 || true
	"${COMPOSE[@]}" exec -T "$SERVICE" psql -U "$DB_USER" -d postgres \
		-c "DROP DATABASE IF EXISTS $DRILL_DB WITH (FORCE)" >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "dumping $DB from $SERVICE"
START="$(date +%s)"
"${COMPOSE[@]}" exec -T "$SERVICE" pg_dump -U "$DB_USER" -d "$DB" \
	--format=custom --no-owner --no-acl -f "$DUMP"

echo "restoring into $DRILL_DB"
"${COMPOSE[@]}" exec -T "$SERVICE" psql -U "$DB_USER" -d postgres \
	-v ON_ERROR_STOP=1 \
	-c "DROP DATABASE IF EXISTS $DRILL_DB WITH (FORCE)" \
	-c "CREATE DATABASE $DRILL_DB" >/dev/null

"${COMPOSE[@]}" exec -T "$SERVICE" pg_restore -U "$DB_USER" -d "$DRILL_DB" \
	--no-owner --no-acl "$DUMP"

USERS="$("${COMPOSE[@]}" exec -T "$SERVICE" psql -U "$DB_USER" -d "$DRILL_DB" \
	-tAc 'select count(*) from "user";' | tr -d '[:space:]')"
TABLES="$("${COMPOSE[@]}" exec -T "$SERVICE" psql -U "$DB_USER" -d "$DRILL_DB" \
	-tAc "select count(*) from information_schema.tables where table_schema = 'public';" | tr -d '[:space:]')"
END="$(date +%s)"

echo "restore drill passed: $TABLES tables, $USERS users restored in $((END - START))s"
echo "recovery point: the live dump taken at the start of this run"
