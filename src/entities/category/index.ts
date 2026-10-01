// Category entity - Public API
export {
  isCategoryNameDuplicate,
  isSharedCategoryNameDuplicate,
  useAddCategory,
  useAddSharedBudgetCategory,
  useArchiveSharedBudgetCategory,
  useCategories,
  useCategoryStore,
  useDeleteCategory,
  useSharedBudgetCategories,
  useUpdateSharedBudgetCategory,
} from './model/queries'
export {
  useCategorize,
  useSharedCategorize,
  type UseCategorizeReturn,
} from './model/use-categorize'
export { CategoryBadge } from './ui/category-badge'
