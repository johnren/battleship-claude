import { describe, expect, it } from 'vitest'
import { chooseShot, createAiState, hasUnresolvedHits, recordResult, type AiState } from './ai'
import { createBoard, isOnBoard, isSunk, placeShip, sameCoord } from './board'
import { fireAt } from './firing'
import { randomFleet } from './placement'
import { createRng } from './rng'
import type { Board, Coord } from './types'
import { allShipsSunk } from './win'

interface GameStats {
  shots: number
  huntWithUnsunkHits: number
}

/** Plays a full game of the computer against a random fleet, checking its invariants on every shot. */
function simulateGame(seed: number): GameStats {
  const rng = createRng(seed)
  let board = randomFleet(createRng(seed + 10_000))
  let ai = createAiState()
  const fired: Coord[] = []
  let huntWithUnsunkHits = 0

  while (!allShipsSunk(board)) {
    if (fired.length >= 100) throw new Error('more than 100 shots')
    const { coord, mode } = chooseShot(ai, rng)

    expect(isOnBoard(coord), `seed ${seed}: off-board shot ${JSON.stringify(coord)}`).toBe(true)
    expect(
      fired.some((c) => sameCoord(c, coord)),
      `seed ${seed}: repeated shot ${JSON.stringify(coord)}`,
    ).toBe(false)

    if (mode === 'hunt') {
      // Referee check (the AI itself never sees this): every hit so far belongs to a sunk ship.
      const unsunkHit = board.ships.some(
        (ship) => !isSunk(board, ship) && ship.cells.some((c) => board.shots[c.row][c.col] === 'hit'),
      )
      if (unsunkHit) huntWithUnsunkHits++
    }

    fired.push(coord)
    const outcome = fireAt(board, coord)
    if (!outcome.ok) throw new Error(`seed ${seed}: shot rejected (${outcome.reason})`)
    board = outcome.board
    ai = recordResult(ai, coord, outcome.result, outcome.shipType)
  }
  return { shots: fired.length, huntWithUnsunkHits }
}

describe('computer opponent over 100 full games', () => {
  const results = Array.from({ length: 100 }, (_, seed) => simulateGame(seed))

  it('never repeats a shot or fires off the board, and always finishes', () => {
    // Assertions run inside simulateGame; reaching here means all 100 games ended.
    expect(results).toHaveLength(100)
    for (const r of results) expect(r.shots).toBeLessThanOrEqual(100)
  })

  it('never returns to hunt mode while a ship it has hit is still afloat', () => {
    expect(results.map((r) => r.huntWithUnsunkHits)).toEqual(Array(100).fill(0))
  })

  it('plays noticeably better than random fire', () => {
    const average = results.reduce((sum, r) => sum + r.shots, 0) / results.length
    // Random fire averages about 96 shots; hunt/target is typically 60–65.
    expect(average).toBeLessThan(75)
  })
})

function aiAfter(
  shots: [Coord, 'miss' | 'hit' | 'sunk', ('Destroyer' | 'Cruiser' | 'Submarine')?][],
): AiState {
  return shots.reduce((ai, [coord, result, ship]) => recordResult(ai, coord, result, ship), createAiState())
}

describe('hunt mode', () => {
  it('fires only at checkerboard cells while hunting', () => {
    const rng = createRng(5)
    let ai = createAiState()
    for (let i = 0; i < 50; i++) {
      const { coord, mode } = chooseShot(ai, rng)
      expect(mode).toBe('hunt')
      expect((coord.row + coord.col) % 2).toBe(0)
      ai = recordResult(ai, coord, 'miss')
    }
  })

  it('falls back to remaining cells once the checkerboard is used up', () => {
    let ai = createAiState()
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if ((row + col) % 2 === 0 || (row === 9 && col === 0)) continue
        ai = recordResult(ai, { row, col }, 'miss')
      }
    }
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if ((row + col) % 2 === 0) ai = recordResult(ai, { row, col }, 'miss')
      }
    }
    expect(chooseShot(ai, createRng(1))).toEqual({ coord: { row: 9, col: 0 }, mode: 'hunt' })
  })
})

