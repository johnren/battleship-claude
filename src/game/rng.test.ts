import { describe, expect, it } from 'vitest'
import { createRng, randomInt } from './rng'

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(123)
    const b = createRng(123)
    for (let i = 0; i < 50; i++) expect(a.next()).toBe(b.next())
  })

  it('produces different sequences for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next())
  })

  it('can resume from a saved state', () => {
    const a = createRng(42)
    a.next()
    const resumed = createRng(a.state)
    expect(resumed.next()).toBe(a.next())
  })

  it('stays within range', () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const n = randomInt(rng, 10)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(10)
    }
  })
})
