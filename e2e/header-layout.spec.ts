import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * T-050: header controls must not overlap at tablet widths, at 200% zoom
 * (a 1280 px window shows 640 CSS px), and on phones; the next-day arrow must
 * stay clickable.
 */
const WIDTHS = [375, 640, 768, 820, 900] as const

type Box = { x: number; y: number; width: number; height: number }

function intersects(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  )
}

async function headerControls(page: Page): Promise<Locator[]> {
  const header = page.getByRole('banner')
  const candidates = [
    header.getByRole('heading', { name: 'SmartSpend Terminal' }),
    header.getByRole('button', { name: 'Предыдущий день' }),
    header.getByRole('button', { name: 'Выбрать месяц' }),
    header.getByRole('button', { name: 'Следующий день' }),
    header.getByRole('button', { name: 'Сегодня' }),
    header.getByRole('link', { name: 'Аккаунт' }),
    header.getByRole('button', { name: /^(Редактировать|Готово)$/ }),
  ]
  const visible: Locator[] = []
  for (const control of candidates) {
    if ((await control.count()) > 0 && (await control.isVisible())) {
      visible.push(control)
    }
  }
  return visible
}

async function expectNoOverlap(page: Page): Promise<void> {
  const controls = await headerControls(page)
  const boxes: { name: string; box: Box }[] = []
  for (const control of controls) {
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    boxes.push({ name: control.toString(), box: box! })
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      expect(
        intersects(boxes[i].box, boxes[j].box),
        `${boxes[i].name} overlaps ${boxes[j].name}`
      ).toBe(false)
    }
  }
}

test.describe('Dashboard header layout', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'Widths are set explicitly; one browser is enough'
    )
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
  })

  for (const width of WIDTHS) {
    test(`controls do not overlap and next day works at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      const header = page.getByRole('banner')
      const dateButton = header.getByRole('button', { name: 'Выбрать месяц' })

      await expectNoOverlap(page)

      const before = await dateButton.textContent()
      await header.getByRole('button', { name: 'Следующий день' }).click()
      await expect(dateButton).not.toHaveText(before ?? '')
      await expect(page).not.toHaveURL(/\/account/)

      // «Сегодня» is visible now; the layout must still hold.
      await expect(
        header.getByRole('button', { name: 'Сегодня' })
      ).toBeVisible()
      await expectNoOverlap(page)

      const editButton = header.getByRole('button', {
        name: /^(Редактировать|Готово)$/,
      })
      if (width < 768) {
        await expect(editButton).toBeHidden()
      } else {
        await expect(editButton).toBeVisible()
      }

      await header.getByRole('button', { name: 'Сегодня' }).click()
      await expect(dateButton).toHaveText(before ?? '')
    })
  }

  test('the header stays on one row at tablet widths', async ({ page }) => {
    for (const width of [768, 820, 900]) {
      await page.setViewportSize({ width, height: 900 })
      const header = page.getByRole('banner')
      const brand = await header
        .getByRole('heading', { name: 'SmartSpend Terminal' })
        .boundingBox()
      const date = await header
        .getByRole('button', { name: 'Выбрать месяц' })
        .boundingBox()
      const account = await header
        .getByRole('link', { name: 'Аккаунт' })
        .boundingBox()
      const rowCenter = (box: Box) => box.y + box.height / 2
      expect(Math.abs(rowCenter(brand!) - rowCenter(date!))).toBeLessThan(8)
      expect(Math.abs(rowCenter(account!) - rowCenter(date!))).toBeLessThan(8)
    }
  })

  test('actions do not move when «Сегодня» appears', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 900 })
    const header = page.getByRole('banner')
    const account = header.getByRole('link', { name: 'Аккаунт' })
    const before = await account.boundingBox()

    await header.getByRole('button', { name: 'Следующий день' }).click()
    await expect(header.getByRole('button', { name: 'Сегодня' })).toBeVisible()
    expect(await account.boundingBox()).toEqual(before)

    await header.getByRole('button', { name: 'Сегодня' }).click()
  })
})
