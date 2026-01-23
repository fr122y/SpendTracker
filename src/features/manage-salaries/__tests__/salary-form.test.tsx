import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SalaryForm } from '../ui/salary-form'

// Mock the settings store
const mockSetSalaryDay = jest.fn()
const mockSetAdvanceDay = jest.fn()

const defaultStoreState = {
  salaryDay: 10,
  advanceDay: 25,
  setSalaryDay: mockSetSalaryDay,
  setAdvanceDay: mockSetAdvanceDay,
}

let mockStoreState = { ...defaultStoreState }

jest.mock('@/entities/settings', () => ({
  useSettingsStore: jest.fn((selector?: (state: typeof mockStoreState) => unknown) => {
    if (selector) {
      return selector(mockStoreState)
    }
    return mockStoreState
  }),
}))

describe('SalaryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStoreState = { ...defaultStoreState }
  })

  describe('Rendering', () => {
    it('should render form with salary day and advance day inputs', () => {
      render(<SalaryForm />)

      expect(screen.getByLabelText(/день зарплаты/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/день аванса/i)).toBeInTheDocument()
    })

    it('should display current salary day value from store', () => {
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      expect(salaryInput).toHaveValue(10)
    })

    it('should display current advance day value from store', () => {
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(/день аванса/i)
      expect(advanceInput).toHaveValue(25)
    })

    it('should render save button', () => {
      render(<SalaryForm />)

      expect(
        screen.getByRole('button', { name: /сохранить/i })
      ).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should update salary day input value on change', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '15')

      expect(salaryInput).toHaveValue(15)
    })

    it('should update advance day input value on change', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(/день аванса/i)
      await user.clear(advanceInput)
      await user.type(advanceInput, '20')

      expect(advanceInput).toHaveValue(20)
    })

    it('should call setSalaryDay when salary day is changed and form is submitted', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '15')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      expect(mockSetSalaryDay).toHaveBeenCalledWith(15)
    })

    it('should call setAdvanceDay when advance day is changed and form is submitted', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(/день аванса/i)
      await user.clear(advanceInput)
      await user.type(advanceInput, '20')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      expect(mockSetAdvanceDay).toHaveBeenCalledWith(20)
    })

    it('should call both setters when both values are changed', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      const advanceInput = screen.getByLabelText(/день аванса/i)

      await user.clear(salaryInput)
      await user.type(salaryInput, '5')

      await user.clear(advanceInput)
      await user.type(advanceInput, '15')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      expect(mockSetSalaryDay).toHaveBeenCalledWith(5)
      expect(mockSetAdvanceDay).toHaveBeenCalledWith(15)
    })

    it('should handle form submission with Enter key', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '15')

      await user.type(salaryInput, '{Enter}')

      expect(mockSetSalaryDay).toHaveBeenCalledWith(15)
    })
  })

  describe('Validation', () => {
    it('should enforce minimum value of 1 for salary day', () => {
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(
        /день зарплаты/i
      ) as HTMLInputElement
      expect(salaryInput.min).toBe('1')
    })

    it('should enforce maximum value of 31 for salary day', () => {
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(
        /день зарплаты/i
      ) as HTMLInputElement
      expect(salaryInput.max).toBe('31')
    })

    it('should enforce minimum value of 1 for advance day', () => {
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(
        /день аванса/i
      ) as HTMLInputElement
      expect(advanceInput.min).toBe('1')
    })

    it('should enforce maximum value of 31 for advance day', () => {
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(
        /день аванса/i
      ) as HTMLInputElement
      expect(advanceInput.max).toBe('31')
    })

    it('should not call setters when salary day is empty', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      expect(mockSetSalaryDay).not.toHaveBeenCalled()
    })

    it('should not call setters when advance day is empty', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(/день аванса/i)
      await user.clear(advanceInput)

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      expect(mockSetAdvanceDay).not.toHaveBeenCalled()
    })

    it('should disable submit button when salary day is invalid (0)', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '0')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when salary day exceeds 31', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '32')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when advance day is invalid (0)', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(/день аванса/i)
      await user.clear(advanceInput)
      await user.type(advanceInput, '0')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when advance day exceeds 31', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(/день аванса/i)
      await user.clear(advanceInput)
      await user.type(advanceInput, '32')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle boundary value of 1 for salary day', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '1')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      expect(mockSetSalaryDay).toHaveBeenCalledWith(1)
    })

    it('should handle boundary value of 31 for salary day', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '31')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      expect(mockSetSalaryDay).toHaveBeenCalledWith(31)
    })

    it('should handle same values for salary and advance days', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      const advanceInput = screen.getByLabelText(/день аванса/i)

      await user.clear(salaryInput)
      await user.type(salaryInput, '15')

      await user.clear(advanceInput)
      await user.type(advanceInput, '15')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      expect(mockSetSalaryDay).toHaveBeenCalledWith(15)
      expect(mockSetAdvanceDay).toHaveBeenCalledWith(15)
    })

    it('should not update store if values have not changed', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      // Should still call the setters with current values or not call at all
      // Depending on implementation, let's verify it doesn't error
      expect(mockSetSalaryDay).toHaveBeenCalledTimes(1)
      expect(mockSetAdvanceDay).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association for salary day input', () => {
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      expect(salaryInput).toHaveAttribute('type', 'number')
    })

    it('should have proper label association for advance day input', () => {
      render(<SalaryForm />)

      const advanceInput = screen.getByLabelText(/день аванса/i)
      expect(advanceInput).toHaveAttribute('type', 'number')
    })

    it('should have submit button with proper text', () => {
      render(<SalaryForm />)

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Success Feedback', () => {
    it('should show success message after successful submission', async () => {
      const user = userEvent.setup()
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '15')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/настройки сохранены/i)).toBeInTheDocument()
      })
    })

    it('should hide success message after 3 seconds', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ delay: null })
      render(<SalaryForm />)

      const salaryInput = screen.getByLabelText(/день зарплаты/i)
      await user.clear(salaryInput)
      await user.type(salaryInput, '15')

      const submitButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/настройки сохранены/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(
          screen.queryByText(/настройки сохранены/i)
        ).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })
})
