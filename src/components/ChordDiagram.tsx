import { useEffect, useRef } from 'react'
import { SVGuitarChord, type Finger } from 'svguitar'
import type { ChordFinger, ChordShape } from '../lib/chords'

interface ChordDiagramProps {
  shape: ChordShape
  name: string
}

interface BarreCandidate {
  fret: number
  fromString: number
  toString: number
  finger: ChordFinger
}

/**
 * chords-db stores barres as a list of fret numbers. A barre is held by a
 * single finger, so the strings it covers are the ones at the barre fret
 * sharing the most common finger there. The span must then stay clear of any
 * string that sounds below the barre fret (or is muted), which would make the
 * barre impossible to play.
 */
function barresFromFrets(
  frets: number[],
  barreFrets: number[],
  fingers: ChordFinger[],
): BarreCandidate[] {
  return barreFrets.flatMap((fret) => {
    const indexes: number[] = []
    frets.forEach((value, index) => {
      if (value === fret) indexes.push(index)
    })

    if (indexes.length < 2) return []

    const counts = new Map<ChordFinger, number>()
    const firstIndex = new Map<ChordFinger, number>()
    for (const index of indexes) {
      const finger = fingers[index] ?? 0
      counts.set(finger, (counts.get(finger) ?? 0) + 1)
      if (!firstIndex.has(finger)) firstIndex.set(finger, index)
    }

    // The finger on most of the notes at the barre fret holds the barre; the
    // earliest string breaks ties.
    const barreFinger = [...counts].sort(([fingerA, countA], [fingerB, countB]) => {
      if (countA !== countB) return countB - countA
      return (firstIndex.get(fingerA) ?? 0) - (firstIndex.get(fingerB) ?? 0)
    })[0][0]

    const covered = indexes.filter((index) => (fingers[index] ?? 0) === barreFinger)
    const first = covered[0]
    const last = covered[covered.length - 1]

    for (let index = first; index <= last; index++) {
      if (frets[index] < fret) return []
    }

    return [
      {
        fret,
        fromString: frets.length - first,
        toString: frets.length - last,
        finger: barreFinger,
      },
    ]
  })
}

function toFingers(frets: number[], barres: BarreCandidate[]): Finger[] {
  return frets
    .map((fret, index): Finger | null => {
      const string = frets.length - index

      if (fret < 0) return [string, 'x']
      if (fret === 0) return [string, 0]

      const coveredByBarre = barres.some(
        (barre) =>
          fret === barre.fret &&
          string <= barre.fromString &&
          string >= barre.toString,
      )
      if (coveredByBarre) return null

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

    const barres = barresFromFrets(shape.frets, shape.barres, shape.fingers)

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
        fingers: toFingers(shape.frets, barres),
        barres,
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
