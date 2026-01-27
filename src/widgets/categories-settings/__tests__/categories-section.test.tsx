import { render, screen } from '@testing-library/react'

import { CategoriesSection } from '../ui/categories-section'

// Mock CategoryManager from features
jest.mock('@/features/manage-categories', () => ({
  CategoryManager: jest.fn(() => (
    <div data-testid="category-manager">Category Manager Component</div>
  )),
}))

describe('CategoriesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders header with title', () => {
      render(<CategoriesSection />)

      expect(screen.getByText('Управление категориями')).toBeInTheDocument()
    })

    it('renders CategoryManager component', () => {
      render(<CategoriesSection />)

      expect(screen.getByTestId('category-manager')).toBeInTheDocument()
    })

    it('applies correct container styling', () => {
      const { container } = render(<CategoriesSection />)

      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'gap-3')
    })

    it('applies correct header styling', () => {
      render(<CategoriesSection />)

      const heading = screen.getByText('Управление категориями')
      expect(heading.tagName).toBe('H2')
      expect(heading).toHaveClass('text-base', 'font-medium', 'text-zinc-100')
    })
  })

  describe('component composition', () => {
    it('renders CategoryManager from features', () => {
      render(<CategoriesSection />)

      expect(screen.getByTestId('category-manager')).toBeInTheDocument()
      expect(screen.getByText('Category Manager Component')).toBeInTheDocument()
    })
  })

  describe('layout structure', () => {
    it('renders header before CategoryManager', () => {
      const { container } = render(<CategoriesSection />)

      const heading = screen.getByText('Управление категориями')
      const manager = screen.getByTestId('category-manager')

      // Check that heading comes before manager in the DOM
      const children = Array.from(container.firstChild!.childNodes)
      const headingIndex = children.indexOf(heading)
      const managerIndex = children.indexOf(manager)

      expect(headingIndex).toBeLessThan(managerIndex)
    })

    it('uses flex column layout', () => {
      const { container } = render(<CategoriesSection />)

      expect(container.firstChild).toHaveClass('flex-col')
    })

    it('applies responsive gap between elements', () => {
      const { container } = render(<CategoriesSection />)

      expect(container.firstChild).toHaveClass('gap-3')
    })
  })

  describe('Russian localization', () => {
    it('displays header in Russian', () => {
      render(<CategoriesSection />)

      expect(screen.getByText('Управление категориями')).toBeInTheDocument()
    })

    it('uses correct Russian grammar for category management', () => {
      render(<CategoriesSection />)

      // "Управление категориями" is the correct instrumental case in Russian
      const heading = screen.getByText('Управление категориями')
      expect(heading).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('uses semantic heading element', () => {
      render(<CategoriesSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Управление категориями')
    })

    it('heading has correct level (h2)', () => {
      render(<CategoriesSection />)

      const heading = screen.getByText('Управление категориями')
      expect(heading.tagName).toBe('H2')
    })
  })

  describe('edge cases', () => {
    it('renders without errors', () => {
      expect(() => render(<CategoriesSection />)).not.toThrow()
    })

    it('renders exactly once with same props', () => {
      const { rerender } = render(<CategoriesSection />)

      expect(screen.getByText('Управление категориями')).toBeInTheDocument()

      rerender(<CategoriesSection />)

      expect(screen.getByText('Управление категориями')).toBeInTheDocument()
    })
  })

  describe('component structure', () => {
    it('renders single root element', () => {
      const { container } = render(<CategoriesSection />)

      expect(container.firstChild?.childNodes).toHaveLength(2) // h2 + CategoryManager
    })

    it('has only two child elements', () => {
      const { container } = render(<CategoriesSection />)

      const children = container.firstChild?.childNodes
      expect(children).toHaveLength(2)
    })
  })

  describe('CSS classes', () => {
    it('applies all required container classes', () => {
      const { container } = render(<CategoriesSection />)

      const root = container.firstChild as HTMLElement
      expect(root.className).toContain('flex')
      expect(root.className).toContain('flex-col')
      expect(root.className).toContain('gap-3')
    })

    it('applies all required heading classes', () => {
      render(<CategoriesSection />)

      const heading = screen.getByText('Управление категориями')
      expect(heading.className).toContain('text-base')
      expect(heading.className).toContain('font-medium')
      expect(heading.className).toContain('text-zinc-100')
    })
  })
})
