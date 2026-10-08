import type { ReactNode } from 'react'
import type { LogEntry } from '../game/gameReducer'
import { toLabel } from '../utils/coords'

/** Plain-words description of a shot, e.g. "Hit at B7." or "They sank your Cruiser!" */
export function describeShot(entry: LogEntry): ReactNode {
  const at = <span className="mono">{toLabel(entry.coord)}</span>
  if (entry.shooter === 'player') {
    if (entry.result === 'sunk') return `You sank their ${entry.shipType}!`
    if (entry.result === 'hit') return <>Hit at {at}.</>
    return <>Miss at {at}.</>
  }
  if (entry.result === 'sunk') return `They sank your ${entry.shipType}!`
  if (entry.result === 'hit')
    return (
      <>
        They hit your {entry.shipType} at {at}.
      </>
    )
  return <>They missed at {at}.</>
}
