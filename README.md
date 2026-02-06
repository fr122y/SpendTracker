# SmartSpend Tracker

Personal finance SPA for expense tracking, budget management, and AI-powered categorization. Built with Next.js 16, React 19, and Feature-Sliced Design architecture. UI language: Russian.

## Tech Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Framework    | Next.js 16 (App Router) + React 19            |
| Language     | TypeScript 5.7                                |
| Styling      | Tailwind CSS v4 (CSS-first, zero-config)      |
| Client State | Reatom v4 + localStorage persistence          |
| Server State | TanStack Query v5                             |
| AI/Backend   | Server Actions + OpenAI SDK (DeepSeek/OpenAI) |
| Charts       | Recharts                                      |
| Validation   | Zod                                           |
| Testing      | Jest + React Testing Library + Playwright     |
| Linting      | ESLint 9 + Prettier                           |

## Features

- **Expense Tracking** — add, edit, delete expenses with amount, category, date, and emoji
- **AI Categorization** — automatic expense categorization via Server Action (fallback to "Другое")
- **Math Input** — type `500+50` and it evaluates to `550`
- **Budget Monitoring** — weekly spending limit with progress bar and over-budget detection
- **Savings Buckets** — allocate salary into savings/investment buckets by percentage
- **Projects** — group expenses by project with dedicated budgets and auto-assigned colors
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
├── app/                # Next.js App Router (layout, page, globals)
├── _pages/             # Page compositions (dashboard)
├── entities/           # Business models & Reatom stores
│   ├── expense/        # Expense records
│   ├── category/       # Expense categories (6 Russian defaults)
│   ├── project/        # Projects for grouping expenses
│   ├── bucket/         # Allocation buckets (Savings/Investments)
│   ├── settings/       # Financial settings (limits, salary days)
│   └── session/        # Ephemeral session state (no persistence)
├── features/           # User interactions
│   ├── add-expense/    # Expense form + AI categorization
│   ├── manage-*/       # CRUD features for categories, projects, buckets
│   ├── layout-editor/  # Dashboard drag-drop customization
│   ├── widget-registry/# Widget metadata registry
│   └── month-picker/   # Month selection modal
├── widgets/            # Composite dashboard blocks
│   ├── dashboard-grid/ # Responsive layout grid
│   ├── calendar/       # Interactive calendar
│   ├── expense-log/    # Daily expenses + add form
│   ├── analysis/       # Category spending breakdown
│   ├── dynamics-chart/ # Daily spending bar chart
│   ├── weekly-budget/  # Weekly spend progress bar
│   ├── savings/        # Budget allocation buckets
│   └── projects/       # Project grid with details
├── shared/             # UI kit, utilities, Server Actions, types
│   ├── api/            # Server Actions + QueryClient
│   ├── lib/            # Utilities (cn, math-eval, finance-selectors)
│   ├── ui/             # Button, Input, MathInput, TerminalPanel, etc.
│   └── types/          # Global TypeScript definitions
└── providers/          # Reatom + TanStack Query providers
```

**Layer rules:**

- `entities` → no dependencies on features/widgets
- `features` → can use entities + shared
- `widgets` → can use entities, features, shared (not other widgets)
- `shared` → no business logic, no upper-layer dependencies

## State Management

| Store              | Persistence Key         | Purpose                  |
| ------------------ | ----------------------- | ------------------------ |
| `useExpenseStore`  | `smartspend-expenses`   | Expense records          |
| `useCategoryStore` | `smartspend-categories` | Expense categories       |
| `useProjectStore`  | `smartspend-projects`   | Projects                 |
| `useBucketStore`   | `smartspend-buckets`    | Allocation buckets       |
| `useSettingsStore` | `smartspend-settings`   | Financial settings       |
| `useSessionStore`  | — (ephemeral)           | Selected date, view date |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone <repository-url>
cd SpendTracker
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.openai.com/v1   # or DeepSeek URL
AI_MODEL=gpt-4o-mini                     # or deepseek-chat
```

### Development

```bash
npm run dev          # Start dev server at http://localhost:3000
```

## Scripts

| Command                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start Next.js dev server                     |
| `npm run build`        | Production build                             |
| `npm run start`        | Start production server                      |
| `npm run validate`     | Typecheck + Lint + Tests (run before commit) |
| `npm run test`         | Run unit tests (Jest)                        |
| `npm run test:watch`   | Run tests in watch mode                      |
| `npm run test:e2e`     | Run E2E tests (Playwright)                   |
| `npm run typecheck`    | TypeScript check (no emit)                   |
| `npm run lint`         | ESLint check (zero warnings)                 |
| `npm run format`       | Prettier format                              |
| `npm run format:check` | Prettier check                               |

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
- **Hydration:** `next/dynamic` with `{ ssr: false }` for localStorage-dependent components
- **Components:** PascalCase names, kebab-case files
- **No Context API:** Reatom only for global state
- **Drag & Drop:** HTML5 API only (no external libraries)
- **Documentation:** Every FSD slice has a README.md
- **Pre-commit:** Husky + lint-staged (ESLint + Prettier)
