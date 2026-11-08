# Chordbook

A small guitar and ukulele chord viewer built with React, TypeScript and
Vite. Type a space-separated list of chord names and the chord diagrams
update as you type. Hover a chord and use the chevrons to step through
alternative voicings. The current list and the selected voicings are kept in
the URL, so the page can be bookmarked or shared.

![Screenshot of Chordbook](./screenshot.png)

## Getting started

```bash
npm install
npm run dev
```

Open the URL printed by Vite. To create a production build:

```bash
npm run build
npm run preview
```

## Features

- **Live search** — no submit button; diagrams update on every keystroke.
- **Chord aliases** — `CM7` resolves to `Cmaj7`, `CM` to C major and `Cm` to C
  minor. Other common spellings such as `Cmin`, `C-7`, `CΔ7`, `C°`, `Cø` and
  `C+` are also understood.
- **Enharmonic roots** — `C#` and `Db`, `A#` and `Bb`, and other equivalents
  share shapes.
- **Chord variants** — every chord has several voicings. Hover a card to reveal
  small left/right chevrons and step through them; the dots underneath show
  which voicing you are looking at.
- **Fingering** — every dot is labelled with the finger that holds the note
  (1–4, `T` for the thumb), and a barre is labelled with the finger that bars
  it.
- **Shareable URLs** — e.g. `/?chords=C,G,Am,F` (the comma-separated value is
  URL-encoded as needed, so `C#` appears as `C%23`). Selected voicings are
  stored alongside it, e.g. `/?chords=C,G,Am,F&variant=1,0,0,2`.
- **Ukulele mode** — the dropdown next to “Chord shapes” switches between
  guitar and ukulele shapes. Guitar is the default; the choice is kept in the
  URL as `?instrument=ukulele`.
- **Responsive layout** — diagrams are rendered with
  [SVGuitar](https://github.com/omnibrain/svguitar).

## Chord data

All shapes come straight from the
[chords-db](https://github.com/tabsy-gr/chords-db) database (MIT), vendored in
this repository as `src/data/guitar.json` and `src/data/ukulele.json` from the
[tabsy-gr fork](https://github.com/tabsy-gr/chords-db). Those files are the
source of truth for every chord diagram.

`src/lib/chords.ts` maps chords-db suffixes to the qualities the search box
understands, indexes each instrument's shapes by pitch class + quality (so
enharmonic roots such as `C#` and `Db` share diagrams), and drops any voicing
that does not spell the chord it is filed under.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start the Vite dev server |
| `npm run build`   | Type-check and build      |
| `npm run preview` | Preview the production build |
| `npm run lint`    | Run Oxlint                |

## Deployment

Pushing to `master` runs
`.github/workflows/deploy.yml`, builds the app, and deploys `dist` to GitHub
Pages. The workflow sets `VITE_BASE=/chordbook/` so assets resolve correctly
under the project Pages URL:

https://vince.id.au/chordbook/

(`https://vinceau.github.io/chordbook/` redirects there.)

You can also trigger the workflow manually from the Actions tab.
