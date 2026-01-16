# Category Entity

Business entity representing an expense category.

## Public API (`index.ts`)

- `useCategoryStore`: Zustand store for category state management
- `Category`: TypeScript type for category object
- `CategoryBadge`: UI component displaying category with color

## State & Data

- **Store:** `useCategoryStore` (Persistence Key: `smartspend-categories`)
- **Actions:** `addCategory`, `removeCategory`, `updateCategory`, `getById`

## Type Definition

```typescript
interface Category {
  id: string
  name: string
  color: string
  icon?: string
}
```

## Dependencies

- Uses: `@/shared/types`, `@/shared/lib`
