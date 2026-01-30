import { render, screen } from '@testing-library/react'

import { FinancialSettingsSection } from '../ui/financial-settings-section'

// Mock FinancialSettings from entities
jest.mock('@/entities/settings', () => ({
  FinancialSettings: jest.fn(() => (
    <div data-testid="financial-settings">Financial Settings Component</div>
  )),
}))

describe('FinancialSettingsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<FinancialSettingsSection />)

    expect(screen.getByText('Финансовые настройки')).toBeInTheDocument()
  })

  it('renders section header with title', () => {
    render(<FinancialSettingsSection />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Финансовые настройки')
  })

  it('renders FinancialSettings component', () => {
    render(<FinancialSettingsSection />)

    expect(screen.getByTestId('financial-settings')).toBeInTheDocument()
  })
})
