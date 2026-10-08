import { isOnBoard, isSunk, shipAt } from './board'
import type { Board, Coord, ShipType, ShotResult } from './types'

export type FireOutcome =
  | { ok: true; board: Board; result: ShotResult; shipType?: ShipType }
  | { ok: false; reason: 'off-board' | 'repeat' }

/** Fires at a cell. Off-board and repeated shots are rejected and leave the board unchanged. */
export function fireAt(board: Board, coord: Coord): FireOutcome {
  if (!isOnBoard(coord)) return { ok: false, reason: 'off-board' }
  if (board.shots[coord.row][coord.col] !== 'none') return { ok: false, reason: 'repeat' }

  const ship = shipAt(board, coord)
  const shots = board.shots.map((row, r) =>
    r === coord.row ? row.map((mark, c) => (c === coord.col ? (ship ? 'hit' : 'miss') : mark)) : row,
  )
  const next: Board = { ...board, shots }
  if (!ship) return { ok: true, board: next, result: 'miss' }
  return { ok: true, board: next, result: isSunk(next, ship) ? 'sunk' : 'hit', shipType: ship.type }
}
