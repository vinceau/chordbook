import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { ChordCard } from './components/ChordCard'
import {
  DEFAULT_CHORDS,
  parseChordInput,
  resolveChordList,
} from './lib/chords'

const CHORDS_PARAM = 'chords'

const PRESETS = [
  { label: 'C G Am F', value: 'C G Am F' },
  { label: 'Cmaj7 Am7 Dm7 G7', value: 'Cmaj7 Am7 Dm7 G7' },
  { label: 'C#m E B A', value: 'C#m E B A' },
]

function readChordsFromUrl(): string {
  const value = new URLSearchParams(window.location.search).get(CHORDS_PARAM)
  if (value === null) return DEFAULT_CHORDS

  return value.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
}

function writeChordsToUrl(input: string) {
  const params = new URLSearchParams(window.location.search)
  const tokens = parseChordInput(input)

  if (tokens.length > 0) {
    params.set(CHORDS_PARAM, tokens.join(','))
  } else {
    params.delete(CHORDS_PARAM)
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

function App() {
  const [input, setInput] = useState(readChordsFromUrl)
  const inputRef = useRef<HTMLInputElement>(null)
  const chords = useMemo(() => resolveChordList(input), [input])

  useEffect(() => {
    writeChordsToUrl(input)
  }, [input])

  useEffect(() => {
    const handlePopState = () => setInput(readChordsFromUrl())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const choosePreset = (value: string) => {
    setInput(value)
    inputRef.current?.focus()
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
          Guitar chords, <em>at a glance.</em>
        </h1>
        <p className="site-tagline">
          Type chord names separated by spaces. The diagrams update as you
          type.
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

        <div className="examples" aria-label="Example chord progressions">
          <span className="examples__label">Try</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              className="example-chip"
              type="button"
              onClick={() => choosePreset(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <p className="alias-note">
          Alias friendly: capital <strong>M</strong> is major, lowercase{' '}
          <strong>m</strong> is minor. <code>CM7</code> becomes{' '}
          <code>Cmaj7</code>.
        </p>
      </header>

      <main className="content">
        {chords.length > 0 ? (
          <>
            <div className="content__heading">
              <h2>Chord shapes</h2>
              <span className="content__count" aria-live="polite">
                {chords.length} {chords.length === 1 ? 'chord' : 'chords'}
              </span>
            </div>
            <div className="chord-grid">
              {chords.map((chord, index) => (
                <ChordCard key={`${index}:${chord.input}`} chord={chord} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      <footer className="site-footer">
        <p>
          Shapes from the{' '}
          <a
            href="https://github.com/edonv/edonv.github.io/blob/master/js/json/guitar.json"
            target="_blank"
            rel="noreferrer"
          >
            ChordPro guitar library
          </a>
          , drawn with{' '}
          <a href="https://github.com/omnibrain/svguitar" target="_blank" rel="noreferrer">
            SVGuitar
          </a>
          .
        </p>
        <p className="site-footer__hint">
          Your chord list lives in the URL — copy it to share.
        </p>
      </footer>
    </div>
  )
}

export default App
