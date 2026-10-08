import { describe, expect, it } from 'vitest'
import { isOnBoard, sameCoord } from './board'
import { isFleetComplete, randomFleet } from './placement'
import { createRng } from './rng'
import { FLEET } from './ships'

describe('randomFleet', () => {
  it('always places all five ships validly', () => {
    for (let seed = 0; seed < 200; seed++) {
      const board = randomFleet(createRng(seed))
      expect(isFleetComplete(board)).toBe(true)
      const cells = board.ships.flatMap((s) => s.cells)
      expect(cells).toHaveLength(17)
      expect(cells.every(isOnBoard)).toBe(true)
      const unique = cells.filter((c, i) => cells.findIndex((d) => sameCoord(c, d)) === i)
      expect(unique).toHaveLength(17)
      for (const ship of board.ships) {
        const len = FLEET.find((s) => s.type === ship.type)!.length
        expect(ship.cells).toHaveLength(len)
        // Straight line, consecutive cells.
        ship.cells.forEach((c, i) => {
          const expected =
            ship.orientation === 'horizontal'
              ? { row: ship.start.row, col: ship.start.col + i }
              : { row: ship.start.row + i, col: ship.start.col }
          expect(c).toEqual(expected)
        })
      }
    }
  })

  it('is repeatable for a given seed', () => {
    expect(randomFleet(createRng(123))).toEqual(randomFleet(createRng(123)))
  })
})
