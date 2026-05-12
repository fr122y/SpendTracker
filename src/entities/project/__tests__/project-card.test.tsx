import { render, screen } from '@testing-library/react'

import { ProjectCard } from '../ui/project-card'

const project = {
  id: 'project-1',
  name: 'Очень длинное название проекта для проверки верстки',
  budget: 100000,
  color: '#38bdf8',
  createdAt: '2026-01-01',
}

describe('ProjectCard', () => {
  it('renders project labels and values as compact rows', () => {
    render(<ProjectCard project={project} spent={15000} cashOnHand={5000} />)

    expect(screen.getByText(project.name)).toHaveClass('truncate')
    expect(screen.getByText('Бюджет проекта')).toBeInTheDocument()
    expect(screen.getByText('20 000 / 100 000 ₽')).toHaveClass('tabular-nums')
    expect(screen.getByText('Потрачено')).toBeInTheDocument()
    expect(screen.getByText('15 000 ₽')).toHaveClass('text-emerald-400')
    expect(screen.getByText('На руках')).toBeInTheDocument()
    expect(screen.getByText('5 000 ₽')).toHaveClass('text-sky-400')
  })
})
