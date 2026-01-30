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

      expect(mockOnValueChange).toHaveBeenCalledWith('123.45', 123.45)
    })
  })

  describe('Expression evaluation on Enter key', () => {
    it('evaluates expression and blurs input on Enter', async () => {
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

  describe('Min/Max clamping', () => {
    it('clamps value to min when result is below minimum', () => {
      render(
        <MathInput value="10-20" onValueChange={mockOnValueChange} min={0} />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('0', 0)
    })

    it('clamps value to max when result exceeds maximum', () => {
      render(
        <MathInput
          value="500+600"
          onValueChange={mockOnValueChange}
          max={1000}
        />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('1000', 1000)
    })

    it('clamps plain number to min', () => {
      render(<MathInput value="-5" onValueChange={mockOnValueChange} min={0} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('0', 0)
    })

    it('clamps plain number to max', () => {
      render(
        <MathInput value="150" onValueChange={mockOnValueChange} max={100} />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('100', 100)
    })

    it('does not clamp when value is within bounds', () => {
      render(
        <MathInput
          value="50+50"
          onValueChange={mockOnValueChange}
          min={0}
          max={200}
        />
      )
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('100', 100)
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

    it('handles zero value', () => {
      render(<MathInput value="0" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('0', 0)
    })

    it('handles expression resulting in zero', () => {
      render(<MathInput value="100-100" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('0', 0)
    })

    it('handles negative result', () => {
      render(<MathInput value="50-100" onValueChange={mockOnValueChange} />)
      const input = screen.getByRole('textbox')

      fireEvent.blur(input)

      expect(mockOnValueChange).toHaveBeenCalledWith('-50', -50)
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
})
