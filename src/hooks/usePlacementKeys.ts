import { useEffect } from 'react'

/**
 * While enabled, R and Space toggle ship orientation. Space is swallowed on both
 * keydown and keyup so it neither scrolls the page nor activates a focused button
 * (browsers activate buttons on Space keyup).
 */
export function usePlacementKeys(enabled: boolean, onRotate: () => void): void {
  useEffect(() => {
    if (!enabled) return
    const isSpace = (e: KeyboardEvent) => e.key === ' ' || e.code === 'Space'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isSpace(e) || e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        if (!e.repeat) onRotate()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (isSpace(e)) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('keyup', onKeyUp, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('keyup', onKeyUp, { capture: true })
    }
  }, [enabled, onRotate])
}
