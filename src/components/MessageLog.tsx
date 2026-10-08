import type { LogEntry } from '../game/gameReducer'
import { describeShot } from './messages'

export const LOG_LENGTH = 5

export default function MessageLog({ log }: { log: LogEntry[] }) {
  const recent = log.slice(0, LOG_LENGTH)
  return (
    <section className="panel log" aria-labelledby="log-heading">
      <h2 id="log-heading">Recent shots</h2>
      {recent.length === 0 ? (
        <p className="log-empty">No shots fired yet.</p>
      ) : (
        <ol className="log-list" aria-live="polite">
          {recent.map((entry) => (
            <li key={entry.id} className={`log-entry log-${entry.shooter} log-${entry.result}`}>
              {describeShot(entry)}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
