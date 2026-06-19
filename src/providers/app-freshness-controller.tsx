'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useSessionStore } from '@/entities/session'

const LONG_RESUME_MS = 5 * 60 * 1000
const RECENT_REFRESH_MS = 1000
const REFRESHED_TOAST = 'Данные обновлены'

function getCalendarDayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMillisecondsUntilNextLocalDay(now = new Date()) {
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  return Math.max(nextDay.getTime() - now.getTime(), 0)
}

export function AppFreshnessController() {
  const queryClient = useQueryClient()
  const syncTodayIfFollowing = useSessionStore(
    (state) => state.syncTodayIfFollowing
  )

  useEffect(() => {
    let hiddenAt = document.visibilityState === 'hidden' ? Date.now() : null
    let offlineAt = navigator.onLine === false ? Date.now() : null
    let lastKnownDay = getCalendarDayKey()
    let lastRefreshAt = 0
    let midnightTimer: ReturnType<typeof setTimeout> | null = null

    const clearMidnightTimer = () => {
      if (midnightTimer === null) return
      clearTimeout(midnightTimer)
      midnightTimer = null
    }

    const scheduleNextMidnight = () => {
      clearMidnightTimer()
      midnightTimer = setTimeout(() => {
        refreshApp()
        scheduleNextMidnight()
      }, getMillisecondsUntilNextLocalDay())
    }

    const refreshApp = () => {
      const now = Date.now()
      const isRecentRefresh = now - lastRefreshAt < RECENT_REFRESH_MS
      const currentDay = getCalendarDayKey()
      const dayChanged = currentDay !== lastKnownDay
      const pauseStartedAt =
        hiddenAt === null
          ? offlineAt
          : offlineAt === null
            ? hiddenAt
            : Math.min(hiddenAt, offlineAt)
      const wasLongPause =
        pauseStartedAt !== null && now - pauseStartedAt >= LONG_RESUME_MS

      if (isRecentRefresh && !dayChanged) {
        hiddenAt = null
        offlineAt = null
        return
      }

      lastRefreshAt = now
      lastKnownDay = currentDay
      syncTodayIfFollowing()
      queryClient.invalidateQueries({ refetchType: 'active' })

      if (dayChanged || wasLongPause) {
        toast(REFRESHED_TOAST)
      }

      hiddenAt = null
      offlineAt = null
      scheduleNextMidnight()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        return
      }

      refreshApp()
    }

    const handleFocus = () => {
      if (document.visibilityState === 'hidden') return
      refreshApp()
    }

    const handleOnline = () => {
      refreshApp()
    }

    const handleOffline = () => {
      offlineAt = Date.now()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    scheduleNextMidnight()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearMidnightTimer()
    }
  }, [queryClient, syncTodayIfFollowing])

  return null
}
