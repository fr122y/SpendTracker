import {
  expect,
  expenseRow,
  journalForm,
  openJournal,
  reloadPage,
  test,
  TIMEOUT,
} from './utils/expenses'

import type { Locator } from '@playwright/test'

async function expectTouchTarget(target: Locator): Promise<void> {
  await expect(target).toBeVisible()
  const box = await target.boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
}

test.describe('Touch Target Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-grid-container]')).toBeVisible(TIMEOUT)
  })

  test.describe('Navigation Buttons', () => {
    test('header previous day button meets 44x44px minimum on mobile', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await expectTouchTarget(
        page
          .getByRole('banner')
          .getByRole('button', { name: 'Предыдущий день' })
      )
    })

    test('header next day button meets 44x44px minimum on mobile', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await expectTouchTarget(
        page.getByRole('banner').getByRole('button', { name: 'Следующий день' })
      )
    })

    test('calendar month buttons meet 44x44px minimum on mobile', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await reloadPage(page)
      // On mobile the calendar sits in a collapsed accordion section
      const toggle = page.getByRole('button', { name: 'Календарь' })
      if ((await toggle.getAttribute('aria-expanded')) === 'false') {
        await toggle.click()
      }

      for (const name of ['Предыдущий месяц', 'Следующий месяц']) {
        await expectTouchTarget(page.getByRole('button', { name, exact: true }))
      }
    })
  })

  test.describe('Form Buttons', () => {
    test('submit button meets 44px minimum height', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await reloadPage(page)
      await openJournal(page)

      const submitButton = journalForm(page).getByRole('button', {
        name: 'Добавить',
        exact: true,
      })
      await expect(submitButton).toBeVisible()

      const box = await submitButton.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })
  })

  test.describe('Delete Buttons', () => {
    test('delete button meets 44x44px minimum on mobile', async ({
      page,
      expenses,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      // Load the mobile layout from scratch, so it does not remount mid-input
      await reloadPage(page)

      const expense = await expenses.add('E2E проверка кнопки удаления')

      await expectTouchTarget(
        expenseRow(page, expense.description, expense.amount).getByRole(
          'button',
          { name: 'delete' }
        )
      )

      // Clean up at desktop width: the mobile accordion can collapse the
      // journal again after a reload and cover the row's delete button.
      await page.setViewportSize({ width: 1280, height: 720 })
      await expenses.remove(expense)
    })
  })

  test.describe('Drag Handles', () => {
    test('drag handles meet 44x44px minimum on desktop edit mode', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      // Enter edit mode
      const header = page.getByRole('banner')
      await header.getByRole('button', { name: /Редактировать/ }).click()

      // Check drag handle size
      const dragHandle = page
        .locator('[aria-label="Перетащить виджет"]')
        .first()
      await expect(dragHandle).toBeVisible()

      const box = await dragHandle.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })
  })

  test.describe('Interactive Element Spacing', () => {
    test('all buttons have adequate spacing on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const header = page.getByRole('banner')
      const buttons = header.getByRole('button')

      const count = await buttons.count()
      expect(count).toBeGreaterThan(0)

      // Check spacing between buttons using gap
      const hasGap = await header.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        const gap = computed.gap
        return gap && gap !== '0px' && gap !== 'normal'
      })

      expect(hasGap).toBe(true)
    })
  })
})
