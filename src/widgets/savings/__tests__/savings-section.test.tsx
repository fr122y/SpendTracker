import { render, screen } from '@testing-library/react'

import { SavingsSection } from '../ui/savings-section'

// Mock BucketEditor component
jest.mock('@/features/manage-buckets', () => ({
  BucketEditor: jest.fn(() => (
    <div data-testid="bucket-editor">Bucket Editor Component</div>
  )),
}))

describe('SavingsSection', () => {
  it('renders without crashing', () => {
    render(<SavingsSection />)

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders heading with correct text', () => {
    render(<SavingsSection />)

    expect(screen.getByText('Распределение дохода')).toBeInTheDocument()
  })

  it('renders BucketEditor child component', () => {
    render(<SavingsSection />)

    expect(screen.getByTestId('bucket-editor')).toBeInTheDocument()
  })
})
