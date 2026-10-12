# Slice README

Every FSD slice under `entities`, `features`, `widgets`, and `shared` carries a
local `README.md`. Create it with the slice and update it in the same change
that alters the slice's public API, state, or dependencies.

## Template

```markdown
# [Slice Name]

[Brief purpose description]

## Public API (`index.ts`)

- `ComponentName`: [What it does]
- `useHookName`: [What data it provides]

## State & Data

- **Store:** [Reatom store name] (Persistence key: `smartspend-...`)
- **Actions:** [Main actions]

## Dependencies

- Uses: [Other slices this module imports]
```

## Layer Guides

Each layer has its own guide; keep it current when the layer's conventions
change:

- [Entities](../../src/entities/README.md) — business logic and Reatom stores.
- [Features](../../src/features/README.md) — user interactions, async forms,
  fallback logic.
- [Widgets](../../src/widgets/README.md) — dashboard assembly and grid logic.
- [Shared](../../src/shared/README.md) — Server Actions, UI kit, utilities.
