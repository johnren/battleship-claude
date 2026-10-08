import { describe, expect, it } from 'vitest'
import { createBoard, isValidPlacement, placeShip, shipCells } from './board'
import { FLEET } from './ships'
import type { Orientation } from './types'

const orientations: Orientation[] = ['horizontal', 'vertical']

describe('shipCells', () => {
  it('extends right for horizontal ships and down for vertical ships', () => {
    expect(shipCells({ row: 2, col: 3 }, 3, 'horizontal')).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ])
    expect(shipCells({ row: 2, col: 3 }, 2, 'vertical')).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ])
  })
})

describe('isValidPlacement on an empty board', () => {
  const board = createBoard()

  for (const { type, length } of FLEET) {
    describe(`${type} (${length})`, () => {
      it('fits flush against every edge', () => {
        // Left and top edges.
        expect(isValidPlacement(board, type, { row: 0, col: 0 }, 'horizontal')).toBe(true)
        expect(isValidPlacement(board, type, { row: 0, col: 0 }, 'vertical')).toBe(true)
        // Right edge: last cell in column 10.
        expect(isValidPlacement(board, type, { row: 9, col: 10 - length }, 'horizontal')).toBe(true)
        // Bottom edge: last cell in row J.
        expect(isValidPlacement(board, type, { row: 10 - length, col: 9 }, 'vertical')).toBe(true)
      })

      it('rejects ships that hang off the right or bottom edge', () => {
        for (let row = 0; row < 10; row++) {
          expect(isValidPlacement(board, type, { row, col: 11 - length }, 'horizontal')).toBe(false)
        }
        for (let col = 0; col < 10; col++) {
          expect(isValidPlacement(board, type, { row: 11 - length, col }, 'vertical')).toBe(false)
        }
      })

      it('rejects starts off the left or top edge', () => {
        for (const o of orientations) {
          expect(isValidPlacement(board, type, { row: -1, col: 0 }, o)).toBe(false)
          expect(isValidPlacement(board, type, { row: 0, col: -1 }, o)).toBe(false)
          expect(isValidPlacement(board, type, { row: 10, col: 0 }, o)).toBe(false)
          expect(isValidPlacement(board, type, { row: 0, col: 10 }, o)).toBe(false)
        }
      })

      it('does not wrap from column 10 to column 1 or from row J to row A', () => {
        // Starting in the last column/row: the ship would need to wrap to fit.
        expect(isValidPlacement(board, type, { row: 3, col: 9 }, 'horizontal')).toBe(false)
        expect(isValidPlacement(board, type, { row: 9, col: 3 }, 'vertical')).toBe(false)
        const placed = placeShip(board, type, { row: 3, col: 9 }, 'horizontal')
        expect(placed).toBeNull()
      })
    })
  }

  it('checks every start position against the exact bounds', () => {
    for (const { type, length } of FLEET) {
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          expect(isValidPlacement(board, type, { row, col }, 'horizontal')).toBe(col + length <= 10)
          expect(isValidPlacement(board, type, { row, col }, 'vertical')).toBe(row + length <= 10)
        }
      }
    }
  })
})

describe('overlaps', () => {
  const withCarrier = placeShip(createBoard(), 'Carrier', { row: 4, col: 2 }, 'horizontal')!

  it('rejects a ship on the same cells', () => {
    expect(isValidPlacement(withCarrier, 'Battleship', { row: 4, col: 2 }, 'horizontal')).toBe(false)
  })

  it('rejects a crossing ship', () => {
    expect(isValidPlacement(withCarrier, 'Cruiser', { row: 3, col: 4 }, 'vertical')).toBe(false)
  })

  it('rejects a ship that overlaps only at its end', () => {
    expect(isValidPlacement(withCarrier, 'Destroyer', { row: 4, col: 6 }, 'horizontal')).toBe(false)
    expect(isValidPlacement(withCarrier, 'Destroyer', { row: 4, col: 1 }, 'horizontal')).toBe(false)
  })

  it('allows ships to touch', () => {
    expect(isValidPlacement(withCarrier, 'Destroyer', { row: 4, col: 7 }, 'horizontal')).toBe(true)
    expect(isValidPlacement(withCarrier, 'Battleship', { row: 5, col: 2 }, 'horizontal')).toBe(true)
    expect(isValidPlacement(withCarrier, 'Cruiser', { row: 1, col: 2 }, 'vertical')).toBe(true)
  })

  it('lets a placed ship be moved onto cells it already covers', () => {
    const moved = placeShip(withCarrier, 'Carrier', { row: 4, col: 3 }, 'horizontal')
    expect(moved?.ships).toHaveLength(1)
    expect(moved?.ships[0].start).toEqual({ row: 4, col: 3 })
  })

  it('does not mutate the original board', () => {
    const empty = createBoard()
    placeShip(empty, 'Carrier', { row: 0, col: 0 }, 'horizontal')
    expect(empty.ships).toHaveLength(0)
  })
})
