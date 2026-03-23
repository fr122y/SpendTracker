# Project Entity

Manages spending projects with DB-backed query hooks and mutation actions.

## Public API (`index.ts`)

- `useProjects`: Query hook for the project list
- `useAddProject`: Mutation hook for creating a project
- `useDeleteProject`: Mutation hook for deleting a project
- `ProjectCard`: Component displaying project name, budget, and spend progress

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **Project fields:** name, budget, color, createdAt

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/types` (Project type)
- Uses: `@/shared/ui` (ProgressBar component)
