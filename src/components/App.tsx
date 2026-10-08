import { useCallback, useMemo, useReducer, useRef, useState, type MouseEvent } from 'react'
import { isValidPlacement, sameCoord, shipCells } from '../game/board'
import { createInitialState, gameReducer } from '../game/gameReducer'
import { isFleetComplete } from '../game/placement'
import { shipLength } from '../game/ships'
import type { Coord } from '../game/types'
import { usePlacementKeys } from '../hooks/usePlacementKeys'
import Board from './Board'
import { enemyCells, playerCells, type Preview } from './boardView'
import Header from './Header'
import PlacementControls from './PlacementControls'

interface AppProps {
  /** Seed for the first game. */
  seed: number
}

type PreviewSource = 'pointer' | 'touch' | 'keyboard'

export default function App({ seed }: AppProps) {
  const [state, dispatch] = useReducer(gameReducer, seed, createInitialState)
  const [hover, setHover] = useState<{ coord: Coord; source: PreviewSource } | null>(null)
  const lastPointerType = useRef('mouse')

  const placing = state.phase === 'placement'
  const rotate = useCallback(() => dispatch({ type: 'TOGGLE_ORIENTATION' }), [])
  usePlacementKeys(placing, rotate)

  const preview: Preview | undefined = useMemo(() => {
    if (!placing || !hover || !state.selectedShip) return undefined
    return {
      cells: shipCells(hover.coord, shipLength(state.selectedShip), state.orientation),
      valid: isValidPlacement(state.player, state.selectedShip, hover.coord, state.orientation),
    }
  }, [placing, hover, state.selectedShip, state.orientation, state.player])

  const playerView = useMemo(() => playerCells(state.player, preview), [state.player, preview])
  const enemyView = useMemo(
    () => enemyCells(state.computer, state.phase === 'gameover'),
    [state.computer, state.phase],
  )

  function handlePlacementClick(coord: Coord, event: MouseEvent<HTMLButtonElement>) {
    // event.detail is 0 for keyboard activation, which places immediately.
    const isTouch = event.detail > 0 && lastPointerType.current === 'touch'
    if (isTouch && !(hover?.source === 'touch' && sameCoord(hover.coord, coord))) {
      // First tap previews; a second tap on the same cell confirms.
      setHover({ coord, source: 'touch' })
      return
    }
    dispatch({ type: 'PLACE_SHIP', start: coord })
    if (isTouch) setHover(null)
  }

  return (
    <div className="app">
      <Header phase={state.phase} turn={state.turn} />
      <main>
        {placing && (
          <PlacementControls
            placed={state.player.ships.map((s) => s.type)}
            selected={state.selectedShip}
            orientation={state.orientation}
            canStart={isFleetComplete(state.player)}
            onSelect={(ship) => dispatch({ type: 'SELECT_SHIP', ship })}
            onRotate={rotate}
            onRandomize={() => dispatch({ type: 'RANDOMIZE' })}
            onReset={() => dispatch({ type: 'RESET_PLACEMENT' })}
            onStart={() => dispatch({ type: 'START' })}
          />
        )}
        <div className="boards">
          <div className="board-column">
            <Board
              title="Your fleet"
              className={placing ? 'board-placing' : undefined}
              cells={playerView}
              focusable={placing}
              isInteractive={() => placing && state.selectedShip !== null}
              onCellClick={placing ? handlePlacementClick : undefined}
              onCellPointerDown={(_, e) => {
                lastPointerType.current = e.pointerType
              }}
              onCellPointerEnter={(coord, e) => {
                if (placing && e.pointerType !== 'touch') setHover({ coord, source: 'pointer' })
              }}
              onCellFocus={(coord) => {
                if (placing) setHover({ coord, source: 'keyboard' })
              }}
              // A touch preview survives the pointerleave that follows every tap.
              onGridLeave={() => setHover((h) => (h?.source === 'touch' ? h : null))}
            />
          </div>
          <div className="board-column">
            <Board
              title="Enemy waters"
              className="board-enemy"
              cells={enemyView}
              focusable={false}
              isInteractive={() => false}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
