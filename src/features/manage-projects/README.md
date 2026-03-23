# Manage Projects Feature

CRUD operations for expense projects with budget allocation.

## Public API (`index.ts`)

- `CreateProjectForm`: Form for creating new projects with name and budget
- `ProjectExpenseForm`: Form for adding expenses to a specific project

## State & Data

- `useProjects`: Query hook for the project list
- `useAddProject`: Mutation hook for creating a project
- `useDeleteProject`: Mutation hook for deleting a project
- `useCategories`: Query hook for category suggestions in project expense forms
- `useAddExpense`: Mutation hook for saving project-linked expenses

## Features

- Create project with name and budget limit
- Auto-generated color from predefined palette
- Add expenses linked to projects with AI categorization
- Fallback to "Другое" category on AI failure

## Dependencies

- Uses: `@/entities/project`, `@/entities/expense`, `@/entities/category`, `@/shared/api`, `@/shared/ui`
