import { render, screen } from '@testing-library/react'

import { CategoriesSection } from '../ui/categories-section'

// Mock CategoryManager from features
jest.mock('@/features/manage-categories', () => ({
  CategoryManager: jest.fn(() => (
    <div data-testid="category-manager">Category Manager Component</div>
  )),
}))

describe('CategoriesSection', () => {
  it('renders without crashing', () => {
    expect(() => render(<CategoriesSection />)).not.toThrow()
  })

  it('displays heading text "Управление категориями"', () => {
    render(<CategoriesSection />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Управление категориями'
    )
  })

  it('renders CategoryManager component', () => {
    render(<CategoriesSection />)

    expect(screen.getByTestId('category-manager')).toBeInTheDocument()
  })
})
