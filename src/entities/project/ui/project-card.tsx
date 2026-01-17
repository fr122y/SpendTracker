'use client'

import { ProgressBar } from '@/shared/ui'

import type { Project } from '@/shared/types'

interface ProjectCardProps {
  project: Project
  spent: number
}

export function ProjectCard({ project, spent }: ProjectCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <span className="font-medium text-zinc-100">{project.name}</span>
      </div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-zinc-400">Потрачено</span>
        <span className="text-zinc-200">
          {spent} / {project.budget} ₽
        </span>
      </div>
      <ProgressBar value={spent} max={project.budget} />
    </div>
  )
}
