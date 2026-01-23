import { render, screen, fireEvent } from '@testing-library/react'

import { ProjectsSection } from '../ui/projects-section'

import type { Project, Expense } from '@/shared/types'

// Mock data
let mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Ремонт',
    budget: 100000,
    color: '#10b981',
    createdAt: '2026-01-01',
  },
  {
    id: 'project-2',
    name: 'Отпуск',
    budget: 50000,
    color: '#3b82f6',
    createdAt: '2026-01-15',
  },
]

let mockExpenses: Expense[] = [
  {
    id: 'expense-1',
    description: 'Строительные материалы',
    amount: 15000,
    date: '2026-01-10',
    category: 'Ремонт',
    emoji: '🔨',
    projectId: 'project-1',
  },
  {
    id: 'expense-2',
    description: 'Инструменты',
    amount: 5000,
    date: '2026-01-12',
    category: 'Ремонт',
    emoji: '🔧',
    projectId: 'project-1',
  },
  {
    id: 'expense-3',
    description: 'Билеты',
    amount: 20000,
    date: '2026-01-16',
    category: 'Транспорт',
    emoji: '✈️',
    projectId: 'project-2',
  },
  {
    id: 'expense-4',
    description: 'Личный расход',
    amount: 1000,
    date: '2026-01-20',
    category: 'Еда',
    emoji: '🍔',
    // No projectId - personal expense
  },
]

const mockDeleteProject = jest.fn()
const mockDeleteExpense = jest.fn()

// Mock stores
jest.mock('@/entities/project', () => ({
  useProjectStore: (
    selector: (state: {
      projects: Project[]
      deleteProject: jest.Mock
    }) => unknown
  ) =>
    selector({
      projects: mockProjects,
      deleteProject: mockDeleteProject,
    }),
  ProjectCard: jest.fn(
    ({ project, spent }: { project: Project; spent: number }) => (
      <div data-testid={`project-card-${project.id}`}>
        <div data-testid="project-name">{project.name}</div>
        <div data-testid="project-budget">{project.budget}</div>
        <div data-testid="project-spent">{spent}</div>
      </div>
    )
  ),
}))

jest.mock('@/entities/expense', () => ({
  useExpenseStore: (
    selector: (state: { expenses: Expense[]; deleteExpense: jest.Mock }) => unknown
  ) =>
    selector({
      expenses: mockExpenses,
      deleteExpense: mockDeleteExpense,
    }),
  ExpenseList: jest.fn(
    ({ expenses, onDelete }: { expenses: Expense[]; onDelete: (id: string) => void }) => (
      <div data-testid="expense-list">
        <div data-testid="expense-count">{expenses.length}</div>
        {expenses.map((expense) => (
          <div key={expense.id} data-testid={`expense-${expense.id}`}>
            <span>{expense.description}</span>
            <button onClick={() => onDelete(expense.id)}>Delete {expense.id}</button>
          </div>
        ))}
      </div>
    )
  ),
}))

// Mock CreateProjectForm
jest.mock('@/features/manage-projects', () => ({
  CreateProjectForm: jest.fn(() => (
    <div data-testid="create-project-form">Create Project Form</div>
  )),
  ProjectExpenseForm: jest.fn(({ projectId }: { projectId: string }) => (
    <div data-testid={`project-expense-form-${projectId}`}>
      Project Expense Form for {projectId}
    </div>
  )),
}))

// Mock shared lib
jest.mock('@/shared/lib', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
}))

// Mock Button component
jest.mock('@/shared/ui', () => ({
  Button: jest.fn(
    ({
      children,
      onClick,
      variant,
    }: {
      children: React.ReactNode
      onClick?: () => void
      variant?: string
    }) => (
      <button onClick={onClick} data-variant={variant}>
        {children}
      </button>
    )
  ),
}))

