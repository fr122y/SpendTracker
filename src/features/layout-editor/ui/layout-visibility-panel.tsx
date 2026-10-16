'use client'

import { useState } from 'react'

import { Button, ConfirmDialog } from '@/shared/ui'

import type { WidgetId } from '@/shared/types'

export interface HiddenWidgetItem {
  id: WidgetId
  title: string
}

interface LayoutVisibilityPanelProps {
  hiddenWidgets: HiddenWidgetItem[]
  onShow: (widgetId: WidgetId) => void
  onReset: () => void
}

/** Edit-mode panel: lists hidden widgets and resets the layout. */
export function LayoutVisibilityPanel({
  hiddenWidgets,
  onShow,
  onReset,
}: LayoutVisibilityPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  return (
    <section
      aria-label="Настройка раскладки"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
          Скрытые виджеты
        </h2>
        {hiddenWidgets.length === 0 ? (
          <span className="text-sm text-zinc-500">Нет</span>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {hiddenWidgets.map(({ id, title }) => (
              <li
                key={id}
                className="flex items-center gap-2 rounded-md bg-zinc-800/60 pl-3"
              >
                <span className="text-sm text-zinc-200">{title}</span>
                <Button
                  variant="ghost"
                  aria-label={`Показать: ${title}`}
                  onClick={() => onShow(id)}
                >
                  Показать
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
        Сбросить раскладку
      </Button>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Сбросить раскладку?"
        description="Колонки, порядок и ширина виджетов вернутся к исходным, скрытые виджеты снова появятся."
        confirmLabel="Сбросить"
        onConfirm={() => {
          onReset()
          setIsConfirmOpen(false)
        }}
        onClose={() => setIsConfirmOpen(false)}
      />
    </section>
  )
}
