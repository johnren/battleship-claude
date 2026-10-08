import { describe, expect, it } from 'vitest'
import { toLabel } from './coords'

describe('toLabel', () => {
  it('converts 0-based coordinates to A–J / 1–10 labels', () => {
    expect(toLabel({ row: 0, col: 0 })).toBe('A1')
    expect(toLabel({ row: 1, col: 6 })).toBe('B7')
    expect(toLabel({ row: 9, col: 9 })).toBe('J10')
  })
})
