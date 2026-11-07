import { useEffect, useRef } from 'react'
import { SVGuitarChord, type Finger } from 'svguitar'
import type { ChordShape } from '../lib/chords'

interface ChordDiagramProps {
  shape: ChordShape
  name: string
}

interface BarreCandidate {
  fret: number
  fromString: number
  toString: number
}

/**
 * The source data only stores frets, not barres. Look for a repeated fret
 * that jumps over at least one higher fret — that is the usual visual
 * signature of a barre chord in this library.
 */
function findBarre(frets: number[]): BarreCandidate | null {
  let candidate: BarreCandidate | null = null

  for (let index = 2; index < frets.length; index += 1) {
    const fret = frets[index]
    if (fret <= 0) continue

    const previousFrets = frets.slice(0, index - 1)
    const matchingIndex = previousFrets.findIndex((otherFret, otherIndex, all) => {
      const fretBetween = all[otherIndex + 1]
      return (
        otherFret === fret &&
        typeof fretBetween === 'number' &&
        fretBetween > fret
      )
    })

    if (matchingIndex === -1) continue

    const fromString = frets.length - matchingIndex
    const toString = frets.length - index

    if (!candidate) {
      candidate = { fret, fromString, toString }
    } else if (candidate.fret === fret) {
      candidate.fromString = Math.max(candidate.fromString, fromString)
      candidate.toString = Math.min(candidate.toString, toString)
    }
  }

  if (!candidate) return null

  // A barre cannot run across a muted or open string.
  const fromIndex = frets.length - candidate.fromString
  const toIndex = frets.length - candidate.toString
  for (let index = fromIndex; index <= toIndex; index += 1) {
    if (frets[index] < candidate.fret) return null
  }

  return candidate
}

function toFingers(frets: number[], barre: BarreCandidate | null): Finger[] {
  return frets
    .map((fret, index): Finger | null => {
      const string = frets.length - index

      if (fret < 0) return [string, 'x']
      if (fret === 0) return [string, 0]
      if (barre && fret === barre.fret) return null

      return [string, fret]
    })
    .filter((finger): finger is Finger => finger !== null)
}

export function ChordDiagram({ shape, name }: ChordDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.replaceChildren()

    const barre = findBarre(shape.frets)
    const highestFret = Math.max(
      0,
      ...shape.frets.filter((fret) => fret > 0),
    )

    const chart = new SVGuitarChord(container)

    chart
      .configure({
        strings: 6,
        frets: Math.max(highestFret, 4),
        tuning: [],
        backgroundColor: 'transparent',
        color: '#2c2721',
        fingerColor: '#b74f2d',
        fingerSize: 0.64,
        strokeWidth: 2.4,
        nutWidth: 9,
        fretSize: 1.45,
        sidePadding: 0.18,
        emptyStringIndicatorSize: 0.55,
        fretLabelFontSize: 34,
        fontFamily:
          '"Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif',
        svgTitle: `${name} chord diagram`,
      })
      .chord({
        fingers: toFingers(shape.frets, barre),
        barres: barre ? [barre] : [],
        position: shape.base,
      })
      .draw()

    return () => chart.remove()
  }, [shape, name])

  return (
    <div
      ref={containerRef}
      className="chord-diagram"
      role="img"
      aria-label={`${name} chord diagram`}
    />
  )
}
