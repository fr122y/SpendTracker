# Category Entity

Manages expense categories with persistent storage and default Russian categories.

## Public API (`index.ts`)

- `useCategoryStore`: Reatom store hook for category state management
- `CategoryBadge`: Pill/badge component displaying emoji + name

## State & Data

- **Store:** `useCategoryStore` (Persistence Key: `smartspend-categories`)
- **Default Categories:** Initialized with 6 Russian categories if storage is empty
  - Продукты (Groceries)
  - Транспорт (Transport)
  - Еда (Food)
  - Здоровье (Health)
  - Развлечения (Fun)
  - Другое (Other)
- **Actions:**
  - `addCategory(category)`: Add new category
  - `addCategoryIfUnique(category)`: Add category with duplicate validation, returns boolean
  - `deleteCategory(id)`: Remove category by ID

## Validation

- `isCategoryNameDuplicate(name, categories)`: Pure function to check for duplicate names (case-insensitive, whitespace-trimmed)

## Dependencies

- Uses: `@/shared/types` (Category type)