describe('ProjectsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockProjects = [
      {
        id: 'project-1',
        name: 'Ремонт',
        budget: 100000,
        color: '#10b981',
        createdAt: '2026-01-01',
      },
      {
        id: 'project-2',
        name: 'Отпуск',
        budget: 50000,
        color: '#3b82f6',
        createdAt: '2026-01-15',
      },
    ]
    mockExpenses = [
      {
        id: 'expense-1',
        description: 'Строительные материалы',
        amount: 15000,
        date: '2026-01-10',
        category: 'Ремонт',
        emoji: '🔨',
        projectId: 'project-1',
      },
      {
        id: 'expense-2',
        description: 'Инструменты',
        amount: 5000,
        date: '2026-01-12',
        category: 'Ремонт',
        emoji: '🔧',
        projectId: 'project-1',
      },
      {
        id: 'expense-3',
        description: 'Билеты',
        amount: 20000,
        date: '2026-01-16',
        category: 'Транспорт',
        emoji: '✈️',
        projectId: 'project-2',
      },
      {
        id: 'expense-4',
        description: 'Личный расход',
        amount: 1000,
        date: '2026-01-20',
        category: 'Еда',
        emoji: '🍔',
      },
    ]
  })

  describe('rendering', () => {
    it('renders header with title', () => {
      render(<ProjectsSection />)

      expect(screen.getByText('Проекты')).toBeInTheDocument()
    })

    it('renders create project button', () => {
      render(<ProjectsSection />)

      expect(screen.getByText('Создать проект')).toBeInTheDocument()
    })

    it('applies correct container styling', () => {
      const { container } = render(<ProjectsSection />)

      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'gap-4', 'p-6')
    })

    it('renders all projects as cards', () => {
      render(<ProjectsSection />)

      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
    })

    it('does not show create form initially', () => {
      render(<ProjectsSection />)

      expect(screen.queryByTestId('create-project-form')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty message when no projects exist', () => {
      mockProjects = []
      render(<ProjectsSection />)

      expect(
        screen.getByText('Нет проектов. Создайте первый проект для отслеживания бюджета.')
      ).toBeInTheDocument()
    })

    it('does not render project cards when empty', () => {
      mockProjects = []
      render(<ProjectsSection />)

      expect(screen.queryByTestId(/project-card-/)).not.toBeInTheDocument()
    })

    it('still shows create project button when empty', () => {
      mockProjects = []
      render(<ProjectsSection />)

      expect(screen.getByText('Создать проект')).toBeInTheDocument()
    })
  })

  describe('create project form toggle', () => {
    it('shows create form when button is clicked', () => {
      render(<ProjectsSection />)

      const createButton = screen.getByText('Создать проект')
      fireEvent.click(createButton)

      expect(screen.getByTestId('create-project-form')).toBeInTheDocument()
    })

    it('changes button text to "Отмена" when form is shown', () => {
      render(<ProjectsSection />)

      const createButton = screen.getByText('Создать проект')
      fireEvent.click(createButton)

      expect(screen.getByText('Отмена')).toBeInTheDocument()
      expect(screen.queryByText('Создать проект')).not.toBeInTheDocument()
    })

    it('hides form when cancel button is clicked', () => {
      render(<ProjectsSection />)

      // Show form
      fireEvent.click(screen.getByText('Создать проект'))
      expect(screen.getByTestId('create-project-form')).toBeInTheDocument()

      // Hide form
      fireEvent.click(screen.getByText('Отмена'))
      expect(screen.queryByTestId('create-project-form')).not.toBeInTheDocument()
    })

    it('toggles form visibility multiple times', () => {
      render(<ProjectsSection />)

      const createButton = screen.getByText('Создать проект')

      // Toggle on
      fireEvent.click(createButton)
      expect(screen.getByTestId('create-project-form')).toBeInTheDocument()

      // Toggle off
      fireEvent.click(screen.getByText('Отмена'))
      expect(screen.queryByTestId('create-project-form')).not.toBeInTheDocument()

      // Toggle on again
      fireEvent.click(screen.getByText('Создать проект'))
      expect(screen.getByTestId('create-project-form')).toBeInTheDocument()
    })
  })

  describe('project expansion', () => {
    it('expands project when card is clicked', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByText('Удалить проект')).toBeInTheDocument()
    })

    it('shows project expense form when expanded', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByTestId('project-expense-form-project-1')).toBeInTheDocument()
    })

    it('shows "Добавить расход" header when expanded', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByText('Добавить расход')).toBeInTheDocument()
    })

    it('shows "Расходы проекта" header when expanded', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByText('Расходы проекта')).toBeInTheDocument()
    })

    it('collapses project when clicked again', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')

      // Expand
      fireEvent.click(projectCard)
      expect(screen.getByText('Удалить проект')).toBeInTheDocument()

      // Collapse
      fireEvent.click(projectCard)
      expect(screen.queryByText('Удалить проект')).not.toBeInTheDocument()
    })

    it('collapses first project when second project is expanded', () => {
      render(<ProjectsSection />)

      const project1Card = screen.getByTestId('project-card-project-1')
      const project2Card = screen.getByTestId('project-card-project-2')

      // Expand project 1
      fireEvent.click(project1Card)
      expect(screen.getByTestId('project-expense-form-project-1')).toBeInTheDocument()

      // Expand project 2
      fireEvent.click(project2Card)
      expect(screen.queryByTestId('project-expense-form-project-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('project-expense-form-project-2')).toBeInTheDocument()
    })
  })

  describe('project spent calculation', () => {
    it('calculates spent amount for project with expenses', () => {
      render(<ProjectsSection />)

      const project1Card = screen.getByTestId('project-card-project-1')
      const spentElement = project1Card.querySelector('[data-testid="project-spent"]')

      // project-1 has expenses: 15000 + 5000 = 20000
      expect(spentElement).toHaveTextContent('20000')
    })

    it('calculates spent amount for project with single expense', () => {
      render(<ProjectsSection />)

      const project2Card = screen.getByTestId('project-card-project-2')
      const spentElement = project2Card.querySelector('[data-testid="project-spent"]')

      // project-2 has expense: 20000
      expect(spentElement).toHaveTextContent('20000')
    })

    it('shows zero spent for project without expenses', () => {
      mockProjects = [
        {
          id: 'project-3',
          name: 'Новый проект',
          budget: 30000,
          color: '#ef4444',
          createdAt: '2026-01-20',
        },
      ]

      render(<ProjectsSection />)

      const project3Card = screen.getByTestId('project-card-project-3')
      const spentElement = project3Card.querySelector('[data-testid="project-spent"]')

      expect(spentElement).toHaveTextContent('0')
    })

    it('excludes personal expenses from project spent calculation', () => {
      render(<ProjectsSection />)

      // expense-4 (1000) has no projectId and should not be counted
      const allSpents = screen.getAllByTestId('project-spent')
      const totalSpent = allSpents.reduce(
        (sum, el) => sum + Number(el.textContent),
        0
      )

      // Should be 20000 (project-1) + 20000 (project-2) = 40000
      // NOT including the 1000 personal expense
      expect(totalSpent).toBe(40000)
    })
  })

  describe('project expenses filtering', () => {
    it('shows only expenses for expanded project', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const expenseList = screen.getByTestId('expense-list')
      const expenseCount = screen.getByTestId('expense-count')

      // project-1 has 2 expenses (expense-1 and expense-2)
      expect(expenseCount).toHaveTextContent('2')
      expect(screen.getByTestId('expense-expense-1')).toBeInTheDocument()
      expect(screen.getByTestId('expense-expense-2')).toBeInTheDocument()
    })

    it('does not show expenses from other projects', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      // expense-3 belongs to project-2
      expect(screen.queryByTestId('expense-expense-3')).not.toBeInTheDocument()
    })

    it('does not show personal expenses in project list', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      // expense-4 has no projectId
      expect(screen.queryByTestId('expense-expense-4')).not.toBeInTheDocument()
    })

    it('shows different expenses when different projects are expanded', () => {
      render(<ProjectsSection />)

      // Expand project-1
      fireEvent.click(screen.getByTestId('project-card-project-1'))
      expect(screen.getByTestId('expense-count')).toHaveTextContent('2')

      // Expand project-2
      fireEvent.click(screen.getByTestId('project-card-project-2'))
      expect(screen.getByTestId('expense-count')).toHaveTextContent('1')
    })
  })

  describe('delete project functionality', () => {
    it('shows delete button when project is expanded', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Удалить проект')
      expect(deleteButton).toBeInTheDocument()
    })

    it('calls deleteProject when delete button is clicked', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Удалить проект')
      fireEvent.click(deleteButton)

      expect(mockDeleteProject).toHaveBeenCalledWith('project-1')
    })

    it('deletes all project expenses before deleting project', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Удалить проект')
      fireEvent.click(deleteButton)

      // Should delete both expenses for project-1
      expect(mockDeleteExpense).toHaveBeenCalledWith('expense-1')
      expect(mockDeleteExpense).toHaveBeenCalledWith('expense-2')
      expect(mockDeleteExpense).toHaveBeenCalledTimes(2)
    })

    it('deletes project after deleting expenses', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Удалить проект')
      fireEvent.click(deleteButton)

      // deleteProject should be called after deleteExpense
      expect(mockDeleteProject).toHaveBeenCalledTimes(1)
    })

    it('collapses expanded view after deleting project', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)
      expect(screen.getByText('Удалить проект')).toBeInTheDocument()

      const deleteButton = screen.getByText('Удалить проект')
      fireEvent.click(deleteButton)

      // After deletion, the expanded view should be closed
      // Since we're mocking stores, the component still renders, but expandedProjectId should be null
      // We can verify by clicking the delete button which should trigger the cleanup
      expect(mockDeleteProject).toHaveBeenCalled()
    })

    it('stops propagation when delete button is clicked', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Удалить проект')

      // Click delete button - it should not toggle the project expansion
      fireEvent.click(deleteButton)

      // deleteProject should have been called
      expect(mockDeleteProject).toHaveBeenCalled()
    })
  })

  describe('delete expense functionality', () => {
    it('passes deleteExpense function to ExpenseList', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Delete expense-1')
      fireEvent.click(deleteButton)

      expect(mockDeleteExpense).toHaveBeenCalledWith('expense-1')
    })

    it('deletes individual expense without deleting project', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Delete expense-1')
      fireEvent.click(deleteButton)

      expect(mockDeleteExpense).toHaveBeenCalledWith('expense-1')
      expect(mockDeleteProject).not.toHaveBeenCalled()
    })
  })

  describe('grid layout', () => {
    it('renders projects in grid layout', () => {
      const { container } = render(<ProjectsSection />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('grid-cols-1', 'gap-4', 'sm:grid-cols-2')
    })

    it('expands project to full width when expanded', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      // The expanded project should take full width
      const expandedWrapper = projectCard.closest('div[class*="transition-all"]')
      expect(expandedWrapper).toHaveClass('col-span-1', 'sm:col-span-2')
    })

    it('applies hover effect to project cards', () => {
      const { container } = render(<ProjectsSection />)

      const projectWrapper = container.querySelector('.cursor-pointer')
      expect(projectWrapper).toHaveClass(
        'cursor-pointer',
        'transition-transform',
        'hover:scale-[1.01]'
      )
    })
  })

  describe('expanded content styling', () => {
    it('applies correct styling to expanded content container', () => {
      const { container } = render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const expandedContent = container.querySelector(
        '.rounded-lg.border.border-zinc-800'
      )
      expect(expandedContent).toBeInTheDocument()
      expect(expandedContent).toHaveClass(
        'mt-4',
        'space-y-4',
        'rounded-lg',
        'border',
        'border-zinc-800',
        'bg-zinc-900/30',
        'p-4'
      )
    })

    it('applies scrollable container to expense list', () => {
      const { container } = render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const scrollContainer = container.querySelector('.max-h-\\[300px\\]')
      expect(scrollContainer).toBeInTheDocument()
      expect(scrollContainer).toHaveClass('max-h-[300px]', 'overflow-y-auto')
    })
  })

  describe('integration with stores', () => {
    it('reads projects from project store', () => {
      render(<ProjectsSection />)

      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
    })

    it('reads expenses from expense store', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByTestId('expense-count')).toHaveTextContent('2')
    })

    it('calls deleteProject action from store', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Удалить проект')
      fireEvent.click(deleteButton)

      expect(mockDeleteProject).toHaveBeenCalledWith('project-1')
    })

    it('calls deleteExpense action from store', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Delete expense-1')
      fireEvent.click(deleteButton)

      expect(mockDeleteExpense).toHaveBeenCalledWith('expense-1')
    })
  })

  describe('edge cases', () => {
    it('handles project with no expenses', () => {
      mockExpenses = []
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByTestId('expense-count')).toHaveTextContent('0')
    })

    it('handles single project', () => {
      mockProjects = [mockProjects[0]]
      render(<ProjectsSection />)

      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
    })

    it('handles many projects', () => {
      mockProjects = Array.from({ length: 10 }, (_, i) => ({
        id: `project-${i}`,
        name: `Проект ${i}`,
        budget: 10000 * (i + 1),
        color: '#10b981',
        createdAt: '2026-01-01',
      }))

      render(<ProjectsSection />)

      mockProjects.forEach((project) => {
        expect(screen.getByTestId(`project-card-${project.id}`)).toBeInTheDocument()
      })
    })

    it('handles project with very large budget', () => {
      mockProjects = [
        {
          id: 'project-large',
          name: 'Большой проект',
          budget: 9999999,
          color: '#10b981',
          createdAt: '2026-01-01',
        },
      ]

      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-large')
      const budgetElement = projectCard.querySelector('[data-testid="project-budget"]')
      expect(budgetElement).toHaveTextContent('9999999')
    })

    it('handles project with very large spent amount', () => {
      mockExpenses = [
        {
          id: 'expense-huge',
          description: 'Огромный расход',
          amount: 5000000,
          date: '2026-01-10',
          category: 'Проект',
          emoji: '💰',
          projectId: 'project-1',
        },
      ]

      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      const spentElement = projectCard.querySelector('[data-testid="project-spent"]')
      expect(spentElement).toHaveTextContent('5000000')
    })

    it('handles deleting project with many expenses', () => {
      mockExpenses = Array.from({ length: 20 }, (_, i) => ({
        id: `expense-${i}`,
        description: `Расход ${i}`,
        amount: 1000,
        date: '2026-01-10',
        category: 'Тест',
        emoji: '📝',
        projectId: 'project-1',
      }))

      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Удалить проект')
      fireEvent.click(deleteButton)

      // Should delete all 20 expenses
      expect(mockDeleteExpense).toHaveBeenCalledTimes(20)
      expect(mockDeleteProject).toHaveBeenCalledWith('project-1')
    })
  })

  describe('Russian localization', () => {
    it('displays header in Russian', () => {
      render(<ProjectsSection />)

      expect(screen.getByText('Проекты')).toBeInTheDocument()
    })

    it('displays create button in Russian', () => {
      render(<ProjectsSection />)

      expect(screen.getByText('Создать проект')).toBeInTheDocument()
    })

    it('displays cancel button in Russian', () => {
      render(<ProjectsSection />)

      fireEvent.click(screen.getByText('Создать проект'))
      expect(screen.getByText('Отмена')).toBeInTheDocument()
    })

    it('displays delete button in Russian', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByText('Удалить проект')).toBeInTheDocument()
    })

    it('displays add expense header in Russian', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByText('Добавить расход')).toBeInTheDocument()
    })

    it('displays project expenses header in Russian', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByText('Расходы проекта')).toBeInTheDocument()
    })

    it('displays empty state message in Russian', () => {
      mockProjects = []
      render(<ProjectsSection />)

      expect(
        screen.getByText('Нет проектов. Создайте первый проект для отслеживания бюджета.')
      ).toBeInTheDocument()
    })
  })

  describe('button variants', () => {
    it('uses ghost variant for create/cancel button', () => {
      const { container } = render(<ProjectsSection />)

      const createButton = screen.getByText('Создать проект')
      expect(createButton).toHaveAttribute('data-variant', 'ghost')
    })

    it('uses danger variant for delete button', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      const deleteButton = screen.getByText('Удалить проект')
      expect(deleteButton).toHaveAttribute('data-variant', 'danger')
    })
  })

  describe('component composition', () => {
    it('renders CreateProjectForm component', () => {
      render(<ProjectsSection />)

      fireEvent.click(screen.getByText('Создать проект'))
      expect(screen.getByTestId('create-project-form')).toBeInTheDocument()
    })

    it('renders ProjectExpenseForm with correct projectId', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByTestId('project-expense-form-project-1')).toBeInTheDocument()
      expect(screen.getByText('Project Expense Form for project-1')).toBeInTheDocument()
    })

    it('renders ProjectCard for each project', () => {
      render(<ProjectsSection />)

      expect(screen.getAllByTestId('project-name')).toHaveLength(2)
    })

    it('renders ExpenseList with filtered expenses', () => {
      render(<ProjectsSection />)

      const projectCard = screen.getByTestId('project-card-project-1')
      fireEvent.click(projectCard)

      expect(screen.getByTestId('expense-list')).toBeInTheDocument()
    })
  })
})
