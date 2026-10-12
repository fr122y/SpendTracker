# Reatom

The project uses Reatom v1000 (`@reatom/core`, `@reatom/react`). v1000 removed
the explicit context argument (`ctx`); context is implicit. Verify the current
API through context7 or https://v1000.reatom.dev before writing Reatom code:
most published examples still show the v3/v4 API.

## v3/v4 API That Does Not Exist In v1000

| Obsolete (v3/v4)              | Replacement (v1000)             |
| ----------------------------- | ------------------------------- |
| `ctx.spy(atom)`               | `atom()` inside reactive scope  |
| `ctx.get(atom)`               | `peek(atom)`                    |
| `atom(ctx, newState)`         | `atom.set(newState)`            |
| `ctx.schedule(() => promise)` | `wrap(promise)`                 |
| `reatomAsync(ctx => ...)`     | `action(async () => { ... })`   |
| `createCtx()`                 | `context.start(fn)` (SSR/tests) |

Key primitives: `atom`, `computed`, `action`, `effect`, `wrap`, `peek`.

## SSR And Provider

Use `context.start()` for an isolated context per request.
`reatomContext.Provider` is set up in `src/shared/lib/reatom/provider.tsx`.

## Data Flow

- Mutations: Reatom `action` -> Server Action -> database or external API.
- Reads: Server Component fetch -> props -> `atom.set(initialData)` in the
  Client Component.
- Synchronize persisted state through Reatom, not through `useEffect`.
