// Category entity - Public API
export {
  type DeleteCategoryInput,
  isCategoryNameDuplicate,
  isSharedCategoryNameDuplicate,
  useAddCategory,
  useAddSharedBudgetCategory,
  useArchiveSharedBudgetCategory,
  getDefaultReassignTarget,
  useCategories,
  useCategoryExpenseCount,
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
