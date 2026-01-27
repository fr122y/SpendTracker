import { evaluateMathExpression } from '../math-eval'

describe('evaluateMathExpression', () => {
  describe('basic operations', () => {
    it('should add two numbers', () => {
      expect(evaluateMathExpression('5+3')).toBe(8)
    })

    it('should subtract two numbers', () => {
      expect(evaluateMathExpression('10-3')).toBe(7)
    })

    it('should multiply two numbers', () => {
      expect(evaluateMathExpression('4*5')).toBe(20)
    })

    it('should divide two numbers', () => {
      expect(evaluateMathExpression('100/4')).toBe(25)
    })
  })

  describe('operator precedence', () => {
    it('should respect multiplication before addition', () => {
      expect(evaluateMathExpression('2+3*4')).toBe(14)
    })

    it('should respect division before subtraction', () => {
      expect(evaluateMathExpression('20-10/2')).toBe(15)
    })

    it('should handle mixed operations correctly', () => {
      expect(evaluateMathExpression('2+3*4-6/2')).toBe(11)
    })
  })

  describe('parentheses', () => {
    it('should evaluate expressions in parentheses first', () => {
      expect(evaluateMathExpression('(2+3)*4')).toBe(20)
    })

    it('should handle nested parentheses', () => {
      expect(evaluateMathExpression('((2+3)*2)*2')).toBe(20)
    })

    it('should handle complex parentheses', () => {
      expect(evaluateMathExpression('(100+50)*2/3')).toBe(100)
    })
  })

  describe('decimal numbers', () => {
    it('should handle decimal addition', () => {
      expect(evaluateMathExpression('10.5+0.5')).toBe(11)
    })

    it('should handle decimal multiplication', () => {
      expect(evaluateMathExpression('2.5*4')).toBe(10)
    })

    it('should handle decimal division', () => {
      expect(evaluateMathExpression('7.5/2.5')).toBe(3)
    })
  })

  describe('whitespace handling', () => {
    it('should ignore spaces', () => {
      expect(evaluateMathExpression('5 + 3')).toBe(8)
    })

    it('should ignore multiple spaces', () => {
      expect(evaluateMathExpression('  10  *   2  ')).toBe(20)
    })
  })

  describe('negative numbers', () => {
    it('should handle negative result', () => {
      expect(evaluateMathExpression('5-10')).toBe(-5)
    })

    it('should handle leading negative number', () => {
      expect(evaluateMathExpression('-5+10')).toBe(5)
    })

    it('should handle negative in parentheses', () => {
      expect(evaluateMathExpression('(-5)*2')).toBe(-10)
    })
  })

  describe('edge cases', () => {
    it('should return the number for single number input', () => {
      expect(evaluateMathExpression('42')).toBe(42)
    })

    it('should return NaN for invalid expression', () => {
      expect(evaluateMathExpression('abc')).toBeNaN()
    })

    it('should return NaN for empty string', () => {
      expect(evaluateMathExpression('')).toBeNaN()
    })

    it('should return Infinity for division by zero', () => {
      expect(evaluateMathExpression('5/0')).toBe(Infinity)
    })

    it('should return NaN for incomplete expression', () => {
      expect(evaluateMathExpression('5+')).toBeNaN()
    })

    it('should return NaN for unmatched parentheses', () => {
      expect(evaluateMathExpression('(5+3')).toBeNaN()
    })

    it('should handle Russian decimal separator (comma)', () => {
      expect(evaluateMathExpression('10,5+0,5')).toBe(11)
    })
  })
})
