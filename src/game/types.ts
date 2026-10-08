/** A board position. Both row and col are 0–9. Labels like "B7" are a UI concern. */
export interface Coord {
  row: number
  col: number
}

export type Orientation = 'horizontal' | 'vertical'

export type ShipType = 'Carrier' | 'Battleship' | 'Cruiser' | 'Submarine' | 'Destroyer'

export interface PlacedShip {
  type: ShipType
  start: Coord
  orientation: Orientation
  cells: Coord[]
}

/** What is known about a single cell from the shooter's point of view. */
export type ShotMark = 'none' | 'miss' | 'hit'

export interface Board {
  ships: PlacedShip[]
  /** shots[row][col] */
  shots: ShotMark[][]
}

export type ShotResult = 'miss' | 'hit' | 'sunk'
