import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockRegisterUser = jest.fn()
const mockSignIn = jest.fn()

jest.mock('@/shared/api', () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
}))

jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

import { RegisterForm } from '@/features/auth/ui/register-form'

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRegisterUser.mockResolvedValue({ success: true })
    mockSignIn.mockResolvedValue({ ok: true })
  })

  it('renders all registration fields', () => {
    render(<RegisterForm />)

    expect(screen.getByPlaceholderText('Имя')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Подтвердите пароль')
    ).toBeInTheDocument()
  })

  it('shows mismatch error and does not call register action', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('Имя'), 'Тест')
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Пароль'), 'password123')
    await user.type(
      screen.getByPlaceholderText('Подтвердите пароль'),
      'password124'
    )
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('Пароли не совпадают')).toBeInTheDocument()
    expect(mockRegisterUser).not.toHaveBeenCalled()
  })

  it('calls registerUser with form payload on valid submit', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('Имя'), 'Тест')
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Пароль'), 'password123')
    await user.type(
      screen.getByPlaceholderText('Подтвердите пароль'),
      'password123'
    )
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith({
        name: 'Тест',
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('shows server-returned error', async () => {
    mockRegisterUser.mockResolvedValueOnce({
      success: false,
      error: 'Пользователь с таким email уже существует',
    })

    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('Имя'), 'Тест')
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Пароль'), 'password123')
    await user.type(
      screen.getByPlaceholderText('Подтвердите пароль'),
      'password123'
    )
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(
      await screen.findByText('Пользователь с таким email уже существует')
    ).toBeInTheDocument()
  })

  it('auto-signs in after successful registration', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('Имя'), 'Тест')
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Пароль'), 'password123')
    await user.type(
      screen.getByPlaceholderText('Подтвердите пароль'),
      'password123'
    )
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        callbackUrl: '/',
      })
    })
  })

  it('disables submit button while submitting', async () => {
    let resolveRegister: (value: unknown) => void = () => {}
    mockRegisterUser.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve
        })
    )

    render(<RegisterForm />)

    fireEvent.change(screen.getByPlaceholderText('Имя'), {
      target: { value: 'Тест' },
    })
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Подтвердите пароль'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(
      screen
        .getByRole('button', { name: 'Зарегистрироваться' })
        .closest('form')!
    )

    expect(
      screen.getByRole('button', { name: 'Регистрация...' })
    ).toBeDisabled()

    resolveRegister({ success: false, error: 'error' })
    await screen.findByRole('button', { name: 'Зарегистрироваться' })
  })
})
