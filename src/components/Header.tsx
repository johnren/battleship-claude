import type { Phase, Side } from '../game/gameReducer'

interface HeaderProps {
  phase: Phase
  turn: Side
}

export default function Header({ phase, turn }: HeaderProps) {
  return (
    <header className="header">
      <h1>Battleship</h1>
      <TurnIndicator phase={phase} turn={turn} />
    </header>
  )
}

function TurnIndicator({ phase, turn }: HeaderProps) {
  let content
  if (phase === 'placement') {
    content = <span className="turn turn-muted">Placing ships</span>
  } else if (phase === 'gameover') {
    content = <span className="turn turn-muted">Game over</span>
  } else if (turn === 'player') {
    content = <span className="turn turn-player">Your turn</span>
  } else {
    content = (
      <span className="turn turn-muted">
        <span className="pulse-dot" aria-hidden="true" />
        Enemy firing…
      </span>
    )
  }
  return (
    <div className="turn-indicator" role="status" aria-live="polite">
      {content}
    </div>
  )
}
