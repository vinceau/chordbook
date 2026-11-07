import type { ResolvedChord } from '../lib/chords'
import { ChordDiagram } from './ChordDiagram'

interface ChordCardProps {
  chord: ResolvedChord
  /** Index of the shape to show, clamped to the number of known shapes. */
  variant: number
  onVariantChange: (variant: number) => void
}

const ERROR_LABELS: Record<NonNullable<ResolvedChord['error']>, string> = {
  unrecognized: 'Not a chord name',
  missing: 'No shape in the library',
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'left' ? 'm12.5 4.5-5.5 5.5 5.5 5.5' : 'm7.5 4.5 5.5 5.5-5.5 5.5'} />
    </svg>
  )
}

export function ChordCard({ chord, variant, onVariantChange }: ChordCardProps) {
  const { input, displayName, shapes, error } = chord
  const hasAlias = !error && displayName !== input
  const shapeCount = shapes.length
  const activeVariant =
    shapeCount > 0 ? Math.min(Math.max(variant, 0), shapeCount - 1) : 0
  const shape = shapes[activeVariant]

  const stepVariant = (offset: number) => {
    onVariantChange((activeVariant + offset + shapeCount) % shapeCount)
  }

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

      <div className="chord-card__shapes">
        {shape ? (
          <ChordDiagram shape={shape} name={displayName} />
        ) : (
          <div className="chord-card__fallback" aria-hidden="true">
            ?
          </div>
        )}

        {shapeCount > 1 ? (
          <>
            <button
              className="chord-card__nav chord-card__nav--prev"
              type="button"
              onClick={() => stepVariant(-1)}
              aria-label={`Previous shape for ${displayName}`}
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              className="chord-card__nav chord-card__nav--next"
              type="button"
              onClick={() => stepVariant(1)}
              aria-label={`Next shape for ${displayName}`}
            >
              <ChevronIcon direction="right" />
            </button>
            <div className="chord-card__dots" aria-hidden="true">
              {shapes.map((_, index) => (
                <span
                  key={index}
                  className={`chord-card__dot${
                    index === activeVariant ? ' chord-card__dot--active' : ''
                  }`}
                />
              ))}
            </div>
            <span className="visually-hidden" aria-live="polite">
              Shape {activeVariant + 1} of {shapeCount}
            </span>
          </>
        ) : null}
      </div>
    </article>
  )
}
