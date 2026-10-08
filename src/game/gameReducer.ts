import { chooseShot, createAiState, recordResult, type AiState } from './ai'
import { createBoard, placeShip } from './board'
import { fireAt } from './firing'
import { isFleetComplete, randomFleet } from './placement'
import { createRng } from './rng'
import { FLEET } from './ships'
import type { Board, Coord, Orientation, ShipType, ShotResult } from './types'
import { allShipsSunk } from './win'

export type Phase = 'placement' | 'playing' | 'gameover'
export type Side = 'player' | 'computer'

export interface LogEntry {
  id: number
  shooter: Side
  coord: Coord
  result: ShotResult
  shipType?: ShipType
}

export interface GameState {
  /** Increments on every Play Again; computer moves scheduled for an older game are ignored. */
  gameId: number
  seed: number
  phase: Phase
  turn: Side
  winner: Side | null
  player: Board
  computer: Board
  ai: AiState
  /** RNG state for the computer's fleet and shots. */
  computerRng: number
  /** RNG state for the player's Randomize button, kept separate so it cannot change the computer's shots. */
  placementRng: number
  selectedShip: ShipType | null
  orientation: Orientation
  /** Newest first. */
  log: LogEntry[]
}

export type GameAction =
  | { type: 'SELECT_SHIP'; ship: ShipType }
  | { type: 'TOGGLE_ORIENTATION' }
  | { type: 'PLACE_SHIP'; start: Coord }
  | { type: 'RANDOMIZE' }
  | { type: 'RESET_PLACEMENT' }
  | { type: 'START' }
  | { type: 'PLAYER_FIRE'; coord: Coord }
  | { type: 'COMPUTER_FIRE'; gameId: number }
  | { type: 'PLAY_AGAIN'; seed: number }

export function createInitialState(seed: number, gameId = 0): GameState {
  const rng = createRng(seed)
  const computer = randomFleet(rng)
  return {
    gameId,
    seed,
    phase: 'placement',
    turn: 'player',
    winner: null,
    player: createBoard(),
    computer,
    ai: createAiState(),
    computerRng: rng.state,
    // Derive a second, independent stream from the seed.
    placementRng: (seed ^ 0x9e3779b9) >>> 0,
    selectedShip: FLEET[0].type,
    orientation: 'horizontal',
    log: [],
  }
}

function nextUnplaced(board: Board, after: ShipType | null): ShipType | null {
  const unplaced = FLEET.filter(({ type }) => !board.ships.some((s) => s.type === type))
  if (unplaced.length === 0) return null
  const startIndex = after ? FLEET.findIndex((s) => s.type === after) : -1
  return (unplaced.find((s) => FLEET.indexOf(s) > startIndex) ?? unplaced[0]).type
}

function logEntry(
  state: GameState,
  shooter: Side,
  coord: Coord,
  result: ShotResult,
  shipType?: ShipType,
): LogEntry {
  return { id: (state.log[0]?.id ?? 0) + 1, shooter, coord, result, shipType }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_SHIP':
      if (state.phase !== 'placement') return state
      return { ...state, selectedShip: action.ship }

    case 'TOGGLE_ORIENTATION':
      if (state.phase !== 'placement') return state
      return { ...state, orientation: state.orientation === 'horizontal' ? 'vertical' : 'horizontal' }

    case 'PLACE_SHIP': {
      if (state.phase !== 'placement' || !state.selectedShip) return state
      const player = placeShip(state.player, state.selectedShip, action.start, state.orientation)
      if (!player) return state
      return { ...state, player, selectedShip: nextUnplaced(player, state.selectedShip) }
    }

    case 'RANDOMIZE': {
      if (state.phase !== 'placement') return state
      const rng = createRng(state.placementRng)
      const player = randomFleet(rng)
      return { ...state, player, placementRng: rng.state, selectedShip: null }
    }

    case 'RESET_PLACEMENT':
      if (state.phase !== 'placement') return state
      return { ...state, player: createBoard(), selectedShip: FLEET[0].type }

    case 'START':
      if (state.phase !== 'placement' || !isFleetComplete(state.player)) return state
      return { ...state, phase: 'playing', turn: 'player', selectedShip: null }

    case 'PLAYER_FIRE': {
      if (state.phase !== 'playing' || state.turn !== 'player') return state
      const outcome = fireAt(state.computer, action.coord)
      // Repeated or off-board shots are ignored and do not use up the turn.
      if (!outcome.ok) return state
      const won = allShipsSunk(outcome.board)
      return {
        ...state,
        computer: outcome.board,
        turn: won ? 'player' : 'computer',
        phase: won ? 'gameover' : 'playing',
        winner: won ? 'player' : null,
        log: [logEntry(state, 'player', action.coord, outcome.result, outcome.shipType), ...state.log],
      }
    }

    case 'COMPUTER_FIRE': {
      if (action.gameId !== state.gameId || state.phase !== 'playing' || state.turn !== 'computer') {
        return state
      }
      const rng = createRng(state.computerRng)
      // The AI decides from its own knowledge only; the player's board is consulted
      // afterwards, the same way a human opponent would announce the result.
      const { coord } = chooseShot(state.ai, rng)
      const outcome = fireAt(state.player, coord)
      if (!outcome.ok) throw new Error(`Computer chose an invalid shot (${outcome.reason})`)
      const won = allShipsSunk(outcome.board)
      return {
        ...state,
        player: outcome.board,
        ai: recordResult(state.ai, coord, outcome.result, outcome.shipType),
        computerRng: rng.state,
        turn: won ? 'computer' : 'player',
        phase: won ? 'gameover' : 'playing',
        winner: won ? 'computer' : null,
        log: [logEntry(state, 'computer', coord, outcome.result, outcome.shipType), ...state.log],
      }
    }

    case 'PLAY_AGAIN':
      return createInitialState(action.seed, state.gameId + 1)
  }
}
