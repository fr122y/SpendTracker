import { render, screen } from '@testing-library/react'

import { FinancialSettings } from '../ui/financial-settings'

let mockIsLoading = false

jest.mock('../model/queries', () => ({
  useSettingsStore: () => ({
    weeklyLimit: 10000,
    salaryDay: 10,
    advanceDay: 25,
    isLoading: mockIsLoading,
    setWeeklyLimit: jest.fn(),
    setSalaryDay: jest.fn(),
    setAdvanceDay: jest.fn(),
  }),
}))

describe('FinancialSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLoading = false
  })

  it('renders skeleton while settings are loading', () => {
    mockIsLoading = true

    render(<FinancialSettings />)

    expect(
      screen.getByTestId('financial-settings-skeleton')
    ).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Недельный лимит (₽)')
    ).not.toBeInTheDocument()
  })

  it('renders form fields when loading is finished', () => {
    render(<FinancialSettings />)

    expect(screen.getByLabelText('Недельный лимит (₽)')).toBeInTheDocument()
    expect(screen.getByLabelText('День зарплаты')).toBeInTheDocument()
    expect(screen.getByLabelText('День аванса')).toBeInTheDocument()
  })
})
