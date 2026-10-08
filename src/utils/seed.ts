/** Reads ?seed=123 from a query string. Returns null when absent or not an integer. */
export function seedFromQuery(search: string): number | null {
  const raw = new URLSearchParams(search).get('seed')
  if (raw === null || !/^-?\d+$/.test(raw.trim())) return null
  return Number(raw) >>> 0
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32)
}
