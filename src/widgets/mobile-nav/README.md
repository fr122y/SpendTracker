# Mobile Navigation Widget

Bottom navigation bar for mobile devices, providing primary app navigation.

## Public API (`index.ts`)

- `MobileNav`: Bottom navigation component with 4 main sections (Главная, Расходы, Аналитика, Настройки)

## Design Specifications

### Layout

- **Position:** Fixed at bottom (`fixed bottom-0 left-0 right-0 z-50`)
- **Height:** 56px (`h-14`)
- **Visibility:** Mobile only (`block sm:hidden`)
- **Background:** Semi-transparent dark with backdrop blur (`bg-zinc-900/95 backdrop-blur-md`)

### Accessibility

- **Touch Targets:** Minimum 48px height (`min-h-12`)
- **Semantic HTML:** Uses `<nav>` with `aria-label`
- **Focus States:** Visible ring for keyboard navigation
- **Active State:** `aria-current="page"` for current route

### Visual States

- **Active:** `text-emerald-400` (high contrast accent)
- **Inactive:** `text-zinc-500` with `hover:text-zinc-300`
- **Focus:** Ring with emerald accent

## Navigation Items

1. **Главная** (Home) - `/` - Home icon
2. **Расходы** (Expenses) - `/expenses` - Receipt icon
3. **Аналитика** (Analytics) - `/analytics` - PieChart icon
4. **Настройки** (Settings) - `/settings` - Settings icon

## Dependencies

- **Next.js:** Uses `Link` and `usePathname` for routing
- **lucide-react:** Icons (Home, Receipt, PieChart, Settings)
- **@/shared/lib:** `cn` utility for className merging

## Usage

```tsx
import { MobileNav } from '@/widgets/mobile-nav'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <MobileNav />
    </>
  )
}
```
