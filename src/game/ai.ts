import { emptyShots, isOnBoard, sameCoord, shipCells } from './board'
import { pick, type Rng } from './rng'
import { BOARD_SIZE, shipLength } from './ships'
import type { Coord, ShipType, ShotMark, ShotResult } from './types'

/**
 * Everything the computer knows. It holds only what a human opponent would
 * know: its own shots, whether each was a hit or a miss, and which ships it sank.
 * It never sees the player's ship positions.
 */
export interface AiState {
  shots: ShotMark[][]
  /** Hits not yet attributed to a sunk ship, oldest first. */
  unresolved: Coord[]
  totalHits: number
  sunkCells: number
}

export type AiMode = 'hunt' | 'target'

export interface AiShot {
  coord: Coord
  mode: AiMode
}

export function createAiState(): AiState {
  return { shots: emptyShots(), unresolved: [], totalHits: 0, sunkCells: 0 }
}

const DIRECTIONS: readonly Coord[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

function isUntried(ai: AiState, c: Coord): boolean {
  return isOnBoard(c) && ai.shots[c.row][c.col] === 'none'
}

function uniqueCoords(coords: Coord[]): Coord[] {
  return coords.filter((c, i) => coords.findIndex((d) => sameCoord(c, d)) === i)
}

function untriedNeighbors(ai: AiState, cells: Coord[]): Coord[] {
  return uniqueCoords(
    cells.flatMap((c) =>
      DIRECTIONS.map((d) => ({ row: c.row + d.row, col: c.col + d.col })).filter((n) => isUntried(ai, n)),
    ),
  )
}

function contains(cells: Coord[], c: Coord): boolean {
  return cells.some((d) => sameCoord(c, d))
}

/**
 * For every run of two or more lined-up hits, the untried cells just past
 * each end of the run.
 */
function lineExtensions(ai: AiState, hits: Coord[]): Coord[] {
  const result: Coord[] = []
  for (const h of hits) {
    for (const d of [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ]) {
      // Only start from the first cell of a run.
      if (contains(hits, { row: h.row - d.row, col: h.col - d.col })) continue
      let end = h
      let length = 1
      while (contains(hits, { row: end.row + d.row, col: end.col + d.col })) {
        end = { row: end.row + d.row, col: end.col + d.col }
        length++
      }
      if (length < 2) continue
      const before = { row: h.row - d.row, col: h.col - d.col }
      const after = { row: end.row + d.row, col: end.col + d.col }
      for (const c of [before, after]) if (isUntried(ai, c)) result.push(c)
    }
  }
  return uniqueCoords(result)
}

/** True while some hit has not been accounted for by a sunk ship. */
export function hasUnresolvedHits(ai: AiState): boolean {
  return ai.totalHits > ai.sunkCells
}

export function chooseShot(ai: AiState, rng: Rng): AiShot {
  if (hasUnresolvedHits(ai)) {
    // Prefer extending a line of hits, then the neighbours of unresolved hits.
    // If hits were misattributed to a sunk ship, fall back to the neighbours of
    // every hit. An unsunk ship always has an untried cell next to one of its
    // hits, so one of these lists is non-empty.
    const all = allHits(ai)
    const candidates = [
      lineExtensions(ai, ai.unresolved),
      untriedNeighbors(ai, ai.unresolved),
      lineExtensions(ai, all),
      untriedNeighbors(ai, all),
    ].find((list) => list.length > 0)
    if (candidates) return { coord: pick(rng, candidates), mode: 'target' }
  }

  const untried: Coord[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (ai.shots[row][col] === 'none') untried.push({ row, col })
    }
  }
  if (untried.length === 0) throw new Error('No cells left to fire at')
  // The smallest ship is 2 long, so every ship covers at least one cell where
  // row + col is even.
  const checkerboard = untried.filter((c) => (c.row + c.col) % 2 === 0)
  return { coord: pick(rng, checkerboard.length > 0 ? checkerboard : untried), mode: 'hunt' }
}

function allHits(ai: AiState): Coord[] {
  const hits: Coord[] = []
  ai.shots.forEach((row, r) =>
    row.forEach((mark, c) => {
      if (mark === 'hit') hits.push({ row: r, col: c })
    }),
  )
  return hits
}

/**
 * Updates the computer's knowledge after a shot. On a sink, the run of hits
 * through the sinking shot that matches the ship's length is attributed to
 * that ship and stops being targeted.
 */
export function recordResult(ai: AiState, coord: Coord, result: ShotResult, sunkShip?: ShipType): AiState {
  const shots = ai.shots.map((row, r) =>
    r === coord.row ? row.map((m, c) => (c === coord.col ? (result === 'miss' ? 'miss' : 'hit') : m)) : row,
  )
  if (result === 'miss') return { ...ai, shots }

  const unresolved = [...ai.unresolved, coord]
  const totalHits = ai.totalHits + 1
  if (result === 'hit') return { ...ai, shots, unresolved, totalHits }

  if (!sunkShip) throw new Error('A sunk result must name the ship')
  const length = shipLength(sunkShip)
  const sunkRun = findSunkRun(unresolved, coord, length)
  return {
    shots,
    unresolved: unresolved.filter((c) => !contains(sunkRun, c)),
    totalHits,
    sunkCells: ai.sunkCells + length,
  }
}

function findSunkRun(hits: Coord[], last: Coord, length: number): Coord[] {
  for (const orientation of ['horizontal', 'vertical'] as const) {
    for (let offset = 0; offset < length; offset++) {
      const start =
        orientation === 'horizontal'
          ? { row: last.row, col: last.col - offset }
          : { row: last.row - offset, col: last.col }
      const cells = shipCells(start, length, orientation)
      if (cells.every((c) => contains(hits, c))) return cells
    }
  }
  // Could not tell which hits belong to the ship; resolve only the sinking shot.
  return [last]
}
