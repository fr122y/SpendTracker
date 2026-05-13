import { render, screen, within } from '@testing-library/react'

import { ProjectCard } from '../ui/project-card'

import type { Project } from '@/shared/types'

const project: Project = {
  id: 'project-1',
  name: 'Очень длинное название проекта для проверки устойчивой верстки',
  budget: 100000,
  color: '#10b981',
  createdAt: '2026-01-01',
}

describe('ProjectCard', () => {
  it('keeps long project names constrained to one line with a full title', () => {
    render(<ProjectCard project={project} spent={20000} cashOnHand={7000} />)

    const projectName = screen.getByText(project.name)

    expect(projectName).toHaveClass('min-w-0', 'truncate')
    expect(projectName).toHaveAttribute('title', project.name)
  })

  it('prevents the project color marker from shrinking', () => {
    const { container } = render(
      <ProjectCard project={project} spent={20000} cashOnHand={7000} />
    )

    const colorMarker = container.querySelector(
      '[style="background-color: rgb(16, 185, 129);"]'
    )

    expect(colorMarker).toHaveClass('shrink-0')
  })

  it('renders the committed and total budget as a non-wrapping value', () => {
    render(<ProjectCard project={project} spent={20000} cashOnHand={7000} />)

    const budgetValue = screen.getByText(/27\s?000 \/ 100\s?000 ₽/)

    expect(budgetValue).toHaveClass('whitespace-nowrap')
  })

  it('renders spent and cash on hand as compact non-wrapping chips', () => {
    render(<ProjectCard project={project} spent={20000} cashOnHand={7000} />)

    const spentLabel = screen.getByText('Потрачено')
    const cashLabel = screen.getByText('На руках')
    const spentChip = spentLabel.parentElement
    const cashChip = cashLabel.parentElement

    expect(spentChip).toHaveClass('inline-flex')
    expect(cashChip).toHaveClass('inline-flex')
    expect(
      within(spentChip as HTMLElement).getByText(/20\s?000 ₽/)
    ).toHaveClass('whitespace-nowrap')
    expect(within(cashChip as HTMLElement).getByText(/7\s?000 ₽/)).toHaveClass(
      'whitespace-nowrap'
    )
  })

  it('does not show negative cash on hand in the card totals', () => {
    render(<ProjectCard project={project} spent={20000} cashOnHand={-5000} />)

    expect(screen.getByText(/20\s?000 \/ 100\s?000 ₽/)).toBeInTheDocument()
    expect(screen.getByText('0 ₽')).toHaveClass('whitespace-nowrap')
  })
})
