# SmartSpend Tracker

Personal finance web app for expense tracking, weekly and shared budgets, monthly pockets, and keyword-based categorization. Built with Next.js 16, React 19, PostgreSQL, and Feature-Sliced Design architecture. Accounts are required; data is stored per user in the database. UI language: Russian.

## Tech Stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| Framework    | Next.js 16 (App Router) + React 19                        |
| Language     | TypeScript 5.7                                            |
| Styling      | Tailwind CSS v4 (CSS-first, zero-config)                  |
| Client State | Reatom (ephemeral UI state: session, edit mode)           |
| Server State | TanStack Query v5 with optimistic mutations               |
| Backend      | Server Actions (`src/shared/api`)                         |
| Database     | PostgreSQL + Drizzle ORM (migrations in `drizzle/`)       |
| Auth         | NextAuth v5 (Google OAuth + credentials), Drizzle adapter |
| Email        | Resend (account emails, delivery webhook, outbox cron)    |
| Charts       | Recharts                                                  |
| Validation   | Zod                                                       |
| Specs        | OpenSpec (`openspec/`)                                    |
| Testing      | Jest + React Testing Library + Playwright                 |
| Linting      | ESLint 9 + Prettier                                       |
| Hosting      | Vercel (daily cron in `vercel.json`)                      |

## Features

- **Expense Tracking** — add, edit, delete expenses with amount, category, date, and emoji
- **Accounts** — Google OAuth or email/password sign-in, email verification, password reset, account page
- **Keyword Categorization** — category suggestions from saved keyword mappings, with manual override
- **Math Input** — type `500+50` and it evaluates to `550`
- **Budget Monitoring** — weekly spending limit with progress bar, over-budget detection, and per-week limit history
- **Shared Budgets** — shared weekly budgets with one-time invite links, shared categories, and shared keyword mappings
- **Pockets** — named pockets with monthly budgets, purchases, and transfers
- **Savings Buckets** — allocate salary into savings/investment buckets by percentage or amount
- **Projects** — group expenses by project with dedicated budgets, withdrawals, and returns
- **Category Management** — CRUD for expense categories with duplicate validation
- **Interactive Calendar** — monthly view with expense, salary, and advance day markers
- **Spending Analytics** — category breakdown and daily spending bar chart
- **Customizable Dashboard** — drag-and-drop grid layout (desktop), accordion/modal (mobile)
- **Responsive Design** — mobile list → tablet 2-column → desktop multi-column with drag-drop
- **Financial Settings** — salary day, advance day, monthly salary, weekly limit

## Architecture (FSD)

