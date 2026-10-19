import { getFallbackCategoryColor } from '@/shared/lib/category-color'

import {
  getCategoryTileColor,
  getCategoryTileScopeLabel,
} from '../lib/category-tile-color'

const personalStat = {
  name: 'Продукты',
  personalValue: 100,
  sharedValue: 0,
  projectValue: 0,
}
const sharedStat = { ...personalStat, personalValue: 0, sharedValue: 100 }

describe('getCategoryTileColor', () => {
  it('uses the personal category color for personal spending', () => {
    expect(
      getCategoryTileColor(
        personalStat,
        [{ name: 'Продукты', color: '#be185d' }],
        [{ name: 'Продукты', color: '#0369a1' }]
      )
    ).toBe('#be185d')
  })

  it('uses the shared category color for shared-only spending', () => {
    expect(
      getCategoryTileColor(
        sharedStat,
        [{ name: 'Продукты', color: '#be185d' }],
        [{ name: 'Продукты', color: '#0369a1' }]
      )
    ).toBe('#0369a1')
  })

  it('falls back to the palette color by name without a stored color', () => {
    expect(
      getCategoryTileColor(
        personalStat,
        [{ name: 'Продукты', color: null }],
        []
      )
    ).toBe(getFallbackCategoryColor('Продукты'))
    expect(getCategoryTileColor(personalStat, [], [])).toBe(
      getFallbackCategoryColor('Продукты')
    )
  })
})

describe('getCategoryTileScopeLabel', () => {
  it('lists the scopes present on the tile', () => {
    expect(getCategoryTileScopeLabel(personalStat)).toBe('Личные')
    expect(getCategoryTileScopeLabel(sharedStat)).toBe('Общие')
    expect(
      getCategoryTileScopeLabel({
        personalValue: 1,
        sharedValue: 1,
        projectValue: 1,
      })
    ).toBe('Личные · Общие · Проекты')
  })
})
