## Severity Legend

<!-- Review format in table -->

| Severity | Meaning | Impact on Existing/This PR | Effort |
|----------|---------|------------------------------|--------|
| P0 | **Blocker**, must fix before merge: data loss, security hole, full outage, broken build | Existing | High |
| P1 | **High**, should fix or explicitly track as a follow-up before merge: significant incorrect behavior | This PR | Medium |
| P2 | **Medium**, fix in this PR or a quick follow-up: misleading UX, missing test coverage | This PR | Medium |
| P3 | **Low**, nice-to-have or cleanup: dead code, defensive-but-redundant guards | This PR | Low |

Every review covers all three sections below. A section with nothing to report says "None." and is never deleted.

## 1. Functional

<!-- Does it work, and does it do what the PR says it does? -->

Covers correctness (logic errors, edge cases, nullish paths, error handling, races), whether every Changelog bullet is actually implemented, security and performance regressions, and test coverage for the new behavior.

| Severity | File | Finding | Suggested fix |
|----------|------|---------|---------------|
| P1 | `apps/api/src/...` | ... | ... |

## 2. Clean Code

<!-- Checked against .claude/skills/ts-conventions/SKILL.md -->

Covers the project conventions: no plain strings (user-facing copy in `@app/messages`, domain keys in a shared const object, referenced at every call site including `.with(...)` arms and `z.literal(...)`), arrow functions only (the `function` keyword is for generators alone), files ≤ 200 lines with one responsibility, `T`/`I`/`E` naming prefixes, ts-pattern for conditionals and ts-belt for arrays/objects, explicit return types, no comments, logic in hooks/use-cases rather than JSX, and API layering (domain / application / infrastructure / presentation), plus duplication, dead code, and naming.

| Severity | File | Finding | Suggested fix |
|----------|------|---------|---------------|
| P3 | `apps/web/src/...` | ... | ... |

## 3. Feature Suggestions

<!-- Non-blocking. Tag each as `this-pr` or `follow-up`. -->

`this-pr` is a gap in the feature as shipped (missing empty/loading/error state, accessibility, confusing copy). `follow-up` is an idea worth doing later but deliberately out of scope: a candidate issue, never a reason to hold the merge.

| Scope | Suggestion | Why |
|-------|------------|-----|
| this-pr | ... | ... |
| follow-up | ... | ... |
