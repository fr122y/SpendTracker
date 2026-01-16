# Manage Projects Feature

CRUD operations for expense projects with budget allocation.

## Public API (`index.ts`)

- `ProjectForm`: Form for creating/editing projects
- `useManageProjects`: Hook with mutations for project CRUD

## State & Data

- **Mutation:** Uses TanStack Query mutations for CRUD operations
- **Actions:** Create, update, delete projects, set budget

## Dependencies

- Uses: `@/entities/project`, `@/shared/api`, `@/shared/ui`
