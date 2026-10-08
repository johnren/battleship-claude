import { describe, expect, it } from 'vitest'
import { createBoard, placeShip } from './board'
import { fireAt } from './firing'
import { FLEET } from './ships'
import type { Board } from './types'
import { allShipsSunk } from './win'

/** One ship per row, each starting in column 1 (A1, B1, ...). */
function fullFleet(): Board {
  return FLEET.reduce<Board>(
    (board, { type }, i) => placeShip(board, type, { row: i, col: 0 }, 'horizontal')!,
    createBoard(),
  )
}

function fire(board: Board, row: number, col: number) {
  const outcome = fireAt(board, { row, col })
  if (!outcome.ok) throw new Error(`shot rejected: ${outcome.reason}`)
  return outcome
}

describe('fireAt', () => {
  it('reports a miss on water', () => {
    const outcome = fire(fullFleet(), 9, 9)
    expect(outcome.result).toBe('miss')
    expect(outcome.shipType).toBeUndefined()
    expect(outcome.board.shots[9][9]).toBe('miss')
  })

  it('reports a hit with the ship type', () => {
    const outcome = fire(fullFleet(), 0, 2)
    expect(outcome.result).toBe('hit')
    expect(outcome.shipType).toBe('Carrier')
    expect(outcome.board.shots[0][2]).toBe('hit')
  })

  it('rejects a repeated shot at a hit or a miss without changing the board', () => {
    const afterHit = fire(fullFleet(), 0, 0).board
    expect(fireAt(afterHit, { row: 0, col: 0 })).toEqual({ ok: false, reason: 'repeat' })
    const afterMiss = fire(afterHit, 9, 9).board
    expect(fireAt(afterMiss, { row: 9, col: 9 })).toEqual({ ok: false, reason: 'repeat' })
  })

  it('rejects shots off the board', () => {
    const board = fullFleet()
    for (const coord of [
      { row: -1, col: 0 },
      { row: 0, col: -1 },
      { row: 10, col: 0 },
      { row: 0, col: 10 },
      { row: 1.5, col: 0 },
    ]) {
      expect(fireAt(board, coord)).toEqual({ ok: false, reason: 'off-board' })
    }
  })

  it('does not mutate the original board', () => {
    const board = fullFleet()
    fire(board, 0, 0)
    expect(board.shots[0][0]).toBe('none')
  })
})

describe('sunk detection', () => {
  for (const [i, { type, length }] of FLEET.entries()) {
    it(`reports the ${type} sunk only on its last cell`, () => {
      let board = fullFleet()
      for (let col = 0; col < length; col++) {
        const outcome = fire(board, i, col)
        board = outcome.board
        expect(outcome.shipType).toBe(type)
        expect(outcome.result).toBe(col === length - 1 ? 'sunk' : 'hit')
      }
    })
  }

  it('reports sunk regardless of the order cells were hit', () => {
    let board = fullFleet()
    board = fire(board, 2, 2).board
    board = fire(board, 2, 0).board
    expect(fire(board, 2, 1).result).toBe('sunk')
  })

  it('does not count hits on a neighbouring ship', () => {
    let board = fullFleet()
    // Hit the Battleship (row 1) fully except one cell, plus the touching Carrier cells.
    for (const col of [0, 1, 2]) board = fire(board, 1, col).board
    for (const col of [0, 1, 2, 3]) board = fire(board, 0, col).board
    expect(fire(board, 1, 3).result).toBe('sunk')
  })
})

describe('win detection', () => {
  it('is false until all 17 ship cells are hit, then true', () => {
    let board = fullFleet()
    const shipCells = board.ships.flatMap((s) => s.cells)
    expect(shipCells).toHaveLength(17)
    for (const [i, c] of shipCells.entries()) {
      expect(allShipsSunk(board)).toBe(false)
      board = fire(board, c.row, c.col).board
      expect(allShipsSunk(board)).toBe(i === shipCells.length - 1)
    }
  })

  it('misses never win the game', () => {
    let board = fullFleet()
    for (let col = 0; col < 10; col++) board = fire(board, 9, col).board
    expect(allShipsSunk(board)).toBe(false)
  })

  it('is false for an empty board', () => {
    expect(allShipsSunk(createBoard())).toBe(false)
  })
})
