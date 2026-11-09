import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from '../dist-ssr/entry-server.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'dist/index.html')

// The default page. Shared links keep their state in the query string and are
// rendered by the client, so the static markup only has to describe this one.
const search = ''
const markup = render(search)

const outlet = '<div id="root"><!--ssr-outlet--></div>'
const template = await readFile(file, 'utf8')

if (!template.includes(outlet)) {
  throw new Error(`Prerender outlet not found in ${file}`)
}

const attributes = `data-prerender-search="${escapeAttribute(search)}"`
const prerendered = `<div id="root" ${attributes}>${markup}</div>`

await writeFile(file, template.replace(outlet, prerendered))

// The README screenshot is not part of the site source, but social previews
// should be able to use it.
await copyFile(join(root, 'screenshot.png'), join(root, 'dist/screenshot.png'))

console.log('Prerendered dist/index.html')

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}
