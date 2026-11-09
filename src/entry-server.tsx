import { renderToString } from 'react-dom/server'
import App from './App.tsx'

/**
 * Render a page to HTML at build time. `search` is the query string of the
 * page being generated, including its leading `?` (as in
 * `window.location.search`).
 */
export function render(search: string): string {
  return renderToString(<App initialSearch={search} />)
}
