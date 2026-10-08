import { isSunk, sameCoord, shipAt } from '../game/board'
import type { Board, Coord } from '../game/types'
import { toLabel } from '../utils/coords'

export type CellState = 'water' | 'ship' | 'miss' | 'hit' | 'sunk'

export interface CellView {
  coord: Coord
  state: CellState
  preview?: 'valid' | 'invalid'
  /** Accessible label, e.g. "B7, miss". */
  label: string
}

export interface Preview {
  cells: Coord[]
  valid: boolean
}

function grid(build: (coord: Coord) => CellView): CellView[][] {
  return Array.from({ length: 10 }, (_, row) => Array.from({ length: 10 }, (_, col) => build({ row, col })))
}

/** The player's own board: ships are always visible. */
export function playerCells(board: Board, preview?: Preview): CellView[][] {
  return grid((coord) => {
    const ship = shipAt(board, coord)
    const mark = board.shots[coord.row][coord.col]
    let state: CellState = ship ? 'ship' : 'water'
    let description = ship ? `your ${ship.type}` : 'water'
    if (mark === 'miss') {
      state = 'miss'
      description = 'miss'
    } else if (ship && mark === 'hit') {
      const sunk = isSunk(board, ship)
      state = sunk ? 'sunk' : 'hit'
      description += sunk ? ', sunk' : ', hit'
    }
    const inPreview = preview?.cells.some((c) => sameCoord(c, coord))
    if (inPreview) description += preview!.valid ? ', placement preview' : ', invalid placement'
    return {
      coord,
      state,
      preview: inPreview ? (preview!.valid ? 'valid' : 'invalid') : undefined,
      label: `${toLabel(coord)}, ${description}`,
    }
  })
}

/** The enemy board: ships are hidden until hit, or until `reveal` at game over. */
export function enemyCells(board: Board, reveal: boolean): CellView[][] {
  return grid((coord) => {
    const ship = shipAt(board, coord)
    const mark = board.shots[coord.row][coord.col]
    let state: CellState = 'water'
    let description = 'not fired at'
    if (mark === 'miss') {
      state = 'miss'
      description = 'miss'
    } else if (mark === 'hit' && ship) {
      const sunk = isSunk(board, ship)
      state = sunk ? 'sunk' : 'hit'
      description = sunk ? `hit, ${ship.type} sunk` : 'hit'
    } else if (reveal && ship) {
      state = 'ship'
      description = `enemy ${ship.type}`
    }
    return { coord, state, label: `${toLabel(coord)}, ${description}` }
  })
}
