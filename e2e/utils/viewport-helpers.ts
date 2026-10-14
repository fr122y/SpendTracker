/**
 * E2E Viewport Test Utilities
 * Helper functions for responsive design validation
 */

import { expect, type Page } from '@playwright/test'

/**
 * Viewport category type matching app's viewport hook
 */
export type ViewportCategory = 'mobile' | 'tablet' | 'desktop'

/**
 * Determines viewport category based on width
 * Matches src/shared/lib/hooks/use-viewport.ts breakpoints
 */
export function getViewportCategory(width: number): ViewportCategory {
  if (width < 768) return 'mobile'
  if (width < 1280) return 'tablet'
  return 'desktop'
}

/**
 * Verifies no horizontal scroll exists on the page
 * Tests that content fits within viewport width
 */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const scrollWidth = await page.evaluate(() => {
    const body = document.body
    const html = document.documentElement
    return {
      scrollWidth: Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      ),
      clientWidth: html.clientWidth,
    }
  })

  expect(scrollWidth.scrollWidth).toBeLessThanOrEqual(
    scrollWidth.clientWidth + 1 // +1 for rounding tolerance
  )
}

/**
 * Verifies minimum touch target size for interactive elements
 * Default minimum is 44x44px per accessibility guidelines
 */
export async function expectMinimumTouchTarget(
  page: Page,
  selector: string,
  minSize = 44
): Promise<void> {
  const element = page.locator(selector).first()
  await expect(element).toBeVisible()

  const box = await element.boundingBox()
  expect(box).not.toBeNull()

  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(minSize)
    expect(box.height).toBeGreaterThanOrEqual(minSize)
  }
}

/**
 * Verifies expected number of visible columns in grid layout.
 * Counts columns geometrically from the actual placement of the widget
 * cards inside `data-grid-container`, for every layout:
 * - widget cards are the children of the outermost vertical flex
 *   containers (mobile accordion list, tablet grid columns, desktop
 *   column stacks);
 * - cards are grouped by their left edge (4px tolerance);
 * - columns must not overlap horizontally.
 * Returns 0 (fails) when no visible widget cards are found.
 * Waits for the grid, since the skeleton renders while the layout loads.
 */
export async function expectVisibleColumns(
  page: Page,
  expectedCount: number
): Promise<void> {
  await expect(page.locator('[data-grid-container]')).toBeVisible({
    timeout: 10000,
  })

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const grid = document.querySelector('[data-grid-container]')
          if (!grid) return 0

          const cards: Element[] = []
          const visit = (el: Element) => {
            for (const child of Array.from(el.children)) {
              const style = window.getComputedStyle(child)
              if (
                style.display === 'flex' &&
                style.flexDirection === 'column'
              ) {
                cards.push(...Array.from(child.children))
              } else {
                visit(child)
              }
            }
          }
          visit(grid)

          const boxes = cards
            .map((card) => card.getBoundingClientRect())
            .filter((box) => box.width > 0 && box.height > 0)
          if (boxes.length === 0) return 0

          const columns: { left: number; right: number }[] = []
          for (const box of boxes) {
            const column = columns.find((c) => Math.abs(c.left - box.left) <= 4)
            if (column) column.right = Math.max(column.right, box.right)
            else columns.push({ left: box.left, right: box.right })
          }

          columns.sort((a, b) => a.left - b.left)
          for (let i = 1; i < columns.length; i++) {
            if (columns[i].left < columns[i - 1].right - 1) return -1
          }
          return columns.length
        }),
      { timeout: 10000 }
    )
    .toBe(expectedCount)
}

/**
 * Verifies element has proper spacing (matches Tailwind scale)
 * Tests adherence to 4px spacing grid
 */
export async function expectTailwindSpacing(
  page: Page,
  selector: string,
  property: 'padding' | 'margin',
  expectedRem: number
): Promise<void> {
  const element = page.locator(selector).first()
  await expect(element).toBeVisible()

  const value = await element.evaluate((el, prop) => {
    const computed = window.getComputedStyle(el)
    const propName = prop === 'padding' ? 'paddingTop' : 'marginTop'
    return parseFloat(computed[propName as keyof CSSStyleDeclaration] as string)
  }, property)

  // Convert rem to px (assuming 16px base)
  const expectedPx = expectedRem * 16
  expect(value).toBeCloseTo(expectedPx, 1) // Allow 1px tolerance
}

/**
 * Verifies widget is visible and has correct layout on current viewport
 */
export async function expectWidgetVisible(
  page: Page,
  widgetTitle: string
): Promise<void> {
  await expect(page.getByText(widgetTitle, { exact: true })).toBeVisible()
}

/**
 * Gets current viewport dimensions from page
 */
export async function getViewportSize(page: Page): Promise<{
  width: number
  height: number
}> {
  return await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
}

/**
 * Verifies all interactive elements have focus-visible styles
 * Tests keyboard navigation accessibility
 */
export async function expectFocusVisible(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector).first()
  await expect(element).toBeVisible()

  // Focus the element via keyboard
  await element.focus()

  // Verify focus-visible ring appears
  const hasFocusRing = await element.evaluate((el) => {
    const computed = window.getComputedStyle(el)
    // Check for ring or outline
    return (
      computed.outline !== 'none' ||
      computed.boxShadow.includes('ring') ||
      computed.boxShadow !== 'none'
    )
  })

  expect(hasFocusRing).toBe(true)
}
