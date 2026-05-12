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

  // Enhanced contrast with border-zinc-700, shadow-md for depth, card-lift for hover micro-interaction
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 shadow-md p-4 card-lift">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <span className="font-medium text-zinc-100">{project.name}</span>
      </div>
      <div className="mb-2 flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Бюджет проекта</span>
        <span className="break-words font-semibold text-zinc-200">
          {committed.toLocaleString('ru-RU')} /{' '}
          {project.budget.toLocaleString('ru-RU')} ₽
        </span>
        <span className="text-xs text-emerald-400">
          Потрачено: {spent.toLocaleString('ru-RU')} ₽
        </span>
        <span className="text-xs text-sky-400">
          На руках: {reserved.toLocaleString('ru-RU')} ₽
        </span>
      </div>
      <ProgressBar value={committed} max={project.budget} />
    </div>
  )
}
