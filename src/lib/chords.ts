import rawGuitarDb from '../data/guitar.json'
import rawUkuleleDb from '../data/ukulele.json'

export type Instrument = 'guitar' | 'ukulele'

export interface InstrumentConfig {
  /** Name shown in the instrument picker. */
  label: string
  /** Pitch class of each open string, from the lowest string up. */
  tuning: number[]
}

export const INSTRUMENTS: Record<Instrument, InstrumentConfig> = {
  // Low E, A, D, G, B, high E.
  guitar: { label: 'Guitar', tuning: [4, 9, 2, 7, 11, 4] },
  // Reentrant G, C, E, A.
  ukulele: { label: 'Ukulele', tuning: [7, 0, 4, 9] },
}

export type ChordQuality =
  | 'major'
  | 'minor'
  | '7'
  | 'maj7'
  | 'm7'
  | 'dim'
  | 'dim7'
  | 'm7b5'
  | 'aug'
  | 'sus4'
  | 'sus2'
  | '6'
  | 'm6'
  | '9'
  | 'm9'
  | 'add9'
  | '11'
  | 'nc'

/** Finger used on a string: 1-4, 0 when no finger is used, or "T" for the thumb. */
export type ChordFinger = number | 'T'

interface RawChordVoicing {
  /** Absolute fret values, from the lowest string up. 0 is open, -1 is muted. */
  frets: number[]
  /** Finger for each string, aligned with `frets`. */
  fingers?: ChordFinger[]
  /** Absolute frets held as a barre. */
  barres?: number[]
}

interface RawChordEntry {
  /** Root of the chord, e.g. "C#" or "Bb". */
  key: string
  /** chords-db name for the chord quality, e.g. "maj7". */
  suffix: string
  voicings: RawChordVoicing[]
}

interface RawChordsDb {
  chords: Record<string, RawChordEntry[]>
}

export interface ChordShape {
  /** The first fret shown in the diagram. */
  base: number
  /** Fret values, relative to `base`, from the lowest string up. */
  frets: number[]
  /** Frets (relative to `base`) that are held as a barre. */
  barres: number[]
  /** Finger used on each string, aligned with `frets`. */
  fingers: ChordFinger[]
}

export interface ResolvedChord {
  /** Exactly what the user typed. */
  input: string
  /** Canonical spelling of the chord, e.g. "CM7" becomes "Cmaj7". */
  displayName: string
  /** Every known shape for the chord, in display order. */
  shapes: ChordShape[]
  error?: 'unrecognized' | 'missing'
}

const LETTER_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const QUALITY_LABELS: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
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
  nc: '',
}

/** chords-db suffix for each quality we understand. */
const QUALITY_BY_SUFFIX: Record<string, ChordQuality> = {
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

/** Semitones in each quality, used to reject mislabelled chords-db shapes. */
const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
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
  nc: [],
}

/**
 * Lowercase aliases. Uppercase "M" is handled before this table so that
 * "CM" (major) and "Cm" (minor) keep their distinct meanings.
 */
const QUALITY_ALIASES: Record<string, ChordQuality> = {
  '': 'major',
  m: 'minor',
  min: 'minor',
  minor: 'minor',
  mi: 'minor',
  '-': 'minor',
  '7': '7',
  dom: '7',
  dom7: '7',
  maj7: 'maj7',
  major7: 'maj7',
  ma7: 'maj7',
  m7: 'm7',
  min7: 'm7',
  mi7: 'm7',
  '-7': 'm7',
  dim: 'dim',
  o: 'dim',
  '°': 'dim',
  '0': 'dim',
  mb5: 'dim',
  dim7: 'dim7',
  o7: 'dim7',
  '°7': 'dim7',
  '07': 'dim7',
  m7b5: 'm7b5',
  min7b5: 'm7b5',
  mi7b5: 'm7b5',
  'm7-5': 'm7b5',
  ø: 'm7b5',
  ø7: 'm7b5',
  h: 'm7b5',
  halfdim: 'm7b5',
  'half-diminished': 'm7b5',
  aug: 'aug',
  '+': 'aug',
  '#5': 'aug',
  sus: 'sus4',
  sus4: 'sus4',
  '4': 'sus4',
  sus2: 'sus2',
  '2': 'sus2',
  '6': '6',
  maj6: '6',
  major6: '6',
  m6: 'm6',
  min6: 'm6',
  mi6: 'm6',
  '9': '9',
  dom9: '9',
  m9: 'm9',
  min9: 'm9',
  mi9: 'm9',
  add9: 'add9',
  add2: 'add9',
  '2add': 'add9',
  '11': '11',
}

interface ParsedChordName {
  root: string
  pitchClass: number
  quality: ChordQuality | null
  displayName: string
}

function normalizeQuality(rawQuality: string): ChordQuality | null {
  let value = rawQuality.trim().replace(/\s+/g, '')
  if (!value) return 'major'

  value = value
    .replace(/[()[\]{}]/g, '')
    .replace(/[Δ∆^]/g, 'maj')
    .replace(/[♯]/g, '#')
    .replace(/[♭]/g, 'b')
    .replace(/[⁰º]/g, '°')

  // "maj", "major", "maj7", "MAJ7", etc. are all case-insensitive.
  if (/^maj(or)?$/i.test(value)) return 'major'
  if (/^maj(or)?7$/i.test(value)) return 'maj7'
  if (/^maj(or)?6$/i.test(value)) return '6'

  // A capital M means major: M, M6, M7. M9/M11/M13 have no library shape.
  if (/^M$/.test(value)) return 'major'
  if (/^M7$/.test(value)) return 'maj7'
  if (/^M6$/.test(value)) return '6'
  if (/^M/.test(value)) return null

  return QUALITY_ALIASES[value.toLowerCase()] ?? null
}

