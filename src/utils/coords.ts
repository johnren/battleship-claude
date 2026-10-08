import type { Coord } from '../game/types'

export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const
export const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

/** { row: 1, col: 6 } -> "B7" */
export function toLabel({ row, col }: Coord): string {
  return `${ROW_LABELS[row]}${col + 1}`
}
