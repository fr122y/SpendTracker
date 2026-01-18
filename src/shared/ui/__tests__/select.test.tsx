import { fireEvent, render, screen } from '@testing-library/react'

import { Select } from '../select'

describe('Select', () => {
  const options = [
    { value: 'food', label: 'Еда' },
    { value: 'transport', label: 'Транспорт' },
    { value: 'entertainment', label: 'Развлечения' },
  ]

  it('renders with options', () => {
    render(<Select options={options} />)

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Еда')).toBeInTheDocument()
    expect(screen.getByText('Транспорт')).toBeInTheDocument()
    expect(screen.getByText('Развлечения')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Select label="Категория" options={options} />)

    expect(screen.getByText('Категория')).toBeInTheDocument()
    expect(screen.getByLabelText('Категория')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    render(<Select options={options} placeholder="Выберите категорию" />)

    expect(screen.getByText('Выберите категорию')).toBeInTheDocument()
  })

  it('renders with error state', () => {
    render(<Select options={options} error="Поле обязательно" />)

    expect(screen.getByText('Поле обязательно')).toBeInTheDocument()
  })

  it('handles value change', () => {
    const onChange = jest.fn()

    render(<Select options={options} onChange={onChange} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'transport' } })

    expect(onChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Select options={options} disabled />)

    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Select ref={ref} options={options} />)

    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })

  it('applies custom className', () => {
    render(<Select options={options} className="custom-class" />)

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('custom-class')
  })
})
