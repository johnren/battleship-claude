import type { ShipType } from './types'

export const BOARD_SIZE = 10

export interface ShipSpec {
  type: ShipType
  length: number
}

export const FLEET: readonly ShipSpec[] = [
  { type: 'Carrier', length: 5 },
  { type: 'Battleship', length: 4 },
  { type: 'Cruiser', length: 3 },
  { type: 'Submarine', length: 3 },
  { type: 'Destroyer', length: 2 },
]

export const TOTAL_SHIP_CELLS = FLEET.reduce((sum, s) => sum + s.length, 0)

export function shipLength(type: ShipType): number {
  const spec = FLEET.find((s) => s.type === type)
  if (!spec) throw new Error(`Unknown ship type: ${type}`)
  return spec.length
}
