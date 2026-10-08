import { describe, expect, it } from 'vitest'
import { createInitialState, gameReducer, type GameAction, type GameState } from './gameReducer'
import { FLEET } from './ships'
import type { Coord } from './types'

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

function started(seed = 123): GameState {
  return run(createInitialState(seed), { type: 'RANDOMIZE' }, { type: 'START' })
}

/** A cell on the computer's board with no ship, found via the referee's view. */
function waterCell(state: GameState): Coord {
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (!state.computer.ships.some((s) => s.cells.some((c) => c.row === row && c.col === col))) {
        return { row, col }
      }
    }
  }
  throw new Error('no water')
}

describe('initial state', () => {
  it('places the computer fleet from the seed, repeatably', () => {
    const a = createInitialState(123)
    const b = createInitialState(123)
    expect(a.computer).toEqual(b.computer)
    expect(a.computer.ships).toHaveLength(5)
    expect(createInitialState(124).computer).not.toEqual(a.computer)
  })

  it('starts in placement with the player to fire first', () => {
    const s = createInitialState(1)
    expect(s.phase).toBe('placement')
    expect(s.turn).toBe('player')
    expect(s.player.ships).toHaveLength(0)
  })
})

describe('placement', () => {
  it('places the selected ship and selects the next unplaced one', () => {
    const s = run(createInitialState(1), { type: 'PLACE_SHIP', start: { row: 0, col: 0 } })
    expect(s.player.ships.map((x) => x.type)).toEqual(['Carrier'])
    expect(s.selectedShip).toBe('Battleship')
  })

  it('ignores an invalid placement', () => {
    const s0 = createInitialState(1)
    const s = run(s0, { type: 'PLACE_SHIP', start: { row: 0, col: 8 } })
    expect(s).toBe(s0)
  })

  it('rotates', () => {
    const s = run(
      createInitialState(1),
      { type: 'TOGGLE_ORIENTATION' },
      { type: 'PLACE_SHIP', start: { row: 0, col: 9 } },
    )
    expect(s.player.ships[0].orientation).toBe('vertical')
    expect(run(s, { type: 'TOGGLE_ORIENTATION' }).orientation).toBe('horizontal')
  })

  it('does not start until all five ships are placed', () => {
    let s = createInitialState(1)
    for (const [i, { type }] of FLEET.entries()) {
      expect(run(s, { type: 'START' }).phase).toBe('placement')
      s = run(s, { type: 'SELECT_SHIP', ship: type }, { type: 'PLACE_SHIP', start: { row: i, col: 0 } })
    }
    expect(run(s, { type: 'START' }).phase).toBe('playing')
  })

  it('randomizes a full fleet and resets it', () => {
    const s = run(createInitialState(1), { type: 'RANDOMIZE' })
    expect(s.player.ships).toHaveLength(5)
    const reset = run(s, { type: 'RESET_PLACEMENT' })
    expect(reset.player.ships).toHaveLength(0)
    expect(reset.selectedShip).toBe('Carrier')
  })

  it('randomizing does not change the computer fleet or its shots', () => {
    const once = run(createInitialState(5), { type: 'RANDOMIZE' })
    const twice = run(createInitialState(5), { type: 'RANDOMIZE' }, { type: 'RANDOMIZE' })
    expect(twice.computer).toEqual(once.computer)
    expect(twice.computerRng).toBe(once.computerRng)
  })

  it('ignores firing during placement', () => {
    const s0 = createInitialState(1)
    expect(run(s0, { type: 'PLAYER_FIRE', coord: { row: 0, col: 0 } })).toBe(s0)
  })
})

