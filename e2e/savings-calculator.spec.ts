import {
  getE2ECredentials,
  loginWithCredentials,
  MISSING_E2E_CREDENTIALS_MESSAGE,
  SIGNED_OUT_STATE,
} from './utils/auth'
import { test, expect } from './utils/test'

const TIMEOUT = { timeout: 10000 }

// This spec signs in through `/login` itself, so it starts signed out.
test.use({ storageState: SIGNED_OUT_STATE })

test.describe('Savings calculator', () => {
  const credentials = getE2ECredentials()

  // Registered only with E2E credentials (see MISSING_E2E_CREDENTIALS_MESSAGE);
  // a skip marker in this new file would trip the test-integrity check.
  if (!credentials) {
    console.warn(MISSING_E2E_CREDENTIALS_MESSAGE)
    return
  }

  test('inserts a savings value, computes, offers copying, accepts keyboard input, and restores after reload', async ({
    page,
  }) => {
    await loginWithCredentials(page, credentials!)

    await page.getByRole('button', { name: 'Открыть калькулятор' }).click()
    const calculator = page.getByRole('dialog', { name: 'Калькулятор' })
    await expect(calculator).toBeVisible(TIMEOUT)

    await expect(
      page.getByRole('button', { name: 'Открыть калькулятор' })
    ).toBeHidden()

    const incomeChip = calculator.getByRole('button', {
      name: /^Месячный доход · /,
    })
    await expect(incomeChip).toBeVisible(TIMEOUT)
    const chipName = (await incomeChip.getAttribute('aria-label')) ?? ''
    const income = Number(
      chipName
        .replace(/^Месячный доход · /, '')
        .replace(/[^\d,−-]/g, '')
        .replace('−', '-')
        .replace(',', '.')
    )

    await calculator.getByRole('button', { name: 'Очистить' }).click()
    await calculator.getByRole('button', { name: '1', exact: true }).click()
    await incomeChip.click()

    const expression = calculator.getByTestId('calculator-expression')
    await expect(expression).toHaveText('1+Мес. д.')

    await calculator.getByRole('button', { name: 'Равно' }).click()
    const expected = Math.round((income + 1) * 100) / 100
    await expect(expression).toHaveText(String(expected).replace('.', ','))
    await expect(calculator.getByTestId('calculator-result')).not.toHaveText(
      '—'
    )
    await expect(
      calculator.getByRole('button', { name: 'Скопировать' })
    ).toBeEnabled()

    // Physical keyboard drives the same commands as the on-screen keypad.
    await page.keyboard.press('Delete')
    await page.keyboard.type('12*3')
    await expect(expression).toHaveText('12×3')
    await page.keyboard.press('Enter')
    await expect(expression).toHaveText('36')
    await page.keyboard.press('Delete')
    await page.keyboard.type(String(expected).replace('.', ','))
    await expect(expression).toHaveText(String(expected).replace('.', ','))

    await calculator
      .getByRole('button', { name: 'Закрыть калькулятор' })
      .click()
    await expect(calculator).toBeHidden()

    await page.reload()
    await page.getByRole('button', { name: 'Открыть калькулятор' }).click()
    await expect(
      page
        .getByRole('dialog', { name: 'Калькулятор' })
        .getByTestId('calculator-expression')
    ).toHaveText(String(expected).replace('.', ','), TIMEOUT)
  })
})
