# Manage Projects Feature

CRUD operations for expense projects with budget allocation.

## Public API (`index.ts`)

- `CreateProjectForm`: Form for creating new projects with name and budget
- `ProjectExpenseForm`: Form for adding expenses to a specific project

## State & Data

- **Store:** Uses `useProjectStore` for project management
- **Mutation:** Uses TanStack Query for AI categorization of project expenses
- **Actions:** Create project (auto-assigns color), add project expense

## Features

- Create project with name and budget limit
- Auto-generated color from predefined palette
- Add expenses linked to projects with AI categorization
- Fallback to "Другое" category on AI failure

## Dependencies

- Uses: `@/entities/project`, `@/entities/expense`, `@/entities/category`, `@/shared/api`, `@/shared/ui`
