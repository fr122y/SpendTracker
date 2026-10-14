import { abbreviateLabel, abbreviateWord } from '../abbreviate'

describe('abbreviateLabel (owner-approved table)', () => {
  it.each([
    ['Квартира', 'Кв.'],
    ['Подушка', 'Под.'],
    ['Инвестиции', 'Инв.'],
    ['Накопления', 'Нак.'],
    ['Месячный доход', 'Мес. д.'],
    ['Операции (остаток)', 'Оп.'],
    ['Отпуск на море всей семьёй 2027', 'Отп. 2027'],
  ])('%s → %s', (label, expected) => {
    expect(abbreviateLabel(label)).toBe(expected)
  })
})

describe('abbreviateWord', () => {
  it('never ends on й, ь or ъ and extends to the next consonant', () => {
    expect(abbreviateWord('Майонез')).toBe('Майон.')
    expect(abbreviateWord('Альпинизм')).toBe('Альп.')
  })

  it('keeps a consonant cluster together', () => {
    expect(abbreviateWord('Страховка')).toBe('Стр.')
  })

  it('keeps words of up to four letters', () => {
    expect(abbreviateWord('Дом')).toBe('Дом')
    expect(abbreviateWord('Авто')).toBe('Авто')
  })
})

describe('abbreviateLabel edge cases', () => {
  it('keeps one-letter words as is', () => {
    expect(abbreviateLabel('Я')).toBe('Я')
  })

  it('keeps labels without Cyrillic as is', () => {
    expect(abbreviateLabel('Bitcoin')).toBe('Bitcoin')
    expect(abbreviateLabel('ETF 2027')).toBe('ETF 2027')
  })

  it('keeps emoji and abbreviates the Cyrillic word next to it', () => {
    expect(abbreviateLabel('🏖 Отпуск')).toBe('🏖 Отп.')
  })

  it('returns an empty string for an empty or blank label', () => {
    expect(abbreviateLabel('')).toBe('')
    expect(abbreviateLabel('   ')).toBe('')
  })

  it('falls back to the trimmed label when only service words remain', () => {
    expect(abbreviateLabel('на и')).toBe('на и')
  })
})
