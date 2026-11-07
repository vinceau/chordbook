import type { ResolvedChord } from '../lib/chords'
import { ChordDiagram } from './ChordDiagram'

interface ChordCardProps {
  chord: ResolvedChord
}

const ERROR_LABELS: Record<NonNullable<ResolvedChord['error']>, string> = {
  unrecognized: 'Not a chord name',
  missing: 'No shape in the library',
}

export function ChordCard({ chord }: ChordCardProps) {
  const { input, displayName, shape, error } = chord
  const hasAlias = !error && displayName !== input

  return (
    <article className={`chord-card${error ? ' chord-card--error' : ''}`}>
      <header className="chord-card__header">
        <h2 className="chord-card__name">{input}</h2>
        {hasAlias ? (
          <p className="chord-card__canonical">{displayName}</p>
        ) : null}
        {error ? (
          <p className="chord-card__error">{ERROR_LABELS[error]}</p>
        ) : null}
      </header>

      {shape ? (
        <ChordDiagram shape={shape} name={displayName} />
      ) : (
        <div className="chord-card__fallback" aria-hidden="true">
          ?
        </div>
      )}
    </article>
  )
}
