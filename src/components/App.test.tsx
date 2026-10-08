// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COMPUTER_DELAY_MS } from '../hooks/useComputerTurn'
import App from './App'

function enemyGrid() {
  return within(screen.getByRole('region', { name: 'Enemy waters' }))
}

function startGame() {
  render(<App seed={123} fixedSeed={123} />)
  fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
  fireEvent.click(screen.getByRole('button', { name: 'Start' }))
}

describe('App', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('keeps Start disabled until the fleet is placed', () => {
    render(<App seed={1} />)
    const start = screen.getByRole('button', { name: 'Start' })
    expect(start).toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
    expect(start).toHaveProperty('disabled', false)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(start).toHaveProperty('disabled', true)
  })

  it('rotates with R and Space during placement', () => {
    render(<App seed={1} />)
    expect(screen.getByRole('button', { name: /Rotate/ }).textContent).toContain('Horizontal')
    fireEvent.keyDown(window, { key: 'r' })
    expect(screen.getByRole('button', { name: /Rotate/ }).textContent).toContain('Vertical')
    const space = fireEvent.keyDown(window, { key: ' ', code: 'Space' })
    expect(space).toBe(false) // default prevented: no scrolling, no button activation
    expect(screen.getByRole('button', { name: /Rotate/ }).textContent).toContain('Horizontal')
  })

  it('fires one shot per turn, locks the grid, then the computer replies after a delay', () => {
    startGame()
    expect(screen.getByRole('status').textContent).toBe('Your turn')

    const cell = enemyGrid().getByRole('button', { name: 'A1, not fired at' })
    fireEvent.click(cell)
    // Rapid extra clicks on the same and other cells do nothing.
    fireEvent.click(cell)
    fireEvent.click(enemyGrid().getByRole('button', { name: 'J10, not fired at' }))

    expect(screen.getByRole('status').textContent).toContain('Enemy firing')
    expect(screen.getAllByRole('listitem').filter((li) => li.className.includes('log-entry'))).toHaveLength(1)
    expect(enemyGrid().getByRole('button', { name: 'J10, not fired at' }).getAttribute('aria-disabled')).toBe(
      'true',
    )

    act(() => vi.advanceTimersByTime(COMPUTER_DELAY_MS))
    expect(screen.getByRole('status').textContent).toBe('Your turn')
    const entries = document.querySelectorAll('.log-entry')
    expect(entries).toHaveLength(2)
    expect(entries[0].className).toContain('log-computer')
  })

  it('ignores clicks on cells already fired at', () => {
    startGame()
    fireEvent.click(enemyGrid().getByRole('button', { name: 'A1, not fired at' }))
    act(() => vi.advanceTimersByTime(COMPUTER_DELAY_MS))
    const fired = enemyGrid().getByRole('button', { name: /^A1, (miss|hit)/ })
    fireEvent.click(fired)
    expect(screen.getByRole('status').textContent).toBe('Your turn')
    expect(document.querySelectorAll('.log-entry')).toHaveLength(2)
  })
})
