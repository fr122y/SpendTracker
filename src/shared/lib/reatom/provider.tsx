'use client'

import { context, type Frame } from '@reatom/core'
import { reatomContext } from '@reatom/react'
import { type ReactNode, useRef } from 'react'

export function ReatomProvider({ children }: { children: ReactNode }) {
  const frameRef = useRef<Frame | null>(null)

  if (!frameRef.current) {
    frameRef.current = context.start()
  }

  return (
    <reatomContext.Provider value={frameRef.current}>
      {children}
    </reatomContext.Provider>
  )
}
