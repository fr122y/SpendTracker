/**
 * Mark an element with this attribute (as a React prop: `{...HIDES_CALCULATOR_PROPS}`)
 * to hide the floating calculator button while the element is in the page, for
 * example a form whose full-width submit button the floating button would cover.
 */
export const HIDES_CALCULATOR_ATTRIBUTE = 'data-hides-calculator'

export const HIDES_CALCULATOR_PROPS = { [HIDES_CALCULATOR_ATTRIBUTE]: '' }