function parseChordName(input: string): ParsedChordName | null {
  const match = /^([A-Ga-g])([#b♯♭]?)(.*)$/.exec(input.trim())
  if (!match) return null

  const letter = match[1].toUpperCase()
  const accidental = match[2].replace('♯', '#').replace('♭', 'b')
  const quality = normalizeQuality(match[3])

  const root = `${letter}${accidental}`
  const pitchClass =
    (LETTER_SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0) + 12) %
    12

  return {
    root,
    pitchClass,
    quality,
    displayName: quality
      ? `${root}${QUALITY_LABELS[quality]}`
      : `${root}${match[3].trim()}`,
  }
}

function isSameShape(a: ChordShape, b: ChordShape): boolean {
  return (
    a.base === b.base &&
    a.frets.length === b.frets.length &&
    a.frets.every((fret, index) => fret === b.frets[index])
  )
}

/**
 * A handful of voicings do not spell the chord they are filed under. Check
 * every sounded note against the chord tones and skip the rest.
 */
function spellsChord(
  shape: ChordShape,
  root: number,
  quality: ChordQuality,
  tuning: number[],
): boolean {
  const allowed = new Set(
    QUALITY_INTERVALS[quality].map((interval) => (root + interval) % 12),
  )

  return shape.frets.every((fret, string) => {
    if (fret < 0) return true
    const absoluteFret = fret === 0 ? 0 : shape.base + fret - 1
    return allowed.has((tuning[string] + absoluteFret) % 12)
  })
}

/**
 * The library stores absolute frets, but the diagram is drawn from a base
 * fret. Voicings that fit within the first four frets are drawn from the nut;
 * higher ones start at their lowest fretted note. Open and muted strings are
 * left alone, the rest are made relative to the base (this is exactly what
 * the fork's own `toChordDiagram()` does).
 */
function shapeFromVoicing(voicing: RawChordVoicing): ChordShape {
  const { frets, barres } = voicing
  const base =
    Math.max(...frets) > 4
      ? Math.min(...frets.filter((fret) => fret > 0))
      : 1

  return {
    base,
    frets: frets.map((fret) => (fret > 0 ? fret - base + 1 : fret)),
    barres: (barres ?? [])
      .map((barre) => barre - base + 1)
      .filter((barre) => barre > 0),
    fingers: frets.map((_, index) => voicing.fingers?.[index] ?? 0),
  }
}

/**
 * Index every shape in one instrument's library by pitch class + quality.
 * Enharmonic spellings such as C#/Db and A#/Bb therefore resolve to the same
 * diagrams.
 */
function indexShapes(
  db: RawChordsDb,
  tuning: number[],
): Map<string, ChordShape[]> {
  const index = new Map<string, ChordShape[]>()

  for (const entries of Object.values(db.chords)) {
    for (const entry of entries) {
      const quality = QUALITY_BY_SUFFIX[entry.suffix]
      if (!quality) continue

      const root = parseChordName(entry.key)?.pitchClass
      if (root === undefined) continue

      const id = `${root}:${quality}`
      const shapes = index.get(id) ?? []

      for (const voicing of entry.voicings) {
        const shape = shapeFromVoicing(voicing)

        if (!spellsChord(shape, root, quality, tuning)) continue
        if (shapes.some((existing) => isSameShape(existing, shape))) continue

        shapes.push(shape)
      }

      index.set(id, shapes)
    }
  }

  return index
}

const shapesByInstrument: Record<Instrument, Map<string, ChordShape[]>> = {
  guitar: indexShapes(
    rawGuitarDb as unknown as RawChordsDb,
    INSTRUMENTS.guitar.tuning,
  ),
  ukulele: indexShapes(
    rawUkuleleDb as unknown as RawChordsDb,
    INSTRUMENTS.ukulele.tuning,
  ),
}

export const DEFAULT_CHORDS = 'C G Am F'

export function parseChordInput(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean)
}

export function resolveChord(
  input: string,
  instrument: Instrument = 'guitar',
): ResolvedChord {
  const strings = INSTRUMENTS[instrument].tuning.length

  if (/^(NC|N\.C\.)$/i.test(input)) {
    return {
      input,
      displayName: 'NC',
      shapes: [
        {
          base: 1,
          frets: Array<number>(strings).fill(-1),
          barres: [],
          fingers: Array<number>(strings).fill(0),
        },
      ],
    }
  }

  const parsed = parseChordName(input)
  if (!parsed) {
    return { input, displayName: input, shapes: [], error: 'unrecognized' }
  }

  if (!parsed.quality) {
    return { input, displayName: parsed.displayName, shapes: [], error: 'missing' }
  }

  const shapes = shapesByInstrument[instrument].get(
    `${parsed.pitchClass}:${parsed.quality}`,
  )

  if (!shapes || shapes.length === 0) {
    return { input, displayName: parsed.displayName, shapes: [], error: 'missing' }
  }

  return {
    input,
    displayName: parsed.displayName,
    shapes,
  }
}

export function resolveChordList(
  input: string,
  instrument: Instrument = 'guitar',
): ResolvedChord[] {
  return parseChordInput(input).map((name) => resolveChord(name, instrument))
}
