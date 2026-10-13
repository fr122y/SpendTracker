// DELIBERATE FAILURE. This test exists only to prove that the merge gate on
// `main` blocks a Pull Request with a failing unit test. It must never be
// merged.
describe('guardrail proof', () => {
  it('fails on purpose to prove the merge gate', () => {
    expect(1 + 1).toBe(3)
  })
})
