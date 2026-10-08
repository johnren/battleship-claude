import type { MouseEvent, PointerEvent } from 'react'
import type { Coord } from '../game/types'
import { COL_LABELS, ROW_LABELS } from '../utils/coords'
import type { CellView } from './boardView'

interface BoardProps {
  title: string
  cells: CellView[][]
  /** Whether cells respond to the player (hover outline, crosshair, clicks). */
  isInteractive: (cell: CellView) => boolean
  /** Whether cells take part in keyboard Tab order. */
  focusable: boolean
  onCellClick?: (coord: Coord, event: MouseEvent<HTMLButtonElement>) => void
  onCellPointerEnter?: (coord: Coord, event: PointerEvent<HTMLButtonElement>) => void
  onCellPointerDown?: (coord: Coord, event: PointerEvent<HTMLButtonElement>) => void
  onCellFocus?: (coord: Coord) => void
  onGridLeave?: () => void
  className?: string
}

export default function Board({
  title,
  cells,
  isInteractive,
  focusable,
  onCellClick,
  onCellPointerEnter,
  onCellPointerDown,
  onCellFocus,
  onGridLeave,
  className,
}: BoardProps) {
  const headingId = `${title.replace(/\s+/g, '-').toLowerCase()}-heading`
  return (
    <section className={`board ${className ?? ''}`} aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <div
        className="grid"
        onPointerLeave={onGridLeave}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) onGridLeave?.()
        }}
      >
        <span className="grid-corner" aria-hidden="true" />
        {COL_LABELS.map((label) => (
          <span key={label} className="grid-label" aria-hidden="true">
            {label}
          </span>
        ))}
        {cells.map((row, r) => [
          <span key={`row-${r}`} className="grid-label" aria-hidden="true">
            {ROW_LABELS[r]}
          </span>,
          ...row.map((cell) => {
            const interactive = isInteractive(cell)
            const classes = ['cell', `cell-${cell.state}`]
            if (cell.preview) classes.push(`preview-${cell.preview}`)
            if (interactive) classes.push('cell-interactive')
            return (
              <button
                key={`${cell.coord.row}-${cell.coord.col}`}
                type="button"
                className={classes.join(' ')}
                aria-label={cell.label}
                aria-disabled={!interactive}
                tabIndex={focusable ? 0 : -1}
                onClick={(e) => {
                  if (interactive) onCellClick?.(cell.coord, e)
                }}
                onPointerEnter={(e) => onCellPointerEnter?.(cell.coord, e)}
                onPointerDown={(e) => onCellPointerDown?.(cell.coord, e)}
                onFocus={() => onCellFocus?.(cell.coord)}
              />
            )
          }),
        ])}
      </div>
    </section>
  )
}
