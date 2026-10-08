import { useEffect } from 'react'
import type { GameAction, Phase, Side } from '../game/gameReducer'

export const COMPUTER_DELAY_MS = 600

/**
 * Schedules the computer's shot a short delay after its turn begins. The timer is
 * cleared whenever the game changes (e.g. Play Again) or the component unmounts,
 * and the action carries the game id so a late shot is ignored by the reducer anyway.
 */
export function useComputerTurn(
  phase: Phase,
  turn: Side,
  gameId: number,
  dispatch: (action: GameAction) => void,
): void {
  useEffect(() => {
    if (phase !== 'playing' || turn !== 'computer') return
    const timer = setTimeout(() => dispatch({ type: 'COMPUTER_FIRE', gameId }), COMPUTER_DELAY_MS)
    return () => clearTimeout(timer)
  }, [phase, turn, gameId, dispatch])
}
