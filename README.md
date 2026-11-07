# Chordbook

A small guitar chord viewer built with React, TypeScript and Vite. Type a
space-separated list of chord names and the chord diagrams update as you type.
The current list is kept in the `chords` URL query parameter, so the page can be
bookmarked or shared.

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
- **Shareable URLs** — e.g. `/?chords=C,G,Am,F` (the comma-separated value is
  URL-encoded as needed, so `C#` appears as `C%23`).
- **Responsive layout** — diagrams are rendered with
  [SVGuitar](https://github.com/omnibrain/svguitar).

## Chord data

The shapes live in `src/data/guitar.json` and come from the
[ChordPro guitar chord library](https://github.com/edonv/edonv.github.io/blob/master/js/json/guitar.json).
`src/lib/chords.ts` resolves aliases and indexes the shapes by pitch class, so
alternate spellings and enharmonic roots work automatically.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start the Vite dev server |
| `npm run build`   | Type-check and build      |
| `npm run preview` | Preview the production build |
| `npm run lint`    | Run Oxlint                |

## Deployment

Pushing to `main` or `master` runs
`.github/workflows/deploy.yml`, builds the app, and deploys `dist` to GitHub
Pages. The workflow sets `VITE_BASE=/chordbook/` so assets resolve correctly
under the project Pages URL:

https://vince.id.au/chordbook/

(`https://vinceau.github.io/chordbook/` redirects there.)

You can also trigger the workflow manually from the Actions tab.
