# Project Entity

Business entity representing a spending project with budget allocation.

## Public API (`index.ts`)

- `useProjectStore`: Zustand store for project state management
- `Project`: TypeScript type for project object
- `ProjectCard`: UI component displaying project with budget progress

## State & Data

- **Store:** `useProjectStore` (Persistence Key: `smartspend-projects`)
- **Actions:** `addProject`, `removeProject`, `updateProject`, `getById`

## Type Definition

```typescript
interface Project {
  id: string
  name: string
  budget: number
  startDate: string
  endDate?: string
  isActive: boolean
}
```

## Dependencies

- Uses: `@/shared/types`, `@/shared/lib`
