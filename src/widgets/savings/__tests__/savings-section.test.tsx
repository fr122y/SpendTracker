import { render, screen } from '@testing-library/react'

import { SavingsSection } from '../ui/savings-section'

// Mock BucketEditor component
jest.mock('@/features/manage-buckets', () => ({
  BucketEditor: jest.fn(() => (
    <div data-testid="bucket-editor">Bucket Editor Component</div>
  )),
}))

describe('SavingsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders section header with title', () => {
      render(<SavingsSection />)

      expect(screen.getByText('Распределение дохода')).toBeInTheDocument()
    })

    it('renders BucketEditor component', () => {
      render(<SavingsSection />)

      expect(screen.getByTestId('bucket-editor')).toBeInTheDocument()
    })

    it('applies correct container styling', () => {
      const { container } = render(<SavingsSection />)

      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'gap-4', 'p-6')
    })

    it('applies correct header styling', () => {
      render(<SavingsSection />)

      const header = screen.getByText('Распределение дохода')
      expect(header).toHaveClass('text-lg', 'font-medium', 'text-zinc-100')
    })

    it('renders header as h2 element', () => {
      render(<SavingsSection />)

      const header = screen.getByText('Распределение дохода')
      expect(header.tagName).toBe('H2')
    })
  })

  describe('component structure', () => {
    it('renders header before BucketEditor', () => {
      const { container } = render(<SavingsSection />)

      const children = Array.from(container.firstChild?.childNodes || [])
      const headerIndex = children.findIndex(
        (node) =>
          node instanceof HTMLElement &&
          node.textContent === 'Распределение дохода'
      )
      const editorIndex = children.findIndex(
        (node) =>
          node instanceof HTMLElement &&
          node.getAttribute('data-testid') === 'bucket-editor'
      )

      expect(headerIndex).toBeLessThan(editorIndex)
      expect(headerIndex).toBeGreaterThanOrEqual(0)
      expect(editorIndex).toBeGreaterThan(0)
    })

    it('has exactly two direct children', () => {
      const { container } = render(<SavingsSection />)

      expect(container.firstChild?.childNodes).toHaveLength(2)
    })

    it('wraps content in a single container div', () => {
      const { container } = render(<SavingsSection />)

      expect(container.children).toHaveLength(1)
      expect(container.firstChild?.nodeName).toBe('DIV')
    })
  })

  describe('Russian localization', () => {
    it('displays title in Russian', () => {
      render(<SavingsSection />)

      expect(screen.getByText('Распределение дохода')).toBeInTheDocument()
    })

    it('uses correct Russian grammar for "Распределение дохода"', () => {
      render(<SavingsSection />)

      // Verify exact text matches expected Russian localization
      const title = screen.getByRole('heading', { level: 2 })
      expect(title.textContent).toBe('Распределение дохода')
    })
  })

  describe('integration with BucketEditor', () => {
    it('imports and renders BucketEditor from manage-buckets feature', () => {
      const { BucketEditor } = require('@/features/manage-buckets')

      render(<SavingsSection />)

      expect(BucketEditor).toHaveBeenCalled()
      expect(BucketEditor).toHaveBeenCalledTimes(1)
    })

    it('renders BucketEditor without props', () => {
      const { BucketEditor } = require('@/features/manage-buckets')

      render(<SavingsSection />)

      // BucketEditor is called with empty props and optional second arg
      expect(BucketEditor).toHaveBeenCalledWith({}, expect.anything())
    })
  })

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<SavingsSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Распределение дохода')
    })

    it('provides semantic structure with heading', () => {
      const { container } = render(<SavingsSection />)

      const heading = container.querySelector('h2')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveClass('text-lg', 'font-medium', 'text-zinc-100')
    })
  })

  describe('styling consistency', () => {
    it('uses gap-4 for spacing between elements', () => {
      const { container } = render(<SavingsSection />)

      expect(container.firstChild).toHaveClass('gap-4')
    })

    it('uses p-6 for container padding', () => {
      const { container } = render(<SavingsSection />)

      expect(container.firstChild).toHaveClass('p-6')
    })

    it('uses flex-col for vertical layout', () => {
      const { container } = render(<SavingsSection />)

      expect(container.firstChild).toHaveClass('flex-col')
    })

    it('uses zinc-100 color for title text', () => {
      render(<SavingsSection />)

      const header = screen.getByText('Распределение дохода')
      expect(header).toHaveClass('text-zinc-100')
    })

    it('uses medium font weight for title', () => {
      render(<SavingsSection />)

      const header = screen.getByText('Распределение дохода')
      expect(header).toHaveClass('font-medium')
    })

    it('uses lg text size for title', () => {
      render(<SavingsSection />)

      const header = screen.getByText('Распределение дохода')
      expect(header).toHaveClass('text-lg')
    })
  })

  describe('component isolation', () => {
    it('does not render BucketEditor implementation details', () => {
      render(<SavingsSection />)

      // Should only render mocked version
      expect(screen.getByTestId('bucket-editor')).toBeInTheDocument()
      expect(screen.queryByText('Добавить категорию')).not.toBeInTheDocument()
    })

    it('delegates bucket management to BucketEditor', () => {
      render(<SavingsSection />)

      // SavingsSection should only be a container
      // All bucket logic should be in BucketEditor
      expect(screen.getByTestId('bucket-editor')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('renders correctly when BucketEditor is empty', () => {
      render(<SavingsSection />)

      expect(screen.getByText('Распределение дохода')).toBeInTheDocument()
      expect(screen.getByTestId('bucket-editor')).toBeInTheDocument()
    })

    it('maintains structure with different BucketEditor content', () => {
      const { BucketEditor } = require('@/features/manage-buckets')
      BucketEditor.mockImplementation(() => (
        <div data-testid="bucket-editor">
          <div>Custom Content</div>
          <div>More Content</div>
        </div>
      ))

      render(<SavingsSection />)

      expect(screen.getByText('Распределение дохода')).toBeInTheDocument()
      expect(screen.getByTestId('bucket-editor')).toBeInTheDocument()
      expect(screen.getByText('Custom Content')).toBeInTheDocument()
    })
  })

  describe('multiple renders', () => {
    it('renders consistently on multiple mounts', () => {
      const { unmount } = render(<SavingsSection />)
      expect(screen.getByText('Распределение дохода')).toBeInTheDocument()

      unmount()

      render(<SavingsSection />)
      expect(screen.getByText('Распределение дохода')).toBeInTheDocument()
    })

    it('maintains mock call count across renders', () => {
      const { BucketEditor } = require('@/features/manage-buckets')

      render(<SavingsSection />)
      expect(BucketEditor).toHaveBeenCalledTimes(1)

      render(<SavingsSection />)
      expect(BucketEditor).toHaveBeenCalledTimes(2)
    })
  })

  describe('component contract', () => {
    it('is a client component', () => {
      // Component should work in client context with BucketEditor
      render(<SavingsSection />)

      expect(screen.getByText('Распределение дохода')).toBeInTheDocument()
      expect(screen.getByTestId('bucket-editor')).toBeInTheDocument()
    })

    it('accepts no props', () => {
      // Component signature should be () => JSX.Element
      expect(() => render(<SavingsSection />)).not.toThrow()
    })

    it('returns valid JSX element', () => {
      const { container } = render(<SavingsSection />)

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
    })
  })
})
