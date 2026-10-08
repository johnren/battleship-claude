import { isSunk } from './board'
import { FLEET } from './ships'
import type { Board } from './types'

/** True when the board holds a full fleet and every ship cell has been hit. */
export function allShipsSunk(board: Board): boolean {
  return board.ships.length === FLEET.length && board.ships.every((ship) => isSunk(board, ship))
}
