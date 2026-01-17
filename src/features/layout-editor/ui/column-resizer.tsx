'use client'

import { useRef } from 'react'

interface ColumnResizerProps {
  columnId: string
  onResize: (columnId: string, deltaPercent: number) => void
  isEditMode: boolean
}

export function ColumnResizer({
  columnId,
  onResize,
  isEditMode,
}: ColumnResizerProps) {
  const startXRef = useRef<number>(0)
  const containerWidthRef = useRef<number>(0)

  if (!isEditMode) {
    return null
  }

  const handleDragStart = (e: React.DragEvent) => {
    startXRef.current = e.clientX
    // Get parent container width for percentage calculation
    const container = (e.target as HTMLElement).closest('[data-grid-container]')
    containerWidthRef.current = container?.clientWidth || window.innerWidth
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', columnId)
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const deltaX = e.clientX - startXRef.current
    const deltaPercent = (deltaX / containerWidthRef.current) * 100
    onResize(columnId, deltaPercent)
  }

  return (
    <div
      role="separator"
      aria-label="Изменить размер колонки"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="w-2 h-full cursor-col-resize bg-transparent hover:bg-emerald-500/50 transition-colors flex-shrink-0"
    />
  )
}
