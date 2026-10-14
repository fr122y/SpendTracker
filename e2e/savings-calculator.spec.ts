import { test, expect } from '@playwright/test'

import {
  getE2ECredentials,
  loginWithCredentials,
  MISSING_E2E_CREDENTIALS_MESSAGE,
} from './utils/auth'

const TIMEOUT = { timeout: 10000 }

test.describe('Savings calculator', () => {
  const credentials = getE2ECredentials()

  test.skip(!credentials, MISSING_E2E_CREDENTIALS_MESSAGE)

  test('inserts a savings value, computes, and offers copying', async ({
    page,
  }) => {
    await loginWithCredentials(page, credentials!)

    await page.getByRole('button', { name: 'Открыть калькулятор' }).click()
    const calculator = page.getByRole('dialog', { name: 'Калькулятор' })
    await expect(calculator).toBeVisible(TIMEOUT)

    const incomeChip = calculator.getByRole('button', {
      name: /^Месячный доход · /,
    })
    await expect(incomeChip).toBeVisible(TIMEOUT)
    await incomeChip.click()

    const expression = calculator.getByTestId('calculator-expression')
    const inserted = (await expression.textContent())?.trim() ?? ''
    expect(inserted).toMatch(/^\d+(,\d{1,2})?$/)

    await calculator.getByRole('button', { name: 'Плюс' }).click()
    await calculator.getByRole('button', { name: '1', exact: true }).click()
    await calculator.getByRole('button', { name: 'Равно' }).click()

    const expected = Number(inserted.replace(',', '.')) + 1
    await expect(expression).toHaveText(String(expected).replace('.', ','))
    await expect(calculator.getByTestId('calculator-result')).not.toHaveText(
      '—'
    )
    await expect(
      calculator.getByRole('button', { name: 'Скопировать' })
    ).toBeEnabled()

    await calculator
      .getByRole('button', { name: 'Закрыть калькулятор' })
      .click()
    await expect(calculator).toBeHidden()
  })
})
