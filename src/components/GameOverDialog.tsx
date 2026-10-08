import { useEffect, useRef } from 'react'

interface GameOverDialogProps {
  won: boolean
  shots: number
  hits: number
  onPlayAgain: () => void
}

export default function GameOverDialog({ won, shots, hits, onPlayAgain }: GameOverDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0
  return (
    <dialog
      ref={ref}
      className="game-over panel"
      aria-labelledby="game-over-title"
      // Keep the dialog open on Escape; Play Again is the way out.
      onCancel={(e) => e.preventDefault()}
    >
      <h2 id="game-over-title" className={won ? 'result-win' : 'result-loss'}>
        {won ? 'Victory' : 'Defeat'}
      </h2>
      <p>{won ? 'You sank the entire enemy fleet.' : 'The enemy sank your entire fleet.'}</p>
      <dl className="stats">
        <div>
          <dt>Shots fired</dt>
          <dd>{shots}</dd>
        </div>
        <div>
          <dt>Hit accuracy</dt>
          <dd>{accuracy}%</dd>
        </div>
      </dl>
      <button type="button" className="btn btn-primary" onClick={onPlayAgain} autoFocus>
        Play Again
      </button>
    </dialog>
  )
}
