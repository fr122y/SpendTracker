'use client'

import { ProgressBar } from '@/shared/ui'

import type { Project } from '@/shared/types'

interface ProjectCardProps {
  project: Project
  spent: number
  cashOnHand: number
}

export function ProjectCard({ project, spent, cashOnHand }: ProjectCardProps) {
  const reserved = Math.max(cashOnHand, 0)
  const committed = spent + reserved
  const formatAmount = (value: number) => `${value.toLocaleString('ru-RU')} ₽`
  const metricRowClass =
    'flex min-w-0 items-baseline justify-between gap-3 text-xs'
  const metricLabelClass = 'min-w-0 text-zinc-400'
  const metricValueClass = 'shrink-0 text-right font-semibold tabular-nums'

  // Enhanced contrast with border-zinc-700, shadow-md for depth, card-lift for hover micro-interaction
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 shadow-md p-4 card-lift">
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <span className="min-w-0 truncate font-medium text-zinc-100">
          {project.name}
        </span>
      </div>
      <div className="mb-2 grid gap-1">
        <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0 text-zinc-400">Бюджет проекта</span>
          <span className="shrink-0 text-right font-semibold tabular-nums text-zinc-200">
            {committed.toLocaleString('ru-RU')} /{' '}
            {project.budget.toLocaleString('ru-RU')} ₽
          </span>
        </div>
        <div className={metricRowClass}>
          <span className={metricLabelClass}>Потрачено</span>
          <span className={`${metricValueClass} text-emerald-400`}>
            {formatAmount(spent)}
          </span>
        </div>
        <div className={metricRowClass}>
          <span className={metricLabelClass}>На руках</span>
          <span className={`${metricValueClass} text-sky-400`}>
            {formatAmount(reserved)}
          </span>
        </div>
      </div>
      <ProgressBar value={committed} max={project.budget} />
    </div>
  )
}
