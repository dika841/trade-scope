#!/usr/bin/env bash
# Answers whether a git range touches anything the end to end suites can observe.
# A documentation-only change still bumps the root version, so a package.json
# whose diff is nothing but the version line does not count as code.
set -euo pipefail

RANGE="${1:?usage: detect-code-changes.sh <git range>}"

is_documentation() {
	case "$1" in
	docs/* | *.md) return 0 ;;
	*) return 1 ;;
	esac
}

is_version_bump_only() {
	local changed
	changed="$(git diff -U0 "$RANGE" -- package.json | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' || true)"
	[ -n "$changed" ] || return 0
	! printf '%s\n' "$changed" | grep -qvE '^[+-][[:space:]]*"version":'
}

while IFS= read -r file; do
	[ -n "$file" ] || continue
	is_documentation "$file" && continue
	if [ "$file" = "package.json" ] && is_version_bump_only; then
		continue
	fi
	echo "code changed: $file" >&2
	echo "true"
	exit 0
done < <(git diff --name-only "$RANGE")

echo "documentation only, no end to end run needed" >&2
echo "false"
