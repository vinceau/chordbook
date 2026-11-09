import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// `npm run build` prerenders the default page into this file. Hydrate that
// markup, but only for the URL it was rendered for: shared links carry their
// chord list in the query string, so they are rendered on the client instead.
const { prerenderSearch } = container.dataset

if (
  prerenderSearch !== undefined &&
  prerenderSearch === window.location.search
) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
