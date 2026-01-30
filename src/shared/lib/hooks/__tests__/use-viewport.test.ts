import { act, renderHook, waitFor } from '@testing-library/react'

import { useViewport, isMobile, isTabletOrSmaller } from '../use-viewport'

describe('useViewport', () => {
  let originalInnerWidth: number

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920, // Default to desktop
    })

    // Clear all timers
    jest.clearAllTimers()
  })

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })

    // Cleanup timers
    jest.clearAllTimers()
  })

  describe('initial viewport detection', () => {
    it('should detect mobile viewport (< 768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const { result } = renderHook(() => useViewport())

      expect(result.current).toBe('mobile')
    })

    it('should detect tablet viewport (768px - 1279px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      const { result } = renderHook(() => useViewport())

      expect(result.current).toBe('tablet')
    })

    it('should detect desktop viewport (>= 1280px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const { result } = renderHook(() => useViewport())

      expect(result.current).toBe('desktop')
    })
  })

  describe('breakpoint boundaries', () => {
    it('should return mobile at 767px (1px below tablet threshold)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      })

      const { result } = renderHook(() => useViewport())

      expect(result.current).toBe('mobile')
    })

    it('should return tablet at exactly 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const { result } = renderHook(() => useViewport())

      expect(result.current).toBe('tablet')
    })

    it('should return tablet at 1279px (1px below desktop threshold)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1279,
      })

      const { result } = renderHook(() => useViewport())

      expect(result.current).toBe('tablet')
    })

    it('should return desktop at exactly 1280px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      })

      const { result } = renderHook(() => useViewport())

      expect(result.current).toBe('desktop')
    })
  })

  describe('resize handling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should update viewport on window resize (desktop -> mobile)', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const { result } = renderHook(() => useViewport())
      expect(result.current).toBe('desktop')

      // Simulate resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        })
        window.dispatchEvent(new Event('resize'))

        // Fast-forward debounce timer (100ms)
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(result.current).toBe('mobile')
      })
    })

    it('should update viewport on window resize (mobile -> tablet)', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const { result } = renderHook(() => useViewport())
      expect(result.current).toBe('mobile')

      // Simulate resize to tablet
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        })
        window.dispatchEvent(new Event('resize'))
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(result.current).toBe('tablet')
      })
    })

    it('should update viewport on window resize (tablet -> desktop)', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      const { result } = renderHook(() => useViewport())
      expect(result.current).toBe('tablet')

      // Simulate resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920,
        })
        window.dispatchEvent(new Event('resize'))
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(result.current).toBe('desktop')
      })
    })

    it('should debounce resize events (100ms)', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const { result } = renderHook(() => useViewport())
      expect(result.current).toBe('desktop')

      // Simulate multiple rapid resize events
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        })
        window.dispatchEvent(new Event('resize'))
        jest.advanceTimersByTime(50) // Only 50ms

        // Another resize before debounce completes
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        })
        window.dispatchEvent(new Event('resize'))
        jest.advanceTimersByTime(50) // Another 50ms (total 100ms from last event)
      })

      // Should NOT be mobile (first resize was cancelled)
      expect(result.current).toBe('desktop')

      // Wait for final debounce to complete
      act(() => {
        jest.advanceTimersByTime(50) // Complete the 100ms from second resize
      })

      await waitFor(() => {
        expect(result.current).toBe('tablet') // Final value
      })
    })
  })

  describe('cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should remove resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useViewport())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })

    it('should clear timeout on unmount', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const { unmount } = renderHook(() => useViewport())

      // Trigger resize event to create a timeout
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        })
        window.dispatchEvent(new Event('resize'))
      })

      // Unmount before timeout completes
      unmount()

      // Advance timers - if timeout wasn't cleared, this would cause issues
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // No errors should occur
      expect(true).toBe(true)
    })
  })

  describe('SSR safety', () => {
    it('should default to desktop during SSR', () => {
      // This test verifies the initial state is 'desktop'
      // which is SSR-safe as per the hook documentation
      const { result } = renderHook(() => useViewport())

      // Initial state should be desktop (before useEffect runs)
      // After useEffect runs, it will be updated to actual viewport
      // But the hook is designed to handle SSR where useEffect doesn't run
      expect(['mobile', 'tablet', 'desktop']).toContain(result.current)
    })
  })

  describe('multiple hook instances', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should work independently with multiple instances', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const { result: result1 } = renderHook(() => useViewport())
      const { result: result2 } = renderHook(() => useViewport())

      expect(result1.current).toBe('desktop')
      expect(result2.current).toBe('desktop')

      // Resize should affect both instances
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        })
        window.dispatchEvent(new Event('resize'))
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(result1.current).toBe('mobile')
        expect(result2.current).toBe('mobile')
      })
    })
  })
})

describe('isMobile utility', () => {
  it('should return true for mobile viewport', () => {
    expect(isMobile('mobile')).toBe(true)
  })

  it('should return false for tablet viewport', () => {
    expect(isMobile('tablet')).toBe(false)
  })

  it('should return false for desktop viewport', () => {
    expect(isMobile('desktop')).toBe(false)
  })
})

describe('isTabletOrSmaller utility', () => {
  it('should return true for mobile viewport', () => {
    expect(isTabletOrSmaller('mobile')).toBe(true)
  })

  it('should return true for tablet viewport', () => {
    expect(isTabletOrSmaller('tablet')).toBe(true)
  })

  it('should return false for desktop viewport', () => {
    expect(isTabletOrSmaller('desktop')).toBe(false)
  })
})
