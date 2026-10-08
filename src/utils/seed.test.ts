import { describe, expect, it } from 'vitest'
import { seedFromQuery } from './seed'

describe('seedFromQuery', () => {
  it('reads an integer seed', () => {
    expect(seedFromQuery('?seed=123')).toBe(123)
    expect(seedFromQuery('?foo=1&seed=7')).toBe(7)
  })

  it('ignores a missing or non-numeric seed', () => {
    expect(seedFromQuery('')).toBeNull()
    expect(seedFromQuery('?seed=')).toBeNull()
    expect(seedFromQuery('?seed=abc')).toBeNull()
    expect(seedFromQuery('?seed=1.5')).toBeNull()
  })
})
