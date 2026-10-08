interface GameOverBarProps {
  won: boolean
  onPlayAgain: () => void
}

/** Shown above the boards for the whole game-over phase, so Play Again is reachable after the dialog is closed. */
export default function GameOverBar({ won, onPlayAgain }: GameOverBarProps) {
  return (
    <section className="panel game-over-bar" aria-label="Game over">
      <p>
        <strong className={won ? 'result-win' : 'result-loss'}>{won ? 'Victory' : 'Defeat'}</strong>
        {won ? ' — you sank the entire enemy fleet.' : ' — the enemy sank your entire fleet.'}
      </p>
      <button type="button" className="btn btn-primary" onClick={onPlayAgain}>
        Play Again
      </button>
    </section>
  )
}
