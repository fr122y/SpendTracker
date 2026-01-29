'use client'

import { Home, Receipt, PieChart, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/shared/lib'

interface NavItem {
  id: string
  label: string
  href: string
  icon: typeof Home
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Главная', href: '/', icon: Home },
  { id: 'expenses', label: 'Расходы', href: '/expenses', icon: Receipt },
  { id: 'analytics', label: 'Аналитика', href: '/analytics', icon: PieChart },
  { id: 'settings', label: 'Настройки', href: '/settings', icon: Settings },
]

/**
 * MobileNav Component
 *
 * Bottom navigation bar for mobile devices.
 * Provides primary navigation with 4 main sections.
 *
 * Design Requirements:
 * - Fixed at bottom, 56px height (h-14)
 * - Only visible on mobile (hidden on sm+)
 * - Touch targets: 48px minimum (min-h-12)
 * - Active state: emerald-400
 * - Inactive state: zinc-500
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Мобильная навигация"
      className={cn(
        /* Position: Fixed at bottom with backdrop blur for terminal aesthetic */
        'fixed bottom-0 left-0 right-0 z-50',
        /* Height: 56px (h-14) as specified */
        'h-14',
        /* Background: Semi-transparent dark with blur and top border */
        'bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800',
        /* Visibility: Only on mobile, hidden on tablet+ */
        'block sm:hidden'
      )}
    >
      <ul className="flex h-full items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  /* Touch target: 48px minimum height */
                  'min-h-12',
                  /* Layout: Flexbox column with centered content */
                  'flex flex-col items-center justify-center gap-0.5',
                  /* Typography: Small text, uppercase tracking for readability */
                  'text-[10px] font-medium uppercase tracking-wider',
                  /* Transition: Smooth color changes */
                  'transition-colors duration-200',
                  /* Active state: Emerald accent */
                  isActive && 'text-emerald-400',
                  /* Inactive state: Muted zinc with hover feedback */
                  !isActive && 'text-zinc-500 hover:text-zinc-300',
                  /* Focus state: Visible outline for keyboard navigation */
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon: 20px size for clarity at mobile scale */}
                <Icon className="h-5 w-5" aria-hidden="true" />
                {/* Label: Screen reader friendly, visible text */}
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
