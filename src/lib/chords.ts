import rawChordData from '../data/guitar.json'
import rawVariantData from '../data/variants.json'

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

interface RawChordEntry {
  name?: string
  base?: number
  frets?: number[]
  copy?: string
}

export interface ChordShape {
  /** The first fret shown in the diagram. */
  base: number
  /** Six fret values, from the low E string to the high E string. */
  frets: number[]
  /** The key used by the chord library, e.g. "Cmaj7". */
  sourceName: string
  /**
   * Frets (relative to `base`) that are held as a barre. Only the extra
   * shapes from chords-db know this; the primary shapes have to be inferred.
   */
  barres?: number[]
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

const chordData = rawChordData as unknown as Record<string, RawChordEntry>

/** [base fret, frets relative to base, barre frets relative to base] */
type VariantTuple = [number, number[], number[]]

const variantData = rawVariantData as unknown as Record<string, VariantTuple[]>

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

/**
 * The source file uses "copy" to point at another chord shape. Follow those
 * links until a concrete set of frets is found.
 */
function resolveRawShape(
  key: string,
  seen: Set<string> = new Set(),
): ChordShape | null {
  if (seen.has(key)) return null
  seen.add(key)

  const entry = chordData[key]
  if (!entry) return null

  if (entry.copy) return resolveRawShape(entry.copy, seen)

  if (!entry.frets || entry.frets.length !== 6) return null

  return {
    base: entry.base ?? 1,
    frets: entry.frets,
    sourceName: entry.name ?? key,
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
 * Index every concrete shape by pitch class + quality. Enharmonic spellings
 * such as C#/Db and A#/Bb therefore resolve to the same diagrams.
 *
 * The library in `guitar.json` comes first (so it stays the default shape for
 * every chord) and the additional voicings from chords-db follow after it.
 */
const shapesByNoteAndQuality = (() => {
  const index = new Map<string, ChordShape[]>()

  const add = (id: string, shape: ChordShape) => {
    const shapes = index.get(id) ?? []
    if (shapes.some((existing) => isSameShape(existing, shape))) return

    shapes.push(shape)
    index.set(id, shapes)
  }

  for (const key of Object.keys(chordData)) {
    const parsed = parseChordName(key)
    const shape = resolveRawShape(key)
    if (!parsed || !parsed.quality || !shape || parsed.quality === 'nc') continue

    add(`${parsed.pitchClass}:${parsed.quality}`, shape)
  }

  for (const [id, variants] of Object.entries(variantData)) {
    for (const [base, frets, barres] of variants) {
      add(id, { base, frets, sourceName: id, barres })
    }
  }

  return index
})()

export const DEFAULT_CHORDS = 'C G Am F'

export function parseChordInput(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean)
}

export function resolveChord(input: string): ResolvedChord {
  if (/^(NC|N\.C\.)$/i.test(input)) {
    return {
      input,
      displayName: 'NC',
      shapes: [
        {
          base: 1,
          frets: [-1, -1, -1, -1, -1, -1],
          sourceName: 'NC',
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

  const shapes = shapesByNoteAndQuality.get(
    `${parsed.pitchClass}:${parsed.quality}`,
  )

  if (!shapes) {
    return { input, displayName: parsed.displayName, shapes: [], error: 'missing' }
  }

  return {
    input,
    displayName: parsed.displayName,
    shapes,
  }
}

export function resolveChordList(input: string): ResolvedChord[] {
  return parseChordInput(input).map(resolveChord)
}
