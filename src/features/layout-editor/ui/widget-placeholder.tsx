'use client'

import { useState } from 'react'

import type { WidgetId } from '@/shared/types'

interface WidgetPlaceholderProps {
  columnId: string
  widgetId: WidgetId
  onDrop: (widgetId: WidgetId, fromColumnId: string, toColumnId: string) => void
  isEditMode: boolean
  children: React.ReactNode
}

export function WidgetPlaceholder({
  columnId,
  widgetId,
  onDrop,
  isEditMode,
  children,
}: WidgetPlaceholderProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ widgetId, fromColumnId: columnId })
      )
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (isEditMode) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!isEditMode) return

    try {
      const data = e.dataTransfer?.getData('application/json')
      if (data) {
        const { widgetId: droppedWidgetId, fromColumnId } = JSON.parse(data)
        onDrop(droppedWidgetId, fromColumnId, columnId)
      }
    } catch {
      // Invalid data, ignore
    }
  }

  return (
    <div
      data-testid="widget-placeholder"
      draggable={isEditMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-lg transition-all ${
        isDragOver ? 'ring-2 ring-emerald-500' : ''
      } ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {isEditMode && (
        <div
          aria-label="Перетащить виджет"
          className="absolute top-2 right-2 z-10 p-1.5 bg-zinc-700/80 rounded-md hover:bg-zinc-600 cursor-grab"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-300"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
      )}
      {children}
    </div>
  )
}
