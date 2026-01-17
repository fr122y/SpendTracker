# Projects Widget

Manages expense projects with budget tracking and per-project expense management.

## Public API (`index.ts`)

- `ProjectsSection`: Project grid with expandable details and create form

## State & Data

- **Stores:**
  - `useProjectStore`: projects, deleteProject
  - `useExpenseStore`: expenses, deleteExpense (for project-linked expenses)

## Features

- "Create Project" toggle button and form
- Responsive grid of ProjectCard components (2 columns on desktop)
- Click card to expand/collapse
- Expanded view includes:
  - Delete project button (removes project and all associated expenses)
  - ProjectExpenseForm for adding expenses to the project
  - Scrollable ExpenseList showing project expenses
- Budget progress display via ProjectCard
- Empty state message when no projects

## Dependencies

- Uses: `@/entities/project`, `@/entities/expense`, `@/features/manage-projects`, `@/shared/ui`, `@/shared/lib`
