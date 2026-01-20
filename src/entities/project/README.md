# Project Entity

Manages spending projects with budget allocation and progress tracking.

## Public API (`index.ts`)

- `useProjectStore`: Reatom store hook for project state management
- `ProjectCard`: Component displaying project name, budget, and spend progress

## State & Data

- **Store:** `useProjectStore` (Persistence Key: `smartspend-projects`)
- **Actions:**
  - `addProject(project)`: Add new project with auto-generated random color
  - `deleteProject(id)`: Remove project by ID

## Dependencies

- Uses: `@/shared/types` (Project type)
- Uses: `@/shared/ui` (ProgressBar component)
