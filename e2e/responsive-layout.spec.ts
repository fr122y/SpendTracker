import { test, expect, type Page } from '@playwright/test'

import { journalForm, openJournal, TIMEOUT } from './utils/expenses'
import {
  getViewportCategory,
  expectNoHorizontalScroll,
  expectVisibleColumns,
  expectWidgetVisible,
  getViewportSize,
} from './utils/viewport-helpers'

test.describe('Responsive Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test.describe('Mobile Layout (< 768px)', () => {
    test('should display single column layout on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      const size = await getViewportSize(page)
      const category = getViewportCategory(size.width)
      expect(category).toBe('mobile')

      // Verify single column
      await expectVisibleColumns(page, 1)
    })

    test('should show all widgets in stacked layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // All widgets should be visible (may need scrolling)
      await expectWidgetVisible(page, 'Календарь')
      await expectWidgetVisible(page, 'Журнал расходов')
      await expectWidgetVisible(page, 'Анализ')
      await expectWidgetVisible(page, 'Динамика')
    })

    test('should have no horizontal scroll on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await expectNoHorizontalScroll(page)
    })

    test('should not show drag handles on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Enter edit mode via mobile button
      const header = page.getByRole('banner')
      const editButton = header.getByRole('button').first()
      await editButton.click()

      // Drag handles should NOT be visible on mobile
      const dragHandles = page.locator('[aria-label="Перетащить виджет"]')
      await expect(dragHandles).toHaveCount(0)
    })
  })

  test.describe('Tablet Layout (768px - 1279px)', () => {
    test('should display 2-column layout on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      const size = await getViewportSize(page)
      const category = getViewportCategory(size.width)
      expect(category).toBe('tablet')

      // Verify 2 columns
      await expectVisibleColumns(page, 2)
    })

    test('should have no horizontal scroll on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await expectNoHorizontalScroll(page)
    })

    test('should not show drag handles on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      // Enter edit mode
      const header = page.getByRole('banner')
      await header.getByRole('button', { name: /Редактировать/ }).click()

      // Drag handles should NOT be visible on tablet
      const dragHandles = page.locator('[aria-label="Перетащить виджет"]')
      await expect(dragHandles).toHaveCount(0)
    })
  })

  test.describe('Desktop Layout (>= 1280px)', () => {
    test('should display multi-column layout on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      const size = await getViewportSize(page)
      const category = getViewportCategory(size.width)
      expect(category).toBe('desktop')

      // Desktop has 3 columns by default
      await expectVisibleColumns(page, 3)
    })

    test('should show drag handles in edit mode on desktop', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      // Enter edit mode
      const header = page.getByRole('banner')
      await header.getByRole('button', { name: /Редактировать/ }).click()

      // Drag handles SHOULD be visible on desktop
      const dragHandles = page.locator('[aria-label="Перетащить виджет"]')
      await expect(dragHandles.first()).toBeVisible()
    })

    test('should have no horizontal scroll on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await expectNoHorizontalScroll(page)
    })
  })

  test.describe('Responsive Header', () => {
    test('should show compact header on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const header = page.getByRole('banner')
      await expect(header).toBeVisible()

      // Title should be visible
      await expect(header.getByText('SmartSpend Terminal')).toBeVisible()
    })

    test('should show full header on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      const header = page.getByRole('banner')
      await expect(header).toBeVisible()

      // Should show full edit button text
      await expect(
        header.getByRole('button', { name: /Редактировать/ })
      ).toBeVisible()
    })
  })
})

