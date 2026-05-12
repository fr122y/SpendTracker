# Projects Widget

Manages expense projects with budget tracking and per-project operation
management.

## Public API (`index.ts`)

- `ProjectsSection`: Project grid with expandable details and create form

## State & Data

- `useProjects`: projects list
- `useDeleteProject`: project deletion mutation
- `useExpenses`: operation list for project-linked totals
- `useDeleteExpense`: deletion mutation for project-linked operations

## Features

- "Create Project" toggle button and form
- Responsive grid of ProjectCard components
- Click card to expand/collapse
- Expanded view includes project deletion and project operation form
- Budget progress distinguishes real spent money from project cash on hand
- Empty state message when no projects

## Dependencies

- Uses: `@/entities/project`, `@/entities/expense`, `@/features/manage-projects`, `@/shared/ui`, `@/shared/lib`
