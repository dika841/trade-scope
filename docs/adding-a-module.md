# Adding a module

`apps/api` is organised by module, not by layer, so a new capability is a new directory under
`src/`, not a new file in a shared one. Nothing here is discoverable from the directory tree alone, which is the reason the list exists. A
module that is written but not registered compiles and does nothing.

## Inside `apps/api/src/<module>/`

| Path | Holds |
|---|---|
| `domain/<module>.ts` | The row type and the port type (`T<Module>Repo`), no Effect program |
| `application/<module>-<use-case>.ts` | One `Effect.fn("name")(function* ...)` per use case, one file each |
| `application/to-<module>-dto.ts` | Row to wire shape, so the router never maps by hand |
| `infrastructure/<module>-repository.ts` | The Drizzle implementation and its `Layer` |
| `presentation/<module>-router.ts` | The oRPC router, `permissionRequire(...)` on every procedure |
| `index.ts` | The only surface other code may import: `{ layer, routerBuild }` |

Use cases carry their own `*.test.ts` next to them. The repository layer is exercised by
`apps/api-e2e` against real infrastructure rather than mocked.

## Register it

Four edits, none of them optional:

1. `apps/api/scripts/architecture-rules.ts`: add the module to `MODULE`, and give it an entry in
   `MODULE_MAY_IMPORT`. An empty array is the right default; a module that imports nothing is a
   module that can be deleted on its own
2. `apps/api/src/bootstrap/compose.ts`: add `<module>Module.layer` to `Layer.mergeAll`
3. `apps/api/src/bootstrap/router.ts`: add `<module>: <module>Module.routerBuild()`
4. `apps/api/src/shared/repo-tags.ts`: add the repository tag id. It is a constant, never a literal
   at the `Context.Service` call

`moon run api:arch` fails on a module that is missing from the rules, and `api:build` depends on it,
so a forgotten step 1 stops CI rather than shipping.

## Shared packages it touches

| Package | What the module adds |
|---|---|
| `@app/schemas` | `src/<module>/`: the zod input and output schemas, exported from the package index. Both the router and the web import these, so the wire shape has one definition |
| `@app/messages` | `src/<module>/message.ts`: a `SCREAMING_SNAKE` const object for every user-facing string |
| `@app/permissions` | `permissions.ts` for the keys, `roles.ts` to grant them, `labels.ts` for the text the role editor shows |

## Database

The table lives in `apps/api/src/platform/db/tables/<module>.ts` and is re-exported from
`db/schema.ts`. Generate the migration with `make db-generate`, never by writing SQL by hand, and
read the expand and contract rules in [operations/deployment.md](operations/deployment.md) before
changing a column that already exists.

## Web

A feature is a route directory under `apps/web/src/routes/_authenticated/<module>/`:

```
index.tsx           the route, renders and nothing else
_components/*.tsx   presentation
_hooks/*.ts         useQuery, useMutation, form state, derived values
```

The split is the rule, not a convention: a component that calls `useQuery` is a review finding.
