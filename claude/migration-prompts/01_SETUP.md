# Phase 1: Setup & Dependencies

**Context:** Refer to `00_RULES.md` for the approved Tech Stack.

## Objective

Prepare the environment for the migration without breaking the current build.

## Steps

### 1. Create Git Branch

Create a new branch for this refactor to ensure safety.

```bash
git checkout -b refactor/zustand-to-reatom
```

### 2. Install Reatom Packages

Install the core library, react bindings, and the persistence adapter.

```bash
npm install @reatom/core @reatom/npm-react @reatom/persist-web-storage
```

_(Or use `yarn`/`pnpm` if detected in the project root)_

### 3. Verify Installation

- Check `package.json`.
- Ensure **Zustand** is STILL installed (do not remove it yet, we need it for reference during migration).

## Verification

Run the project dev server (`npm run dev`) to ensure installing new packages didn't break the existing build.
