import { FLEET } from '../game/ships'
import type { Orientation, ShipType } from '../game/types'

interface PlacementControlsProps {
  placed: ShipType[]
  selected: ShipType | null
  orientation: Orientation
  canStart: boolean
  onSelect: (ship: ShipType) => void
  onRotate: () => void
  onRandomize: () => void
  onReset: () => void
  onStart: () => void
}

export default function PlacementControls({
  placed,
  selected,
  orientation,
  canStart,
  onSelect,
  onRotate,
  onRandomize,
  onReset,
  onStart,
}: PlacementControlsProps) {
  return (
    <section className="placement panel" aria-labelledby="placement-heading">
      <h2 id="placement-heading">Place your fleet</h2>
      <p className="hint">
        Pick a ship, then click your grid to place it. On touch screens, tap once to preview and tap the same
        cell again to confirm. Press R or Space to rotate.
      </p>
      <div className="ship-picker" role="group" aria-label="Ships">
        {FLEET.map(({ type, length }) => {
          const isPlaced = placed.includes(type)
          return (
            <button
              key={type}
              type="button"
              className="ship-option"
              aria-pressed={selected === type}
              onClick={() => onSelect(type)}
            >
              <span className="ship-option-name">{type}</span>
              <span className="ship-option-meta">
                <span className="pips" aria-hidden="true">
                  {Array.from({ length }, (_, i) => (
                    <span key={i} className="pip" />
                  ))}
                </span>
                <span className="ship-option-status">{isPlaced ? 'Placed' : `${length} cells`}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={onRotate}>
          Rotate ({orientation === 'horizontal' ? 'Horizontal' : 'Vertical'})
        </button>
        <button type="button" className="btn" onClick={onRandomize}>
          Randomize
        </button>
        <button type="button" className="btn" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="btn btn-primary" onClick={onStart} disabled={!canStart}>
          Start
        </button>
      </div>
    </section>
  )
}
