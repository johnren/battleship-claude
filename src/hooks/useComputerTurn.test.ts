// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Phase, Side } from '../game/gameReducer'
import { COMPUTER_DELAY_MS, useComputerTurn } from './useComputerTurn'

interface Props {
  phase: Phase
  turn: Side
  gameId: number
}

function setup(initial: Props) {
  const dispatch = vi.fn()
  const hook = renderHook((p: Props) => useComputerTurn(p.phase, p.turn, p.gameId, dispatch), {
    initialProps: initial,
  })
  return { dispatch, ...hook }
}

describe('useComputerTurn', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires once after the delay on the computer’s turn', () => {
    const { dispatch } = setup({ phase: 'playing', turn: 'computer', gameId: 3 })
    vi.advanceTimersByTime(COMPUTER_DELAY_MS - 1)
    expect(dispatch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'COMPUTER_FIRE', gameId: 3 })
  })

  it('does nothing on the player’s turn or outside play', () => {
    const { dispatch, rerender } = setup({ phase: 'playing', turn: 'player', gameId: 0 })
    rerender({ phase: 'placement', turn: 'computer', gameId: 0 })
    rerender({ phase: 'gameover', turn: 'computer', gameId: 0 })
    vi.advanceTimersByTime(5000)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('cancels the pending move when Play Again starts a new game', () => {
    const { dispatch, rerender } = setup({ phase: 'playing', turn: 'computer', gameId: 0 })
    vi.advanceTimersByTime(300)
    rerender({ phase: 'placement', turn: 'player', gameId: 1 })
    vi.advanceTimersByTime(5000)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('cancels the pending move on unmount', () => {
    const { dispatch, unmount } = setup({ phase: 'playing', turn: 'computer', gameId: 0 })
    unmount()
    vi.advanceTimersByTime(5000)
    expect(dispatch).not.toHaveBeenCalled()
  })
})
