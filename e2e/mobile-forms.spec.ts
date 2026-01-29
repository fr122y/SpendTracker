import { test, expect } from '@playwright/test'

test.describe('Mobile Form Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test.describe('Expense Form on Mobile', () => {
    test('inputs should be full width on mobile', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')

      await expect(descriptionInput).toBeVisible()
      await expect(amountInput).toBeVisible()

      // Get parent form width
      const formWidth = await descriptionInput.evaluate((input) => {
        const form = input.closest('form')
        return form ? form.offsetWidth : 0
      })

      // Get input widths
      const descriptionBox = await descriptionInput.boundingBox()
      const amountBox = await amountInput.boundingBox()

      expect(descriptionBox).not.toBeNull()
      expect(amountBox).not.toBeNull()

      if (descriptionBox && amountBox && formWidth > 0) {
        // Inputs should be close to full width (allow for padding)
        expect(descriptionBox.width).toBeGreaterThan(formWidth * 0.8)
        expect(amountBox.width).toBeGreaterThan(formWidth * 0.8)
      }
    })

    test('submit button should be full width on mobile', async ({ page }) => {
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })
      await expect(submitButton).toBeVisible()

      // Get parent form width
      const formWidth = await submitButton.evaluate((btn) => {
        const form = btn.closest('form')
        return form ? form.offsetWidth : 0
      })

      const buttonBox = await submitButton.boundingBox()
      expect(buttonBox).not.toBeNull()

      if (buttonBox && formWidth > 0) {
        // Button should be close to full width
        expect(buttonBox.width).toBeGreaterThan(formWidth * 0.8)
      }
    })

    test('form submits correctly on mobile with touch input', async ({
      page,
    }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      // Tap to focus (simulate touch)
      await descriptionInput.tap()
      await descriptionInput.fill('Mobile test expense')

      await amountInput.tap()
      await amountInput.fill('500')

      // Tap submit button
      await submitButton.tap()

      // Verify expense appears
      await expect(page.getByText('Mobile test expense')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText('500 ₽').first()).toBeVisible()
    })

    test('inputs accept keyboard input on mobile', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')

      // Type with keyboard
      await descriptionInput.fill('Keyboard input test')
      await expect(descriptionInput).toHaveValue('Keyboard input test')

      await amountInput.fill('12345')
      await expect(amountInput).toHaveValue('12345')
    })

    test('form clears after submission on mobile', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      await descriptionInput.fill('Clear test')
      await amountInput.fill('100')
      await submitButton.tap()

      // Wait for submission
      await expect(page.getByText('Clear test')).toBeVisible({
        timeout: 10000,
      })

      // Form should be cleared
      await expect(descriptionInput).toHaveValue('')
      await expect(amountInput).toHaveValue('')
    })

    test('inputs have proper focus states on mobile', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')

      // Focus input
      await descriptionInput.focus()

      // Check for focus-visible ring
      const hasFocusRing = await descriptionInput.evaluate((input) => {
        const computed = window.getComputedStyle(input)
        return (
          computed.outline !== 'none' ||
          computed.boxShadow.includes('ring') ||
          computed.boxShadow !== 'none'
        )
      })

      expect(hasFocusRing).toBe(true)
    })
  })

  test.describe('Form Accessibility on Mobile', () => {
    test('inputs have placeholders', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')

      // Verify inputs have placeholder
      await expect(descriptionInput).toHaveAttribute(
        'placeholder',
        'Описание расхода'
      )
      await expect(amountInput).toHaveAttribute('placeholder', 'Сумма')
    })

    test('submit button is visible and accessible', async ({ page }) => {
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      // Button should be visible and accessible
      await expect(submitButton).toBeVisible()
      await expect(submitButton).toBeEnabled()
    })
  })
})