describe('turns', () => {
  it('passes the turn to the computer after a shot and back after its shot', () => {
    let s = started()
    s = run(s, { type: 'PLAYER_FIRE', coord: { row: 0, col: 0 } })
    expect(s.turn).toBe('computer')
    s = run(s, { type: 'COMPUTER_FIRE', gameId: s.gameId })
    expect(s.turn).toBe('player')
    expect(s.log).toHaveLength(2)
    expect(s.log[0].shooter).toBe('computer')
  })

  it('a hit does not grant an extra turn', () => {
    const s0 = started()
    const shipCell = s0.computer.ships[0].cells[0]
    const s = run(s0, { type: 'PLAYER_FIRE', coord: shipCell })
    expect(s.log[0].result).toBe('hit')
    expect(s.turn).toBe('computer')
  })

  it('rapid repeated clicks fire only one shot per turn', () => {
    const s0 = started()
    const s = run(
      s0,
      { type: 'PLAYER_FIRE', coord: { row: 0, col: 0 } },
      { type: 'PLAYER_FIRE', coord: { row: 0, col: 0 } },
      { type: 'PLAYER_FIRE', coord: { row: 5, col: 5 } },
    )
    expect(s.log).toHaveLength(1)
    expect(s.computer.shots.flat().filter((m) => m !== 'none')).toHaveLength(1)
  })

  it('a repeated shot is rejected and does not use up the turn', () => {
    let s = started()
    const cell = waterCell(s)
    s = run(s, { type: 'PLAYER_FIRE', coord: cell }, { type: 'COMPUTER_FIRE', gameId: s.gameId })
    const before = s
    s = run(s, { type: 'PLAYER_FIRE', coord: cell })
    expect(s).toBe(before)
    expect(s.turn).toBe('player')
  })

  it('ignores a computer move when it is not the computer’s turn', () => {
    const s0 = started()
    expect(run(s0, { type: 'COMPUTER_FIRE', gameId: s0.gameId })).toBe(s0)
  })

  it('reports sunk ships by name in the log', () => {
    let s = started()
    const destroyer = s.computer.ships.find((x) => x.type === 'Destroyer')!
    for (const cell of destroyer.cells) {
      s = run(s, { type: 'PLAYER_FIRE', coord: cell }, { type: 'COMPUTER_FIRE', gameId: s.gameId })
    }
    const playerShots = s.log.filter((e) => e.shooter === 'player')
    expect(playerShots[0]).toMatchObject({ result: 'sunk', shipType: 'Destroyer' })
  })
})

describe('game over', () => {
  it('the player wins after hitting all 17 enemy ship cells', () => {
    let s = started()
    const cells = s.computer.ships.flatMap((x) => x.cells)
    for (const cell of cells) {
      s = run(s, { type: 'PLAYER_FIRE', coord: cell })
      if (s.phase === 'gameover') break
      s = run(s, { type: 'COMPUTER_FIRE', gameId: s.gameId })
    }
    expect(s.phase).toBe('gameover')
    expect(s.winner).toBe('player')
    // No further moves are accepted.
    expect(run(s, { type: 'COMPUTER_FIRE', gameId: s.gameId })).toBe(s)
    expect(run(s, { type: 'PLAYER_FIRE', coord: waterCell(s) })).toBe(s)
  })

  it('the computer wins if the player keeps missing', () => {
    let s = started()
    const water: Coord[] = []
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (!s.computer.ships.some((x) => x.cells.some((c) => c.row === row && c.col === col))) {
          water.push({ row, col })
        }
      }
    }
    for (const cell of water) {
      s = run(s, { type: 'PLAYER_FIRE', coord: cell }, { type: 'COMPUTER_FIRE', gameId: s.gameId })
      if (s.phase === 'gameover') break
    }
    expect(s.winner).toBe('computer')
    expect(s.player.shots.flat().filter((m) => m === 'hit')).toHaveLength(17)
  })
})

describe('Play Again', () => {
  it('fully resets state', () => {
    let s = started(77)
    s = run(
      s,
      { type: 'PLAYER_FIRE', coord: { row: 3, col: 3 } },
      { type: 'COMPUTER_FIRE', gameId: s.gameId },
    )
    const again = run(s, { type: 'PLAY_AGAIN', seed: 77 })
    expect(again).toEqual(createInitialState(77, s.gameId + 1))
    expect(again.phase).toBe('placement')
    expect(again.log).toEqual([])
    expect(again.player.ships).toEqual([])
    expect(again.ai.totalHits).toBe(0)
    expect(again.ai.shots.flat().every((m) => m === 'none')).toBe(true)
  })

  it('cancels a pending computer move', () => {
    let s = started()
    s = run(s, { type: 'PLAYER_FIRE', coord: { row: 0, col: 0 } })
    expect(s.turn).toBe('computer')
    // The computer's move was scheduled for this game...
    const pending: GameAction = { type: 'COMPUTER_FIRE', gameId: s.gameId }
    // ...then the player starts a new game and plays into its first turn.
    s = run(s, { type: 'PLAY_AGAIN', seed: 1 }, { type: 'RANDOMIZE' }, { type: 'START' })
    s = run(s, { type: 'PLAYER_FIRE', coord: { row: 9, col: 9 } })
    expect(s.turn).toBe('computer')
    // The stale move arrives late and must be ignored.
    const after = run(s, pending)
    expect(after).toBe(s)
    expect(after.player.shots.flat().every((m) => m === 'none')).toBe(true)
  })
})
