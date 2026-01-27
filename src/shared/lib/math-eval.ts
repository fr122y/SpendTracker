/**
 * Safe math expression evaluator using recursive descent parsing.
 * Supports: +, -, *, /, parentheses, decimals (both . and , as separators)
 * Does NOT use eval() for security.
 */

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'lparen' }
  | { type: 'rparen' }

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = []
  // Normalize: remove spaces, replace comma with dot for decimals
  const normalized = expr.replace(/\s/g, '').replace(/,/g, '.')
  let i = 0

  while (i < normalized.length) {
    const char = normalized[i]

    // Number (including decimals)
    if (
      /[\d.]/.test(char) ||
      (char === '-' &&
        (tokens.length === 0 ||
          tokens[tokens.length - 1].type === 'lparen' ||
          tokens[tokens.length - 1].type === 'operator'))
    ) {
      let numStr = ''

      // Handle leading minus for negative numbers
      if (char === '-') {
        numStr = '-'
        i++
      }

      while (i < normalized.length && /[\d.]/.test(normalized[i])) {
        numStr += normalized[i]
        i++
      }

      const value = parseFloat(numStr)
      if (isNaN(value)) {
        return null
      }
      tokens.push({ type: 'number', value })
      continue
    }

    // Operators
    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'operator', value: char })
      i++
      continue
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'lparen' })
      i++
      continue
    }

    if (char === ')') {
      tokens.push({ type: 'rparen' })
      i++
      continue
    }

    // Unknown character
    return null
  }

  return tokens
}

class Parser {
  private tokens: Token[]
  private pos: number = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private current(): Token | undefined {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    return this.tokens[this.pos++]
  }

  // Grammar:
  // expression = term (('+' | '-') term)*
  // term = factor (('*' | '/') factor)*
  // factor = number | '(' expression ')'

  parse(): number {
    const result = this.expression()
    if (this.current() !== undefined) {
      // Unexpected tokens remaining
      return NaN
    }
    return result
  }

  private expression(): number {
    let result = this.term()

    while (this.current()?.type === 'operator') {
      const op = this.current() as {
        type: 'operator'
        value: '+' | '-' | '*' | '/'
      }
      if (op.value !== '+' && op.value !== '-') {
        break
      }
      this.consume()
      const right = this.term()
      if (op.value === '+') {
        result += right
      } else {
        result -= right
      }
    }

    return result
  }

  private term(): number {
    let result = this.factor()

    while (this.current()?.type === 'operator') {
      const op = this.current() as {
        type: 'operator'
        value: '+' | '-' | '*' | '/'
      }
      if (op.value !== '*' && op.value !== '/') {
        break
      }
      this.consume()
      const right = this.factor()
      if (op.value === '*') {
        result *= right
      } else {
        result /= right
      }
    }

    return result
  }

  private factor(): number {
    const token = this.current()

    if (!token) {
      return NaN
    }

    if (token.type === 'number') {
      this.consume()
      return token.value
    }

    if (token.type === 'lparen') {
      this.consume() // consume '('
      const result = this.expression()
      if (this.current()?.type !== 'rparen') {
        return NaN // unmatched parenthesis
      }
      this.consume() // consume ')'
      return result
    }

    return NaN
  }
}

/**
 * Evaluates a mathematical expression string safely.
 *
 * @param expr - Mathematical expression (e.g., "500+50", "(100+50)*2")
 * @returns The evaluated result, or NaN for invalid expressions
 *
 * @example
 * evaluateMathExpression('5+3')      // 8
 * evaluateMathExpression('2+3*4')    // 14
 * evaluateMathExpression('(2+3)*4')  // 20
 * evaluateMathExpression('10.5+0.5') // 11
 * evaluateMathExpression('abc')      // NaN
 */
export function evaluateMathExpression(expr: string): number {
  if (!expr || expr.trim() === '') {
    return NaN
  }

  const tokens = tokenize(expr)
  if (!tokens || tokens.length === 0) {
    return NaN
  }

  const parser = new Parser(tokens)
  return parser.parse()
}