describe('target mode', () => {
  it('tries the four neighbours after a single hit', () => {
    const ai = aiAfter([[{ row: 4, col: 4 }, 'hit']])
    const neighbours = [
      { row: 3, col: 4 },
      { row: 5, col: 4 },
      { row: 4, col: 3 },
      { row: 4, col: 5 },
    ]
    for (let seed = 0; seed < 20; seed++) {
      const shot = chooseShot(ai, createRng(seed))
      expect(shot.mode).toBe('target')
      expect(neighbours).toContainEqual(shot.coord)
    }
  })

  it('stays on the board when the hit is in a corner', () => {
    const ai = aiAfter([[{ row: 0, col: 0 }, 'hit']])
    for (let seed = 0; seed < 20; seed++) {
      expect([
        { row: 1, col: 0 },
        { row: 0, col: 1 },
      ]).toContainEqual(chooseShot(ai, createRng(seed)).coord)
    }
  })

  it('continues along a line of two hits in both directions', () => {
    const ai = aiAfter([
      [{ row: 4, col: 4 }, 'hit'],
      [{ row: 4, col: 5 }, 'hit'],
    ])
    for (let seed = 0; seed < 20; seed++) {
      expect([
        { row: 4, col: 3 },
        { row: 4, col: 6 },
      ]).toContainEqual(chooseShot(ai, createRng(seed)).coord)
    }
  })

  it('reverses direction when one end of the line is a miss', () => {
    const ai = aiAfter([
      [{ row: 4, col: 4 }, 'hit'],
      [{ row: 4, col: 5 }, 'hit'],
      [{ row: 4, col: 6 }, 'miss'],
    ])
    expect(chooseShot(ai, createRng(1)).coord).toEqual({ row: 4, col: 3 })
  })

  it('returns to hunt mode after a sink when no other hits remain', () => {
    const ai = aiAfter([
      [{ row: 4, col: 4 }, 'hit'],
      [{ row: 4, col: 5 }, 'sunk', 'Destroyer'],
    ])
    expect(hasUnresolvedHits(ai)).toBe(false)
    expect(chooseShot(ai, createRng(1)).mode).toBe('hunt')
  })

  it('keeps targeting other hits that remain after a sink', () => {
    // A Cruiser at E4–E6 (row 4) and a Destroyer touching it at F5–G5.
    const ai = aiAfter([
      [{ row: 4, col: 4 }, 'hit'],
      [{ row: 5, col: 4 }, 'hit'], // belongs to the Destroyer
      [{ row: 4, col: 5 }, 'hit'],
      [{ row: 4, col: 3 }, 'sunk', 'Cruiser'],
    ])
    expect(hasUnresolvedHits(ai)).toBe(true)
    expect(ai.unresolved).toEqual([{ row: 5, col: 4 }])
    const shot = chooseShot(ai, createRng(1))
    expect(shot.mode).toBe('target')
    expect([
      { row: 6, col: 4 },
      { row: 5, col: 3 },
      { row: 5, col: 5 },
    ]).toContainEqual(shot.coord)
  })

  it('keeps targeting when it cannot tell which hits the sunk ship covered', () => {
    // A Destroyer (A1–B1) beside a Submarine (A2–C2). Sinking the Destroyer at B1
    // makes the AI attribute B1–B2 to it (wrongly), but it still knows two hits
    // are unaccounted for.
    let board: Board = createBoard()
    board = placeShip(board, 'Destroyer', { row: 0, col: 0 }, 'vertical')!
    board = placeShip(board, 'Submarine', { row: 0, col: 1 }, 'vertical')!
    let ai = createAiState()
    for (const coord of [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 0 },
    ]) {
      const outcome = fireAt(board, coord)
      if (!outcome.ok) throw new Error('rejected')
      board = outcome.board
      ai = recordResult(ai, coord, outcome.result, outcome.shipType)
    }
    expect(hasUnresolvedHits(ai)).toBe(true)
    expect(chooseShot(ai, createRng(1)).mode).toBe('target')

    // Sinking the Submarine accounts for every hit, so it hunts again even
    // though its guess about which cells belonged to which ship was wrong.
    const outcome = fireAt(board, { row: 2, col: 1 })
    if (!outcome.ok) throw new Error('rejected')
    expect(outcome.result).toBe('sunk')
    ai = recordResult(ai, { row: 2, col: 1 }, outcome.result, outcome.shipType)
    expect(hasUnresolvedHits(ai)).toBe(false)
    expect(chooseShot(ai, createRng(1)).mode).toBe('hunt')
  })
})

describe('fair play', () => {
  it('chooses shots from its own knowledge only', () => {
    // chooseShot takes no board; the same knowledge always gives the same shot,
    // whatever the opponent's fleet looks like.
    expect(chooseShot.length).toBe(2)
    const ai = aiAfter([[{ row: 2, col: 2 }, 'miss']])
    expect(chooseShot(ai, createRng(9))).toEqual(chooseShot(ai, createRng(9)))
  })
})
