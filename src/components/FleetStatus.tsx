import { isSunk } from '../game/board'
import { FLEET } from '../game/ships'
import type { Board } from '../game/types'

interface FleetStatusProps {
  label: string
  board: Board
  /**
   * Show damage to ships that are still afloat. Off for the enemy fleet: as in the
   * classic game, a hit is reported without naming the ship until it sinks.
   */
  showDamage: boolean
}

export default function FleetStatus({ label, board, showDamage }: FleetStatusProps) {
  return (
    <div className="fleet-status">
      <h3>{label}</h3>
      <ul>
        {FLEET.map(({ type, length }) => {
          const ship = board.ships.find((s) => s.type === type)
          const sunk = ship ? isSunk(board, ship) : false
          const hits = ship
            ? sunk || showDamage
              ? ship.cells.filter((c) => board.shots[c.row][c.col] === 'hit').length
              : 0
            : 0
          const status = sunk
            ? 'sunk'
            : showDamage && hits > 0
              ? `afloat, ${hits} of ${length} hit`
              : 'afloat'
          return (
            <li key={type} className={sunk ? 'fleet-ship fleet-ship-sunk' : 'fleet-ship'}>
              <span className="fleet-ship-name">{type}</span>
              <span className="pips" aria-hidden="true">
                {Array.from({ length }, (_, i) => (
                  <span key={i} className={i < hits ? 'pip pip-hit' : 'pip'} />
                ))}
              </span>
              <span className="visually-hidden">, {status}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