test.describe('Mobile accordion layout (375×667)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-grid-container]')).toBeVisible(TIMEOUT)
  })

  function accordionToggle(page: Page, widgetId: string) {
    return page.locator(
      `nav[data-testid="mobile-widget-list"] [data-accordion-item="${widgetId}"] > button[aria-expanded]`
    )
  }

  test('collapsed sections are inert and not mounted', async ({ page }) => {
    const sections = page.locator('[data-accordion-content]')
    await expect(sections.first()).toBeAttached()

    const states = await sections.evaluateAll((elements) =>
      elements.map((element) => ({
        id: element.getAttribute('data-accordion-content'),
        inert: element.hasAttribute('inert'),
        // The overflow wrapper is empty while the widget is not mounted
        mountedChildren: element.firstElementChild?.childElementCount ?? -1,
      }))
    )
    expect(states.length).toBeGreaterThan(1)
    for (const state of states) {
      expect(state, String(state.id)).toEqual({
        id: state.id,
        inert: true,
        mountedChildren: 0,
      })
    }
    await expect(journalForm(page)).toHaveCount(0)
  })

  test('the journal has no inner scroll; the page scrolls', async ({
    page,
  }) => {
    await openJournal(page)

    const list = page.getByTestId('expense-log-list')
    await expect(list).toBeAttached()
    expect(
      await list.evaluate((element) => {
        const style = getComputedStyle(element)
        return { maxHeight: style.maxHeight, overflowY: style.overflowY }
      })
    ).toEqual({ maxHeight: 'none', overflowY: 'visible' })

    // No element between the journal and the page scrolls vertically
    const innerScrollers = await list.evaluate((element) => {
      const found: string[] = []
      for (
        let node: Element | null = element;
        node && node !== document.body;
        node = node.parentElement
      ) {
        const { overflowY } = getComputedStyle(node)
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight + 1
        ) {
          found.push(node.outerHTML.slice(0, 80))
        }
      }
      return found
    })
    expect(innerScrollers).toEqual([])
  })

  test('the calculator button does not cover the amount field or «Добавить»', async ({
    page,
  }) => {
    await openJournal(page)
    const launcher = page.getByRole('button', { name: 'Открыть калькулятор' })
    const form = journalForm(page)
    const targets = [
      form.getByLabel('Сумма расхода'),
      form.getByRole('button', { name: 'Добавить', exact: true }),
    ]

    for (const target of targets) {
      // Scroll the target to the bottom edge, where the button sits
      await target.evaluate((element) =>
        element.scrollIntoView({ block: 'end', behavior: 'instant' })
      )
      const box = await target.boundingBox()
      const launcherBox = await launcher.boundingBox()
      expect(box).not.toBeNull()
      expect(launcherBox).not.toBeNull()
      if (box && launcherBox) {
        expect(box.y + box.height).toBeLessThanOrEqual(launcherBox.y)
      }
    }

    // At the very bottom of the page the last section clears the button
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight })
    )
    const lastSection = page.locator('[data-accordion-item]').last()
    const lastBox = await lastSection.boundingBox()
    const launcherBox = await launcher.boundingBox()
    expect(lastBox).not.toBeNull()
    expect(launcherBox).not.toBeNull()
    if (lastBox && launcherBox) {
      expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(launcherBox.y)
    }
  })

  test('tapping a calendar day opens and scrolls to the journal', async ({
    page,
  }) => {
    await accordionToggle(page, 'CALENDAR').click()
    const journalToggle = accordionToggle(page, 'EXPENSE_LOG')
    await expect(journalToggle).toHaveAttribute('aria-expanded', 'false')

    await page
      .locator('[data-accordion-content="CALENDAR"]')
      .getByRole('button', { name: /^15(,|$)/ })
      .first()
      .click()

    await expect(journalToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(journalForm(page)).toBeVisible(TIMEOUT)
    await expect(journalToggle).toBeInViewport()
  })

  test('the email reminder is compact and can be hidden for the session', async ({
    page,
  }) => {
    const reminder = page.getByRole('region', { name: 'Подтверждение email' })
    // The shared e2e account may already be verified; then there is nothing
    // to hide and the reminder must not take space at all.
    if ((await reminder.count()) === 0) {
      await expect(reminder).toHaveCount(0)
      return
    }

    const box = await reminder.boundingBox()
    expect(box?.height ?? 0).toBeLessThanOrEqual(80)

    await reminder.getByRole('button', { name: 'Скрыть напоминание' }).click()
    await expect(reminder).toHaveCount(0)
    await page.reload()
    await expect(page.locator('[data-grid-container]')).toBeVisible(TIMEOUT)
    await expect(reminder).toHaveCount(0)
  })
})
