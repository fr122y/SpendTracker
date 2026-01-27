'use client'

import { forwardRef, useCallback, type KeyboardEvent } from 'react'

import { evaluateMathExpression } from '@/shared/lib/math-eval'

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
   * - On blur/Enter with valid expression: evaluated contains the result
   */
  onValueChange: (value: string, evaluated: number | null) => void
  /**
   * Minimum allowed value after evaluation
   */
  min?: number
  /**
   * Maximum allowed value after evaluation
   */
  max?: number
}

/**
 * Input component that supports mathematical expressions.
 * User can type expressions like "500+50" and on blur/Enter it evaluates to "550".
 *
 * @example
 * <MathInput
 *   value={amount}
 *   onValueChange={(value, evaluated) => {
 *     if (evaluated !== null) {
 *       setAmount(String(evaluated))
 *     } else {
 *       setAmount(value)
 *     }
 *   }}
 *   min={0}
 * />
 */
export const MathInput = forwardRef<HTMLInputElement, MathInputProps>(
  ({ value, onValueChange, min, max, onBlur, onKeyDown, ...props }, ref) => {
    const evaluateAndUpdate = useCallback(() => {
      // Check if the value looks like an expression (has operators)
      const hasOperators = /[+\-*/()]/.test(value)

      if (!hasOperators) {
        // Just a plain number, parse it
        const num = parseFloat(value.replace(',', '.'))
        if (!isNaN(num)) {
          let finalValue = num
          if (min !== undefined && finalValue < min) finalValue = min
          if (max !== undefined && finalValue > max) finalValue = max
          onValueChange(String(finalValue), finalValue)
        }
        return
      }

      // Evaluate the expression
      const result = evaluateMathExpression(value)

      if (!isNaN(result) && isFinite(result)) {
        let finalValue = result
        if (min !== undefined && finalValue < min) finalValue = min
        if (max !== undefined && finalValue > max) finalValue = max
        onValueChange(String(finalValue), finalValue)
      }
      // If invalid, keep the current value (user can fix it)
    }, [value, min, max, onValueChange])

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        evaluateAndUpdate()
        onBlur?.(e)
      },
      [evaluateAndUpdate, onBlur]
    )

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          evaluateAndUpdate()
          ;(e.target as HTMLInputElement).blur()
        }
        onKeyDown?.(e)
      },
      [evaluateAndUpdate, onKeyDown]
    )

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Pass value without evaluation while typing
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
      />
    )
  }
)

MathInput.displayName = 'MathInput'
