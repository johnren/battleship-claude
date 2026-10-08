import { createBoard, placeShip } from './board'
import { randomInt, type Rng } from './rng'
import { BOARD_SIZE, FLEET } from './ships'
import type { Board, Orientation } from './types'

/** Places the whole fleet at random, valid positions. Uses the same validation as manual placement. */
export function randomFleet(rng: Rng): Board {
  let board = createBoard()
  for (const { type } of FLEET) {
    for (;;) {
      const orientation: Orientation = rng.next() < 0.5 ? 'horizontal' : 'vertical'
      const start = { row: randomInt(rng, BOARD_SIZE), col: randomInt(rng, BOARD_SIZE) }
      const next = placeShip(board, type, start, orientation)
      if (next) {
        board = next
        break
      }
    }
  }
  return board
}

export function isFleetComplete(board: Board): boolean {
  return FLEET.every(({ type }) => board.ships.some((s) => s.type === type))
}
