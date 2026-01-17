import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { CreateProjectForm } from '../ui/create-project-form'

const mockProjects = [
  {
    id: '1',
    name: 'Ремонт',
    budget: 100000,
    color: '#10b981',
    createdAt: '2024-01-01',
  },
]

const mockAddProject = jest.fn()
const mockDeleteProject = jest.fn()

jest.mock('@/entities/project', () => ({
  useProjectStore: (
    selector: (state: {
      projects: typeof mockProjects
      addProject: jest.Mock
      deleteProject: jest.Mock
    }) => unknown
  ) =>
    selector({
      projects: mockProjects,
      addProject: mockAddProject,
      deleteProject: mockDeleteProject,
    }),
}))

describe('CreateProjectForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form with name and budget inputs', () => {
    render(<CreateProjectForm />)

    expect(screen.getByPlaceholderText(/название проекта/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/бюджет/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /создать проект/i })
    ).toBeInTheDocument()
  })

  it('creates project with name and budget', async () => {
    render(<CreateProjectForm />)

    fireEvent.change(screen.getByPlaceholderText(/название проекта/i), {
      target: { value: 'Отпуск' },
    })
    fireEvent.change(screen.getByPlaceholderText(/бюджет/i), {
      target: { value: '50000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /создать проект/i }))

    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Отпуск',
          budget: 50000,
        })
      )
    })
  })

  it('resets form after creating project', async () => {
    render(<CreateProjectForm />)

    const nameInput = screen.getByPlaceholderText(/название проекта/i)
    const budgetInput = screen.getByPlaceholderText(/бюджет/i)

    fireEvent.change(nameInput, { target: { value: 'Отпуск' } })
    fireEvent.change(budgetInput, { target: { value: '50000' } })
    fireEvent.click(screen.getByRole('button', { name: /создать проект/i }))

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
      expect(budgetInput).toHaveValue(null)
    })
  })

  it('disables submit button when form is empty', () => {
    render(<CreateProjectForm />)

    const submitButton = screen.getByRole('button', { name: /создать проект/i })
    expect(submitButton).toBeDisabled()
  })

  it('disables submit button when only name is filled', () => {
    render(<CreateProjectForm />)

    fireEvent.change(screen.getByPlaceholderText(/название проекта/i), {
      target: { value: 'Отпуск' },
    })

    const submitButton = screen.getByRole('button', { name: /создать проект/i })
    expect(submitButton).toBeDisabled()
  })

  it('disables submit button when budget is zero or negative', () => {
    render(<CreateProjectForm />)

    fireEvent.change(screen.getByPlaceholderText(/название проекта/i), {
      target: { value: 'Отпуск' },
    })
    fireEvent.change(screen.getByPlaceholderText(/бюджет/i), {
      target: { value: '0' },
    })

    const submitButton = screen.getByRole('button', { name: /создать проект/i })
    expect(submitButton).toBeDisabled()
  })
})
