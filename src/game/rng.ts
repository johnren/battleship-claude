/**
 * Seedable pseudo-random number generator (mulberry32).
 * The generator's whole state is a single 32-bit integer, so it can be stored
 * in immutable game state and resumed later with createRng(savedState).
 */
export interface Rng {
  /** Returns a float in [0, 1). */
  next(): number
  /** Current internal state; pass to createRng to resume the sequence. */
  readonly state: number
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
    get state() {
      return s
    },
  }
}

/** Integer in [0, maxExclusive). */
export function randomInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng.next() * maxExclusive)
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() called with an empty array')
  return items[randomInt(rng, items.length)]
}
