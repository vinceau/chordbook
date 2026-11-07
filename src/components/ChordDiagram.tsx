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
 * chords-db stores barres as a list of fret numbers, so find the strings a
 * barre covers by looking for every note on that fret.
 */
function barresFromFrets(frets: number[], barreFrets: number[]): BarreCandidate[] {
  return barreFrets.flatMap((fret) => {
    const indexes: number[] = []
    frets.forEach((value, index) => {
      if (value === fret) indexes.push(index)
    })

    if (indexes.length < 2) return []

    return [
      {
        fret,
        fromString: frets.length - indexes[0],
        toString: frets.length - indexes[indexes.length - 1],
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

    const barres = barresFromFrets(shape.frets, shape.barres)

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
