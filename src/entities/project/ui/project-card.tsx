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

  return (
    <div className="card-lift rounded-lg border border-zinc-700 bg-zinc-900/70 p-4 shadow-md">
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <span
          className="min-w-0 truncate font-medium text-zinc-100"
          title={project.name}
        >
          {project.name}
        </span>
      </div>

      <div className="mb-3 flex flex-col gap-1 text-sm">
        <span className="text-xs text-zinc-500 sm:text-sm">Бюджет проекта</span>
        <span className="whitespace-nowrap font-semibold text-zinc-200">
          {committed.toLocaleString('ru-RU')} /{' '}
          {project.budget.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
          <span className="text-emerald-300/80">Потрачено</span>
          <span className="whitespace-nowrap font-medium">
            {spent.toLocaleString('ru-RU')} ₽
          </span>
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-xs text-sky-400">
          <span className="text-sky-300/80">На руках</span>
          <span className="whitespace-nowrap font-medium">
            {reserved.toLocaleString('ru-RU')} ₽
          </span>
        </span>
      </div>

      <ProgressBar value={committed} max={project.budget} />
    </div>
  )
}