The project follows [Feature-Sliced Design](https://feature-sliced.design/) with strict layer isolation:

```
src/
├── app/                # Next.js App Router: dashboard, login, account,
│                       # password reset, email verification, invite pages,
│                       # api/ route handlers (auth, cron, Resend webhook)
├── middleware.ts       # Redirects unauthenticated requests to /login
├── _pages/             # Page compositions (dashboard)
├── entities/           # Business models, query hooks & stores
│   ├── expense/        # Expense records
│   ├── category/       # Expense categories (6 Russian defaults)
│   ├── keyword-mapping/# Keyword → category mappings
│   ├── project/        # Projects for grouping expenses
│   ├── bucket/         # Allocation buckets (Savings/Investments)
│   ├── pocket/         # Pockets and monthly pocket budgets
│   ├── shared-budget/  # Shared weekly budgets and invites
│   ├── settings/       # Financial settings (limits, salary days)
│   └── session/        # Ephemeral session state (no persistence)
├── features/           # User interactions
│   ├── add-expense/    # Expense form + keyword categorization
│   ├── auth/           # Sign-in, registration, password reset forms
│   ├── manage-*/       # Features for categories, projects, buckets, pockets
│   ├── layout-editor/  # Dashboard drag-drop customization
│   ├── mobile-widget-*/# Mobile widget list, accordion, modal
│   ├── widget-registry/# Widget metadata registry
│   └── month-picker/   # Month selection modal
├── widgets/            # Composite dashboard blocks
│   ├── dashboard-grid/ # Responsive layout grid
│   ├── dashboard-header/ # Branding, date navigation, account link
│   ├── calendar/       # Interactive calendar
│   ├── expense-log/    # Daily expenses + add form
│   ├── analysis/       # Category spending breakdown
│   ├── dynamics-chart/ # Daily spending bar chart
│   ├── weekly-budget/  # Weekly spend progress bar
│   ├── savings/        # Budget allocation buckets
│   ├── pockets/        # Pocket budgets, usage, and history
│   ├── categories-settings/ # Category management wrapper
│   └── projects/       # Project grid with details
├── shared/             # UI kit, utilities, Server Actions, types
│   ├── api/            # Server Actions + QueryClient + query keys
│   ├── auth/           # NextAuth config, account profile, user seeding
│   ├── db/             # Drizzle client and schema
│   ├── lib/            # Utilities (cn, math-eval, finance-selectors, account email)
│   ├── ui/             # Button, Input, MathInput, TerminalPanel, etc.
│   └── types/          # Global TypeScript definitions
└── providers/          # Reatom + TanStack Query providers
```

Outside `src/`: `drizzle/` (SQL migrations), `openspec/` (specs and changes), `e2e/` (Playwright), `scripts/` (migration and backfill scripts), `docs/` (context, decisions, engineering workflow).

**Layer rules:**

- `entities` → no dependencies on features/widgets
- `features` → can use entities + shared
- `widgets` → can use entities, features, shared (not other widgets)
- `shared` → no business logic, no upper-layer dependencies

## State Management

PostgreSQL is the source of truth. Entities read and write it through Server Actions wrapped in TanStack Query hooks; user-visible mutations use optimistic updates with rollback. Reatom holds only ephemeral UI state. Nothing is persisted in localStorage.

| Hook                     | Backing            | Purpose                  |
| ------------------------ | ------------------ | ------------------------ |
| `useExpenseStore`        | Database           | Expense records          |
| `useCategoryStore`       | Database           | Expense categories       |
| `useKeywordMappingStore` | Database           | Keyword mappings         |
| `useProjectStore`        | Database           | Projects                 |
| `useBucketStore`         | Database           | Allocation buckets       |
| `useSettingsStore`       | Database           | Financial settings       |
| `useLayoutStore`         | Database           | Dashboard layout         |
| `useSessionStore`        | Reatom (ephemeral) | Selected date, view date |

Pockets and shared budgets expose query/mutation hooks directly (`usePockets`, `useSharedBudgets`, …); see the slice READMEs.

## Getting Started

### Prerequisites

- Node.js >=20.19.0
- npm
- A PostgreSQL database

### Installation

```bash
git clone <repository-url>
cd SpendTracker
npm ci
```

### Environment Variables

Create `.env.local` in the project root (server side only, never `NEXT_PUBLIC_`):

| Variable                 | Purpose                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection used by the app and `npm run db:migrate`               |
| `DIRECT_URL`             | Optional direct (non-pooler) connection preferred by drizzle-kit             |
| `AUTH_SECRET`            | NextAuth session secret (read by NextAuth by convention)                     |
| `AUTH_GOOGLE_ID`         | Google OAuth client id (read by NextAuth by convention)                      |
| `AUTH_GOOGLE_SECRET`     | Google OAuth client secret (read by NextAuth by convention)                  |
| `APP_ORIGIN`             | Public app origin for invite, password reset, and verification links         |
| `RESEND_API_KEY`         | Resend API key; when missing in development, emails are previewed in console |
| `ACCOUNT_EMAIL_FROM`     | Sender address for account emails                                            |
| `ACCOUNT_EMAIL_REPLY_TO` | Optional reply-to address for account emails                                 |
| `RESEND_WEBHOOK_SECRET`  | Verifies Resend webhooks at `/api/webhooks/resend`                           |
| `CRON_SECRET`            | Authorizes the Vercel cron call to `/api/cron/account-email-outbox`          |

See the [account email production checklist](docs/context/ACCOUNT_EMAIL_PRODUCTION_CHECKLIST.md) for production email setup.

### Database

```bash
npm run db:migrate   # Apply pending SQL migrations from drizzle/
```

Schema lives in `src/shared/db/schema.ts`; see [`src/shared/db/README.md`](src/shared/db/README.md). Production migrations run through the manual `DB Migration` GitHub Actions workflow.

### Development

```bash
npm run dev          # Start dev server at http://localhost:3000
```

## Scripts

| Command                        | Description                                         |
| ------------------------------ | --------------------------------------------------- |
| `npm run dev`                  | Start Next.js dev server                            |
| `npm run build`                | Production build                                    |
| `npm run start`                | Start production server                             |
| `npm run validate`             | Typecheck + Lint + Tests (run before a PR)          |
| `npm run spec:check`           | Strict validation of OpenSpec specs and changes     |
| `npm run test`                 | Run unit tests (Jest)                               |
| `npm run test:watch`           | Run tests in watch mode                             |
| `npm run test:e2e`             | Run E2E tests (Playwright)                          |
| `npm run typecheck`            | TypeScript check (no emit)                          |
| `npm run lint`                 | ESLint check (zero warnings)                        |
| `npm run format`               | Prettier format                                     |
| `npm run format:check`         | Prettier check                                      |
| `npm run db:generate`          | Generate a SQL migration from the Drizzle schema    |
| `npm run db:migrate`           | Apply pending migrations (`scripts/db-migrate.mjs`) |
| `npm run db:push`              | Push the schema directly with drizzle-kit           |
| `npm run db:studio`            | Open Drizzle Studio                                 |
| `npm run db:backfill:layout`   | Backfill dashboard layout config                    |
| `npm run db:backfill:keywords` | Backfill keyword mappings                           |

For agent work, use the [repository workflow](docs/engineering/agent-workflow.md).
The vault task register owns task status; OpenSpec changes hold scoped
requirements and implementation checklists.

## Testing

- **Unit tests:** Jest + React Testing Library, `__tests__` folders in each FSD slice
- **E2E tests:** Playwright with 9 spec files covering dashboard, expenses, layout, responsive design, mobile forms, touch targets, and viewport handling
- **Coverage threshold:** 70% (branches, functions, lines, statements)
- **Viewports tested:** mobile (small/medium/large), tablet (small/large), desktop, desktop large
- **Browsers:** Chromium, Firefox, WebKit

## Design System

Dark "Terminal" aesthetic with a monospace accent font:

- **Background:** `zinc-950` / **Surface:** `zinc-900/30` (glassy)
- **Text:** `zinc-200` (primary) / `zinc-400` (secondary)
- **Accents:** Blue (primary), Emerald (income), Amber (events), Red (expense/danger)
- **Fonts:** Inter (UI) + JetBrains Mono (data/numbers)
- **Touch targets:** 44x44px minimum
- **Transitions:** 150-300ms ease-out

## Coding Standards

- **TDD:** Write tests before implementation
- **Backend:** Server Actions for app data; route handlers only for NextAuth, the cron job, and the Resend webhook
- **Mutations:** optimistic updates with rollback for user-visible TanStack Query mutations
- **Components:** PascalCase names, kebab-case files
- **No Context API:** Reatom only for global state
- **Drag & Drop:** HTML5 API only (no external libraries)
- **Documentation:** Every FSD slice has a README.md
- **Pre-commit:** Husky + lint-staged (ESLint + Prettier); commit messages are checked by commitlint ([format](docs/engineering/change-request.md))
