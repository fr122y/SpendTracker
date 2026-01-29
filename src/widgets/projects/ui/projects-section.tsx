'use client'

import { useState } from 'react'

import { useExpenseStore, ExpenseList } from '@/entities/expense'
import { useProjectStore, ProjectCard } from '@/entities/project'
import {
  CreateProjectForm,
  ProjectExpenseForm,
} from '@/features/manage-projects'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'

export function ProjectsSection() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null
  )

  const projects = useProjectStore((state) => state.projects)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const expenses = useExpenseStore((state) => state.expenses)
  const deleteExpense = useExpenseStore((state) => state.deleteExpense)

  // Calculate spent amount per project
  const getProjectSpent = (projectId: string) => {
    return expenses
      .filter((e) => e.projectId === projectId)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  // Get expenses for a specific project
  const getProjectExpenses = (projectId: string) => {
    return expenses.filter((e) => e.projectId === projectId)
  }

  const toggleExpanded = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId))
  }

  const handleDeleteProject = (projectId: string) => {
    // Delete all expenses associated with this project
    const projectExpenses = getProjectExpenses(projectId)
    for (const expense of projectExpenses) {
      deleteExpense(expense.id)
    }
    deleteProject(projectId)
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
          Проекты
        </h2>
        <Button
          variant="ghost"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="w-full sm:w-auto"
        >
          {showCreateForm ? 'Отмена' : 'Создать проект'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
          <CreateProjectForm />
        </div>
      )}

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {projects.map((project) => {
            const isExpanded = expandedProjectId === project.id
            const projectExpenses = getProjectExpenses(project.id)

            return (
              <div
                key={project.id}
                className={cn(
                  'transition-all',
                  isExpanded && 'col-span-1 sm:col-span-2 lg:col-span-3'
                )}
              >
                {/* Project Card Wrapper */}
                <button
                  type="button"
                  className="w-full text-left min-h-11 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
                  onClick={() => toggleExpanded(project.id)}
                >
                  <ProjectCard
                    project={project}
                    spent={getProjectSpent(project.id)}
                  />
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 sm:mt-4 sm:space-y-4 sm:p-4">
                    {/* Delete Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        className="w-full sm:w-auto"
                      >
                        Удалить проект
                      </Button>
                    </div>

                    {/* Project Expense Form */}
                    <div>
                      <h3 className="mb-2 text-xs font-medium text-zinc-400 sm:text-sm">
                        Добавить расход
                      </h3>
                      <ProjectExpenseForm projectId={project.id} />
                    </div>

                    {/* Project Expense List */}
                    <div>
                      <h3 className="mb-2 text-xs font-medium text-zinc-400 sm:text-sm">
                        Расходы проекта
                      </h3>
                      <div className="max-h-[200px] overflow-y-auto sm:max-h-[300px]">
                        <ExpenseList
                          expenses={projectExpenses}
                          onDelete={deleteExpense}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-500">
          Нет проектов. Создайте первый проект для отслеживания бюджета.
        </p>
      )}
    </div>
  )
}
