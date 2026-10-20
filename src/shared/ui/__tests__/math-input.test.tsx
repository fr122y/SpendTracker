import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MathInput } from '../math-input'

describe('MathInput', () => {
  const mockOnValueChange = jest.fn()

  beforeEach(() => {
    mockOnValueChange.mockClear()
  })

  describe('Rendering', () => {
    it('renders with initial value', () => {
      render(<MathInput value="100" onValueChange={mockOnValueChange} />)
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    })

    it('renders as text input with decimal inputMode', () => {
      render(<MathInput value="0" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
      expect(input).toHaveAttribute('inputMode', 'decimal')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLInputElement | null }
      render(
        <MathInput ref={ref} value="0" onValueChange={mockOnValueChange} />
      )
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('passes additional props to underlying Input', () => {
      render(
        <MathInput
          value="0"
          onValueChange={mockOnValueChange}
          placeholder="Enter amount"
          disabled
        />
      )
      const input = screen.getByPlaceholderText('Enter amount')
      expect(input).toBeDisabled()
    })
  })

  describe('Value changes during typing', () => {
    it('calls onValueChange with null evaluation while typing', () => {
      render(<MathInput value="" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.change(input, { target: { value: '100' } })

      expect(mockOnValueChange).toHaveBeenCalledWith('100', null)
    })

    it('calls onValueChange with null evaluation when typing expression', () => {
      render(<MathInput value="100" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.change(input, { target: { value: '100+' } })

      expect(mockOnValueChange).toHaveBeenCalledWith('100+', null)
    })
  })

  describe('Expression evaluation on blur', () => {
    it('evaluates simple addition on blur', () => {
      render(<MathInput value="100+50" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('150', 150)
    })

    it('evaluates simple subtraction on blur', () => {
      render(<MathInput value="1000-200" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('800', 800)
    })

    it('evaluates multiplication on blur', () => {
      render(<MathInput value="50*2" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('100', 100)
    })

    it('evaluates division on blur', () => {
      render(<MathInput value="100/4" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('25', 25)
    })

    it('evaluates complex expression with parentheses', () => {
      render(<MathInput value="(100+50)*2" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('300', 300)
    })

    it('evaluates expression with decimals', () => {
      render(<MathInput value="10.5+0.5" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('11', 11)
    })

    it('evaluates expression with comma as decimal separator', () => {
      render(<MathInput value="10,5+0,5" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('11', 11)
    })

    it('parses plain number without operators', () => {
      render(<MathInput value="500" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('500', 500)
    })

    it('parses decimal number without operators', () => {
      render(<MathInput value="123.45" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('123,45', 123.45)
    })

    it('normalizes plain decimal number to meaningful decimal places', () => {
      render(<MathInput value="123.40" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('123,40', 123.4)
    })

    it('rounds plain decimal number to two decimal places', () => {
      render(<MathInput value="123.456" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('123,46', 123.46)
    })
  })

  describe('Precision normalization', () => {
    it('removes floating point tails from simple addition', () => {
      render(<MathInput value="0.1+0.2" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('0,30', 0.3)
    })

    it('rounds evaluated fractional results to two decimal places', () => {
      render(<MathInput value="100/3" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('33,33', 33.33)
    })

    it('displays whole-number results without decimal separator', () => {
      render(<MathInput value="10.5+0.5" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('11', 11)
    })

    it('normalizes negative zero to zero', () => {
      render(
        <MathInput value="-0.004" onValueChange={mockOnValueChange} allowZero />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('0', 0)
    })
  })

  describe('Expression evaluation on Enter key', () => {
    it('evaluates expression and blurs input on Enter outside a form', async () => {
      const user = userEvent.setup()
      render(<MathInput value="100+50" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      await user.click(input)
      await user.keyboard('{Enter}')

      expect(mockOnValueChange).toHaveBeenCalledWith('150', 150)
      expect(input).not.toHaveFocus()
    })

    it('does not prevent other key presses', async () => {
      const user = userEvent.setup()
      const mockKeyDown = jest.fn()
      render(
        <MathInput
          value="100"
          onValueChange={mockOnValueChange}
          onKeyDown={mockKeyDown}
        />
      )
      const input = screen.getByRole('textbox')

      await user.click(input)
      await user.keyboard('a')

      expect(mockKeyDown).toHaveBeenCalled()
    })
  })

  describe('Range validation', () => {
    it('rejects a result below zero with an inline error', () => {
      render(<MathInput value="10-20" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Сумма должна быть больше 0'
      )
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('rejects a result above a custom maximum', () => {
      render(
        <MathInput
          value="500+600"
          onValueChange={mockOnValueChange}
          max={1000}
        />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent('Не больше 1 000 ₽')
    })

    it('rejects a negative plain number even when zero is allowed', () => {
      render(
        <MathInput value="-5" onValueChange={mockOnValueChange} allowZero />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Сумма не может быть отрицательной'
      )
    })

    it('rejects an amount above 100 000 000 by default', () => {
      render(
        <MathInput value="100000000.01" onValueChange={mockOnValueChange} />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Не больше 100 000 000 ₽'
      )
    })

    it('accepts a value within bounds', () => {
      render(
        <MathInput value="50+50" onValueChange={mockOnValueChange} max={200} />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('100', 100)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('does not call onValueChange for invalid expression', () => {
      render(<MathInput value="abc" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      // Should not call onValueChange when expression is invalid
      expect(mockOnValueChange).not.toHaveBeenCalled()
    })

    it('does not call onValueChange for malformed expression', () => {
      render(<MathInput value="100++" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
    })

    it('does not call onValueChange for incomplete expression', () => {
      render(<MathInput value="100+" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
    })

    it('does not call onValueChange for unmatched parentheses', () => {
      render(<MathInput value="(100+50" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
    })

    it('handles division by zero gracefully', () => {
      render(<MathInput value="100/0" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      // Division by zero returns Infinity, which is not finite
      expect(mockOnValueChange).not.toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('does not evaluate empty input', () => {
      render(<MathInput value="" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
    })

    it('accepts zero when allowed', () => {
      render(
        <MathInput value="0" onValueChange={mockOnValueChange} allowZero />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('0', 0)
    })

    it('rejects an expression resulting in zero by default', () => {
      render(<MathInput value="100-100" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Сумма должна быть больше 0'
      )
    })

    it('rejects a negative result', () => {
      render(<MathInput value="50-100" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Сумма должна быть больше 0'
      )
    })

    it('respects order of operations', () => {
      render(<MathInput value="2+3*4" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      // Should be 14 (3*4 first, then +2), not 20 ((2+3)*4)
      expect(mockOnValueChange).toHaveBeenCalledWith('14', 14)
    })
  })

  describe('Callback integration', () => {
    it('calls custom onBlur handler after evaluation', () => {
      const mockOnBlur = jest.fn()
      render(
        <MathInput
          value="100+50"
          onValueChange={mockOnValueChange}
          onBlur={mockOnBlur}
        />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('150', 150)
      expect(mockOnBlur).toHaveBeenCalled()
    })

    it('calls custom onKeyDown handler after Enter evaluation', async () => {
      const user = userEvent.setup()
      const mockOnKeyDown = jest.fn()
      render(
        <MathInput
          value="100+50"
          onValueChange={mockOnValueChange}
          onKeyDown={mockOnKeyDown}
        />
      )
      const input = screen.getByRole('textbox')

      await user.click(input)
      await user.keyboard('{Enter}')

      expect(mockOnValueChange).toHaveBeenCalledWith('150', 150)
      expect(mockOnKeyDown).toHaveBeenCalled()
    })
  })

  describe('Input format', () => {
    it.each([
      ['1 500', '1500', 1500],
      ['1\u00a0500,50', '1500,50', 1500.5],
      [' 42 ', '42', 42],
      ['12.345', '12,35', 12.35],
    ])('accepts %j', (value, display, evaluated) => {
      render(<MathInput value={value} onValueChange={mockOnValueChange} />)

      fireEvent.blur(screen.getByRole('textbox'))

      expect(mockOnValueChange).toHaveBeenCalledWith(display, evaluated)
    })

    it.each(['15 руб', '1e5', '1.2.3', '500+50abc'])(
      'rejects %j without a partial parse',
      (value) => {
        render(<MathInput value={value} onValueChange={mockOnValueChange} />)

        fireEvent.blur(screen.getByRole('textbox'))

        expect(mockOnValueChange).not.toHaveBeenCalled()
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Введите сумму числом, напр. 1500 или 500+50'
        )
      }
    )

    it('hides the error while the user edits the value', () => {
      render(<MathInput value="15 руб" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)
      expect(screen.getByRole('alert')).toBeInTheDocument()

      fireEvent.change(input, { target: { value: '15' } })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Enter inside a form', () => {
    it('evaluates and submits the form, keeping focus', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn((event: React.FormEvent) =>
        event.preventDefault()
      )
      render(
        <form onSubmit={onSubmit}>
          <MathInput value="500+50" onValueChange={mockOnValueChange} />
        </form>
      )
      const input = screen.getByRole('textbox')

      await user.click(input)
      await user.keyboard('{Enter}')

      expect(mockOnValueChange).toHaveBeenCalledWith('550', 550)
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(input).toHaveFocus()
    })

    it('does not submit an invalid amount and shows the error', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn((event: React.FormEvent) =>
        event.preventDefault()
      )
      render(
        <form onSubmit={onSubmit}>
          <MathInput value="-100" onValueChange={mockOnValueChange} />
        </form>
      )
      const input = screen.getByRole('textbox')

      await user.click(input)
      await user.keyboard('{Enter}')

      expect(onSubmit).not.toHaveBeenCalled()
      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Сумма должна быть больше 0'
      )
      expect(input).toHaveFocus()
    })
  })
})
