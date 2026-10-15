'use client'

import { forwardRef, useCallback, useState, type KeyboardEvent } from 'react'

import { parseAmountInput } from '@/shared/lib/money-amount'

import { Input, type InputProps } from './input'

export interface MathInputProps extends Omit<
  InputProps,
  'type' | 'onChange' | 'value'
> {
  /**
   * Current display value (can be number or expression like "500+50")
   */
  value: string
  /**
   * Called when value changes.
   * - While typing: evaluated is null
   * - On blur/Enter with a valid amount: evaluated contains the result,
   *   rounded to kopecks
   */
  onValueChange: (value: string, evaluated: number | null) => void
  /**
   * Accept zero. Negative amounts are always invalid.
   */
  allowZero?: boolean
  /**
   * Inclusive upper bound; defaults to MAX_MONEY_AMOUNT (100 000 000).
   */
  max?: number
}

/**
 * Amount input that accepts numbers with thousands spaces and decimal comma
 * or dot, and expressions like "500+50". On blur or Enter a valid amount is
 * evaluated, rounded to kopecks, and emitted; an invalid one shows an inline
 * error instead. Enter inside a form then submits the form; outside a form it
 * blurs the input.
 *
 * Forms decide whether the submit button is enabled with
 * `parseAmountInput(value)` on the raw value, so validity follows typing.
 */
export const MathInput = forwardRef<HTMLInputElement, MathInputProps>(
  (
    {
      value,
      onValueChange,
      allowZero,
      max,
      onBlur,
      onKeyDown,
      error,
      ...props
    },
    ref
  ) => {
    const [showError, setShowError] = useState(false)
    const parsed = parseAmountInput(value, { allowZero, max })
    const inlineError =
      showError && !parsed.ok && parsed.reason !== 'empty'
        ? parsed.error
        : undefined
    const shownError = error ?? inlineError

    const commit = useCallback((): boolean => {
      if (parsed.ok) {
        setShowError(false)
        onValueChange(parsed.display, parsed.value)
        return true
      }
      setShowError(true)
      return false
    }, [parsed, onValueChange])

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        commit()
        onBlur?.(e)
      },
      [commit, onBlur]
    )

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          // The form is submitted explicitly below, only for a valid amount.
          e.preventDefault()
          const input = e.currentTarget
          if (commit()) {
            if (input.form) {
              input.form.requestSubmit()
            } else {
              input.blur()
            }
          }
        }
        onKeyDown?.(e)
      },
      [commit, onKeyDown]
    )

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setShowError(false)
        onValueChange(e.target.value, null)
      },
      [onValueChange]
    )

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
        error={shownError}
        aria-invalid={shownError ? true : props['aria-invalid']}
      />
    )
  }
)

MathInput.displayName = 'MathInput'
