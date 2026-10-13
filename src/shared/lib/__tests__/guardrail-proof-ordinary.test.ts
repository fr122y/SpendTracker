// Deliberate guardrail proof (GUARDRAILS-01 step 6.2): this file must never be merged.
describe('guardrail proof: ordinary change', () => {
  it('passes trivially', () => {
    expect(1 + 1).toBe(2)
  })
})
