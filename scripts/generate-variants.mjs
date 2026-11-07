/**
 * Generates `src/data/variants.json` from the chords-db guitar database.
 *
 * The bundled library in `src/data/guitar.json` only has a single shape per
 * chord. chords-db ships several positions for every chord and also records
 * which of them are barres, so we use it as the source of extra voicings.
 *
 * Run with `npm run variants` after updating `@tombatossals/chords-db`.
 *
 * Output shape: `{ [pitchClass:quality]: [baseFret, frets, barres][] }`
 * where `frets` and `barres` are relative to `baseFret` (fret 1 in the
 * diagram is `baseFret` on the neck), which is exactly what SVGuitar expects.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chordsDb from '@tombatossals/chords-db/lib/guitar.json' with { type: 'json' }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** chords-db spells roots without the accidental symbol, e.g. "Csharp". */
const ROOT_PITCH_CLASS = {
  C: 0,
  Csharp: 1,
  D: 2,
  Eb: 3,
  E: 4,
  F: 5,
  Fsharp: 6,
  G: 7,
  Ab: 8,
  A: 9,
  Bb: 10,
  B: 11,
}

/** Our internal quality names mapped to chords-db suffixes. */
const QUALITY_SUFFIX = {
  major: 'major',
  minor: 'minor',
  '7': '7',
  maj7: 'maj7',
  m7: 'm7',
  dim: 'dim',
  dim7: 'dim7',
  m7b5: 'm7b5',
  aug: 'aug',
  sus4: 'sus4',
  sus2: 'sus2',
  '6': '6',
  m6: 'm6',
  '9': '9',
  m9: 'm9',
  add9: 'add9',
  '11': '11',
}

/** Semitones in each chord, used to reject mislabelled shapes in chords-db. */
const QUALITY_INTERVALS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '9': [0, 2, 4, 7, 10],
  m9: [0, 2, 3, 7, 10],
  add9: [0, 2, 4, 7],
  '11': [0, 2, 4, 5, 7, 10],
}

/** Open strings, low E to high E, as pitch classes. */
const TUNING = [4, 9, 2, 7, 11, 4]

/**
 * The database contains a handful of positions that do not spell the chord
 * they are filed under. Drop those instead of drawing them.
 */
function spellsChord(baseFret, frets, root, quality) {
  const allowed = new Set(
    QUALITY_INTERVALS[quality].map((interval) => (root + interval) % 12),
  )

  return frets.every((fret, string) => {
    if (fret < 0) return true
    const absoluteFret = fret === 0 ? 0 : baseFret + fret - 1
    return allowed.has((TUNING[string] + absoluteFret) % 12)
  })
}

const variants = {}
let rejected = 0

for (const [dbKey, entries] of Object.entries(chordsDb.chords)) {
  const pitchClass = ROOT_PITCH_CLASS[dbKey]
  if (pitchClass === undefined) {
    throw new Error(`Unknown root in chords-db: ${dbKey}`)
  }

  for (const entry of entries) {
    const quality = Object.keys(QUALITY_SUFFIX).find(
      (name) => QUALITY_SUFFIX[name] === entry.suffix,
    )
    if (!quality) continue

    const positions = entry.positions.flatMap((position) => {
      const frets = [...position.frets]
      if (frets.length !== 6) {
        throw new Error(`${entry.key}${entry.suffix}: expected 6 frets`)
      }

      const barres = [...(position.barres ?? [])]
      for (const barre of barres) {
        if (!frets.includes(barre)) {
          throw new Error(
            `${entry.key}${entry.suffix}: barre ${barre} is not on a fretted string`,
          )
        }
      }

      if (!spellsChord(position.baseFret, frets, pitchClass, quality)) {
        rejected += 1
        return []
      }

      return [[position.baseFret, frets, barres]]
    })

    variants[`${pitchClass}:${quality}`] = positions
  }
}

const ids = Object.keys(variants)
if (ids.length !== 12 * Object.keys(QUALITY_SUFFIX).length) {
  throw new Error(`Expected every root to have every quality, got ${ids.length} ids`)
}

// One chord per line keeps the generated file readable and its diffs small.
const sortedIds = Object.keys(variants).sort((a, b) => {
  const [aClass, aQuality] = a.split(':')
  const [bClass, bQuality] = b.split(':')
  return Number(aClass) - Number(bClass) || aQuality.localeCompare(bQuality)
})

const lines = sortedIds.map(
  (id) => `  ${JSON.stringify(id)}: ${JSON.stringify(variants[id])}`,
)

const output = path.join(root, 'src/data/variants.json')
fs.writeFileSync(output, `{\n${lines.join(',\n')}\n}\n`)

const positionCount = Object.values(variants).reduce(
  (total, positions) => total + positions.length,
  0,
)
console.log(
  `Wrote ${ids.length} chords / ${positionCount} positions to ${output}` +
    (rejected ? ` (${rejected} mislabelled positions skipped)` : ''),
)
