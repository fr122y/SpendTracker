# Layout Editor Feature

Dashboard layout customization with drag-and-drop grid editing.

## Public API (`index.ts`)

- `LayoutEditor`: Grid editor component with HTML5 drag-and-drop
- `useLayoutEditor`: Hook for layout manipulation

## State & Data

- **Store:** Uses `useLayoutStore` (Persistence Key: `smartspend-layout`)
- **Actions:** Rearrange widgets, toggle visibility, reset to default

## Notes

- Uses native HTML5 Drag & Drop API (no external dnd libs)

## Dependencies

- Uses: `@/shared/ui`, `@/shared/lib`
