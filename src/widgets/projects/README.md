# Projects Widget

Manages expense projects with budget tracking and per-project expense management.

## Public API (`index.ts`)

- `ProjectsSection`: Project grid with expandable details and create form

## State & Data

- `useProjects`: projects list
- `useDeleteProject`: project deletion mutation
- `useExpenses`: expenses list for project-linked totals
- `useDeleteExpense`: expense deletion mutation for project-linked expenses

## Features

- "Create Project" toggle button and form
- Responsive grid of ProjectCard components
- Click card to expand/collapse
- Expanded view includes project deletion and project expense form
- Budget progress display via ProjectCard
- Empty state message when no projects

## Dependencies

- Uses: `@/entities/project`, `@/entities/expense`, `@/features/manage-projects`, `@/shared/ui`, `@/shared/lib`
