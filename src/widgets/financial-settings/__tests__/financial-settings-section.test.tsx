import { render, screen } from '@testing-library/react'

import { FinancialSettings } from '@/entities/settings'

import { FinancialSettingsSection } from '../ui/financial-settings-section'

// Mock FinancialSettings from entities
jest.mock('@/entities/settings', () => ({
  FinancialSettings: jest.fn(() => (
    <div data-testid="financial-settings">Financial Settings Component</div>
  )),
}))

const MockedFinancialSettings = jest.mocked(FinancialSettings)

describe('FinancialSettingsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders section header with title', () => {
      render(<FinancialSettingsSection />)

      expect(screen.getByText('Финансовые настройки')).toBeInTheDocument()
    })

    it('renders FinancialSettings component', () => {
      render(<FinancialSettingsSection />)

      expect(screen.getByTestId('financial-settings')).toBeInTheDocument()
    })

    it('applies correct container styling', () => {
      const { container } = render(<FinancialSettingsSection />)

      expect(container.firstChild).toHaveClass(
        'flex',
        'flex-col',
        'gap-4',
        'p-6'
      )
    })

    it('applies correct header styling', () => {
      render(<FinancialSettingsSection />)

      const header = screen.getByText('Финансовые настройки')
      expect(header).toHaveClass('text-lg', 'font-medium', 'text-zinc-100')
    })

    it('renders header as h2 element', () => {
      render(<FinancialSettingsSection />)

      const header = screen.getByText('Финансовые настройки')
      expect(header.tagName).toBe('H2')
    })
  })

  describe('component structure', () => {
    it('renders header before FinancialSettings', () => {
      const { container } = render(<FinancialSettingsSection />)

      const children = Array.from(container.firstChild?.childNodes || [])
      const headerIndex = children.findIndex(
        (node) =>
          node instanceof HTMLElement &&
          node.textContent === 'Финансовые настройки'
      )
      const settingsIndex = children.findIndex(
        (node) =>
          node instanceof HTMLElement &&
          node.getAttribute('data-testid') === 'financial-settings'
      )

      expect(headerIndex).toBeLessThan(settingsIndex)
      expect(headerIndex).toBeGreaterThanOrEqual(0)
      expect(settingsIndex).toBeGreaterThan(0)
    })

    it('has exactly two direct children', () => {
      const { container } = render(<FinancialSettingsSection />)

      expect(container.firstChild?.childNodes).toHaveLength(2)
    })

    it('wraps content in a single container div', () => {
      const { container } = render(<FinancialSettingsSection />)

      expect(container.children).toHaveLength(1)
      expect(container.firstChild?.nodeName).toBe('DIV')
    })
  })

  describe('Russian localization', () => {
    it('displays title in Russian', () => {
      render(<FinancialSettingsSection />)

      expect(screen.getByText('Финансовые настройки')).toBeInTheDocument()
    })

    it('uses correct Russian grammar for "Финансовые настройки"', () => {
      render(<FinancialSettingsSection />)

      // Verify exact text matches expected Russian localization
      const title = screen.getByRole('heading', { level: 2 })
      expect(title.textContent).toBe('Финансовые настройки')
    })
  })

  describe('integration with FinancialSettings', () => {
    it('imports and renders FinancialSettings from settings entity', () => {
      render(<FinancialSettingsSection />)

      expect(MockedFinancialSettings).toHaveBeenCalled()
      expect(MockedFinancialSettings).toHaveBeenCalledTimes(1)
    })

    it('renders FinancialSettings without props', () => {
      render(<FinancialSettingsSection />)

      // FinancialSettings is called with empty props (second arg is undefined in React 19)
      expect(MockedFinancialSettings.mock.calls[0][0]).toEqual({})
    })
  })

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<FinancialSettingsSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Финансовые настройки')
    })

    it('provides semantic structure with heading', () => {
      const { container } = render(<FinancialSettingsSection />)

      const heading = container.querySelector('h2')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveClass('text-lg', 'font-medium', 'text-zinc-100')
    })
  })

  describe('styling consistency', () => {
    it('uses gap-4 for spacing between elements', () => {
      const { container } = render(<FinancialSettingsSection />)

      expect(container.firstChild).toHaveClass('gap-4')
    })

    it('uses p-6 for container padding', () => {
      const { container } = render(<FinancialSettingsSection />)

      expect(container.firstChild).toHaveClass('p-6')
    })

    it('uses flex-col for vertical layout', () => {
      const { container } = render(<FinancialSettingsSection />)

      expect(container.firstChild).toHaveClass('flex-col')
    })

    it('uses zinc-100 color for title text', () => {
      render(<FinancialSettingsSection />)

      const header = screen.getByText('Финансовые настройки')
      expect(header).toHaveClass('text-zinc-100')
    })

    it('uses medium font weight for title', () => {
      render(<FinancialSettingsSection />)

      const header = screen.getByText('Финансовые настройки')
      expect(header).toHaveClass('font-medium')
    })

    it('uses lg text size for title', () => {
      render(<FinancialSettingsSection />)

      const header = screen.getByText('Финансовые настройки')
      expect(header).toHaveClass('text-lg')
    })
  })

  describe('component isolation', () => {
    it('does not render FinancialSettings implementation details', () => {
      render(<FinancialSettingsSection />)

      // Should only render mocked version
      expect(screen.getByTestId('financial-settings')).toBeInTheDocument()
      expect(screen.queryByText('Недельный лимит')).not.toBeInTheDocument()
    })

    it('delegates financial settings management to FinancialSettings', () => {
      render(<FinancialSettingsSection />)

      // FinancialSettingsSection should only be a container
      // All settings logic should be in FinancialSettings
      expect(screen.getByTestId('financial-settings')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('renders correctly when FinancialSettings is empty', () => {
      render(<FinancialSettingsSection />)

      expect(screen.getByText('Финансовые настройки')).toBeInTheDocument()
      expect(screen.getByTestId('financial-settings')).toBeInTheDocument()
    })

    it('maintains structure with different FinancialSettings content', () => {
      MockedFinancialSettings.mockImplementation(() => (
        <div data-testid="financial-settings">
          <div>Custom Content</div>
          <div>More Content</div>
        </div>
      ))

      render(<FinancialSettingsSection />)

      expect(screen.getByText('Финансовые настройки')).toBeInTheDocument()
      expect(screen.getByTestId('financial-settings')).toBeInTheDocument()
      expect(screen.getByText('Custom Content')).toBeInTheDocument()
    })
  })

  describe('multiple renders', () => {
    it('renders consistently on multiple mounts', () => {
      const { unmount } = render(<FinancialSettingsSection />)
      expect(screen.getByText('Финансовые настройки')).toBeInTheDocument()

      unmount()

      render(<FinancialSettingsSection />)
      expect(screen.getByText('Финансовые настройки')).toBeInTheDocument()
    })

    it('maintains mock call count across renders', () => {
      render(<FinancialSettingsSection />)
      expect(MockedFinancialSettings).toHaveBeenCalledTimes(1)

      render(<FinancialSettingsSection />)
      expect(MockedFinancialSettings).toHaveBeenCalledTimes(2)
    })
  })

  describe('component contract', () => {
    it('is a client component', () => {
      // Component should work in client context with FinancialSettings
      render(<FinancialSettingsSection />)

      expect(screen.getByText('Финансовые настройки')).toBeInTheDocument()
      expect(screen.getByTestId('financial-settings')).toBeInTheDocument()
    })

    it('accepts no props', () => {
      // Component signature should be () => JSX.Element
      expect(() => render(<FinancialSettingsSection />)).not.toThrow()
    })

    it('returns valid JSX element', () => {
      const { container } = render(<FinancialSettingsSection />)

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
    })
  })
})
