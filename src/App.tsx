import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { ChordCard } from './components/ChordCard'
import {
  DEFAULT_CHORDS,
  INSTRUMENTS,
  parseChordInput,
  resolveChordList,
  type Instrument,
} from './lib/chords'

const CHORDS_PARAM = 'chords'
const VARIANTS_PARAM = 'variant'
const INSTRUMENT_PARAM = 'instrument'

function readInstrument(value: string | null): Instrument {
  return value === 'ukulele' ? 'ukulele' : 'guitar'
}

interface UrlState {
  /** The raw chord names, as they appear in the search box. */
  input: string
  /** Selected shape per chord, matched to the chord list by position. */
  variants: number[]
  /** Which instrument's shapes to show. */
  instrument: Instrument
}

function readStateFromUrl(search: string): UrlState {
  const params = new URLSearchParams(search)
  const value = params.get(CHORDS_PARAM)
  const input =
    value === null
      ? DEFAULT_CHORDS
      : value.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()

  const selected = params.get(VARIANTS_PARAM)?.split(',') ?? []
  const variants = parseChordInput(input).map((_, index) => {
    const variant = Number.parseInt(selected[index] ?? '', 10)
    return Number.isInteger(variant) && variant > 0 ? variant : 0
  })

  return {
    input,
    variants,
    instrument: readInstrument(params.get(INSTRUMENT_PARAM)),
  }
}

function writeStateToUrl(
  input: string,
  variants: number[],
  instrument: Instrument,
) {
  const params = new URLSearchParams(window.location.search)
  const tokens = parseChordInput(input)

  if (tokens.length > 0) {
    params.set(CHORDS_PARAM, tokens.join(','))
  } else {
    params.delete(CHORDS_PARAM)
  }

  const selected = tokens.map((_, index) => {
    const variant = variants[index] ?? 0
    return Number.isFinite(variant) ? Math.max(0, Math.trunc(variant)) : 0
  })

  if (selected.some((variant) => variant > 0)) {
    params.set(VARIANTS_PARAM, selected.join(','))
  } else {
    params.delete(VARIANTS_PARAM)
  }

  if (instrument === 'ukulele') {
    params.set(INSTRUMENT_PARAM, instrument)
  } else {
    params.delete(INSTRUMENT_PARAM)
  }

  const query = params.toString().replace(/%2C/g, ',')
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

  if (nextUrl !== currentUrl) {
    window.history.replaceState(window.history.state, '', nextUrl)
  }
}

function ChordGridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 3.5v25M12.7 3.5v25M19.3 3.5v25M26 3.5v25" />
      <path d="M3.5 8h25M3.5 16h25M3.5 24h25" />
      <circle cx="19.3" cy="16" r="2.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      className="search-box__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.6 15.6 4.1 4.1" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <ChordGridIcon className="empty-state__icon" />
      <h2>No chords yet</h2>
      <p>Start typing above — try “C G Am F”.</p>
    </div>
  )
}

interface AppProps {
  /**
   * Query string to read the first render from. The prerenderer passes the
   * search string of the page it is generating; in the browser this defaults
   * to the current URL.
   */
  initialSearch?: string
}

function App({ initialSearch }: AppProps) {
  const [{ input, variants, instrument }, setUrlState] = useState(() =>
    readStateFromUrl(initialSearch ?? window.location.search),
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const chords = useMemo(
    () => resolveChordList(input, instrument),
    [input, instrument],
  )

  useEffect(() => {
    writeStateToUrl(input, variants, instrument)
  }, [input, variants, instrument])

  useEffect(() => {
    const handlePopState = () =>
      setUrlState(readStateFromUrl(window.location.search))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  /**
   * Keep the chosen shape when a chord stays in the same position, but reset
   * it when the chord itself changes.
   */
  const setInput = (value: string) => {
    setUrlState((state) => {
      const previousTokens = parseChordInput(state.input)
      const nextTokens = parseChordInput(value)

      return {
        ...state,
        input: value,
        variants: nextTokens.map((token, index) =>
          previousTokens[index] === token ? (state.variants[index] ?? 0) : 0,
        ),
      }
    })
  }

  /**
   * The two instruments have different voicing lists, so start each chord
   * over at its first shape when the instrument changes.
   */
  const changeInstrument = (next: Instrument) => {
    setUrlState((state) => ({
      ...state,
      instrument: next,
      variants: parseChordInput(state.input).map(() => 0),
    }))
  }

  const changeVariant = (index: number, variant: number) => {
    setUrlState((state) => {
      const nextVariants = parseChordInput(state.input).map(
        (_, position) => state.variants[position] ?? 0,
      )
      nextVariants[index] = variant

      return { ...state, variants: nextVariants }
    })
  }

  const clearInput = () => {
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="app">
      <div className="app__glow" aria-hidden="true" />

      <header className="site-header">
        <div className="brand">
          <ChordGridIcon className="brand__mark" />
          <span className="brand__name">Chordbook</span>
        </div>

        <h1 className="site-title">
          Chords, <em>at a glance.</em>
        </h1>
        <p className="site-tagline">
          Start by typing some chord names separated by spaces.
        </p>

        <div className="search-box">
          <SearchIcon />
          <input
            ref={inputRef}
            className="search-box__input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="C G Am F"
            aria-label="Chord names"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
          />
          {input ? (
            <button
              className="search-box__clear"
              type="button"
              onClick={clearInput}
              aria-label="Clear chords"
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>
      </header>

      <main className="content">
        {chords.length > 0 ? (
          <>
            <div className="content__heading">
              <h2>Chord shapes</h2>
              <label className="instrument-picker">
                <span className="visually-hidden">Instrument</span>
                <select
                  className="instrument-picker__select"
                  value={instrument}
                  onChange={(event) =>
                    changeInstrument(event.target.value as Instrument)
                  }
                >
                  {Object.entries(INSTRUMENTS).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="chord-grid">
              {chords.map((chord, index) => (
                <ChordCard
                  key={`${index}:${chord.input}`}
                  chord={chord}
                  variant={variants[index] ?? 0}
                  onVariantChange={(variant) => changeVariant(index, variant)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      <footer className="site-footer">
        <p>
          Shapes from{' '}
          <a
            href="https://github.com/tabsy-gr/chords-db"
            target="_blank"
            rel="noreferrer"
          >
            chords-db
          </a>
          , drawn with{' '}
          <a href="https://github.com/omnibrain/svguitar" target="_blank" rel="noreferrer">
            SVGuitar
          </a>
          .
        </p>
        <p className="site-footer__hint">
          Hover or tap a chord for more voicings — your list lives in the URL.
        </p>
      </footer>
    </div>
  )
}

export default App
