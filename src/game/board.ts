import { BOARD_SIZE, shipLength } from './ships'
import type { Board, Coord, Orientation, PlacedShip, ShipType, ShotMark } from './types'

export function createBoard(): Board {
  return { ships: [], shots: emptyShots() }
}

export function emptyShots(): ShotMark[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array<ShotMark>(BOARD_SIZE).fill('none'))
}

export function isOnBoard({ row, col }: Coord): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE
  )
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col
}

/** The cells a ship would cover. Cells may be off the board; no wrapping is applied. */
export function shipCells(start: Coord, length: number, orientation: Orientation): Coord[] {
  return Array.from({ length }, (_, i) =>
    orientation === 'horizontal'
      ? { row: start.row, col: start.col + i }
      : { row: start.row + i, col: start.col },
  )
}

export function shipAt(board: Board, coord: Coord): PlacedShip | undefined {
  return board.ships.find((ship) => ship.cells.some((c) => sameCoord(c, coord)))
}

/**
 * A placement is valid when every cell is on the board and none overlaps
 * another ship. A ship of the same type already on the board is ignored,
 * so a placed ship can be moved.
 */
export function isValidPlacement(
  board: Board,
  type: ShipType,
  start: Coord,
  orientation: Orientation,
): boolean {
  const cells = shipCells(start, shipLength(type), orientation)
  const others = board.ships.filter((s) => s.type !== type)
  return cells.every(
    (cell) => isOnBoard(cell) && !others.some((s) => s.cells.some((c) => sameCoord(c, cell))),
  )
}

/** Returns a new board with the ship placed (replacing any ship of the same type), or null if invalid. */
export function placeShip(
  board: Board,
  type: ShipType,
  start: Coord,
  orientation: Orientation,
): Board | null {
  if (!isValidPlacement(board, type, start, orientation)) return null
  const ship: PlacedShip = {
    type,
    start,
    orientation,
    cells: shipCells(start, shipLength(type), orientation),
  }
  return { ...board, ships: [...board.ships.filter((s) => s.type !== type), ship] }
}

export function isSunk(board: Board, ship: PlacedShip): boolean {
  return ship.cells.every((c) => board.shots[c.row][c.col] === 'hit')
}
