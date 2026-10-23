#!/usr/bin/env bash
set -euo pipefail

RANGE="$1"
COMPARE_FROM="${2:-}"
TAG="$3"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

SECTIONS=(
	"feat:Features"
	"fix:Fixes"
	"refactor:Refactoring"
	"perf:Performance"
	"ci:CI"
	"docs:Docs"
	"test:Tests"
	"chore:Chores"
)

body_section() {
	awk -v heading="$1" '
		$0 ~ "^## " heading { flag = 1; next }
		/^## / { flag = 0 }
		flag { print }
	'
}

bullets_only() {
	sed -e 's/\r$//' -e '/^<!--/d' -e '/-->$/d' |
		grep -E '^- ' |
		grep -vE '^- (Added|Refactored|Fixed) \.\.\.$' |
		grep -vE '^- None\.?$' || true
}

prose_kept() {
	sed -e 's/\r$//' -e '/^<!--/d' -e '/-->$/d' |
		sed -e 's/[[:space:]]*$//' |
		grep -vE '^-? ?None\.?$' |
		sed -e '/./,$!d' || true
}

pr_body_file() {
	local pr="$1"
	local file="${WORK}/pr-${pr}.md"

	if [ ! -f "$file" ]; then
		gh pr view "$pr" --json body -q '.body' >"$file" 2>/dev/null || printf '' >"$file"
	fi

	printf '%s' "$file"
}

entry_for() {
	local subject="$1"
	local prefix="$2"
	local pr
	local title
	local file
	local changelog
	local breaking

	pr="$(printf '%s' "$subject" | sed -nE 's/.*\(#([0-9]+)\)$/\1/p')"
	title="$(printf '%s' "$subject" |
		sed -E "s/^${prefix}(\([^)]*\))?!?: //" |
		sed -E 's/ \(#[0-9]+\)$//')"

	if [ -z "$pr" ]; then
		printf -- '- %s\n\n' "$title"
		return
	fi

	file="$(pr_body_file "$pr")"
	changelog="$(body_section 'Changelog' <"$file" | bullets_only)"
	breaking="$(body_section 'Breaking Changes' <"$file" | prose_kept)"

	printf -- '**%s** (#%s)\n\n' "$title" "$pr"

	if [ -n "$changelog" ]; then
		printf '%s\n\n' "$changelog"
	fi

	if [ -n "$breaking" ]; then
		printf '> **Breaking changes and impact**\n>\n'
		printf '%s\n' "$breaking" | sed -E 's/^/> /' | sed -E 's/^> $/>/'
		printf '\n'
	fi
}

for section in "${SECTIONS[@]}"; do
	prefix="${section%%:*}"
	title="${section#*:}"
	subjects="$(git log --no-merges --format='%s' "$RANGE" |
		grep -E "^${prefix}(\([^)]*\))?!?: " || true)"

	if [ -z "$subjects" ]; then
		continue
	fi

	printf '## %s\n\n' "$title"

	while IFS= read -r subject; do
		entry_for "$subject" "$prefix"
	done <<<"$subjects"
done

if [ -n "$COMPARE_FROM" ]; then
	printf 'Full changelog: https://github.com/%s/compare/%s...%s\n' \
		"$GITHUB_REPOSITORY" "$COMPARE_FROM" "$TAG"
fi
