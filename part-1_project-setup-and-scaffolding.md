# Part 1: Project Setup & Scaffolding

**Context:** Refer to `CLAUDE.md` for the Tech Stack (Next.js 16, Tailwind v4, Zustand) and Architecture rules.
**Task:** Initialize the project structure and configuration files.

**Step Constraints:**

- **Strictly NO `npm install`**: Use `--skip-install` flags and manual `package.json` edits.
- **Config:** Ensure all config files (ESLint, TS, Tailwind) align with the versions defined in `CLAUDE.md`.

## Step 1.1: Initialize Project

Create a new Next.js 16 project named `spend-tracker` using `create-next-app` with these flags:

- TypeScript, ESLint, Tailwind CSS, App Router, `src/` directory.
- Use `--skip-install` to prevent auto-installation.
- Set import alias to `@/*`.

## Step 1.2: Dependencies

Add the following latest compatible versions to `package.json` manually:

- **Dependencies**: `lucide-react`, `recharts`, `openai`, `@tanstack/react-query`, `zustand`, `clsx`, `tailwind-merge`, `zod`.
- **DevDependencies**: `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`, `eslint-plugin-import`, `husky`, `lint-staged`.
- **Testing**: `jest`, `jest-environment-jsdom`, `@testing-library/react`, `msw`, `playwright`.

## Step 1.3: Configs

1.  **Next.js**: Enable `experimental.serverActions` features if required for Next.js 16 (optimize for large bodies).
2.  **Environment**: Create `.env.local` with `AI_BASE_URL` (default: https://api.deepseek.com), `AI_API_KEY`, and `AI_MODEL`. **Do NOT use `NEXT_PUBLIC_` prefix.**

## Step 1.4: Styles & Layout

1.  **Tailwind v4**: Setup `globals.css` using the new `@import "tailwindcss";` syntax.
2.  **Theme**: Define CSS variables for fonts: `Inter` (sans) and `JetBrains Mono` (mono).
3.  **UI Polish**: Add CSS utility classes to styling the scrollbar to look thin and dark (terminal style).
4.  **Root Layout**: Apply the fonts and a dark background (`bg-zinc-950`, `text-zinc-200`) in `src/app/layout.tsx`.

## Step 1.5: Code Quality (Linting)

1.  **ESLint**: Generate a `eslint.config.mjs` using the **new Flat Config** format. Include Prettier and Import sorting rules.
2.  **Prettier**: Create a standard `.prettierrc` (single quote, no semi, etc.).
3.  **Husky**: Configure `lint-staged` in `package.json` to run formatting on commit.

## Step 1.6: Testing Infrastructure

1.  **Jest**: Create `jest.config.ts` configured for Next.js App Router (using `next/jest`).
2.  **Setup**: Create `src/test/setup.ts` to mock `localStorage` and `crypto.randomUUID`.
3.  **MSW**: Setup basic handlers for API mocking.
4.  **Playwright**: Generate `playwright.config.ts` targeting `localhost:3000`.

**Action:** Execute these steps to scaffold the project structure.
