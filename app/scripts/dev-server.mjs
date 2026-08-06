import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEFAULT_HOST = '127.0.0.1'
export const DEFAULT_PORT = 4173

const DEFAULT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const MIME = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2'],
])

const LIVE_CLIENT = `<script data-onda-dev-reload>
(() => {
  const events = new EventSource('/__onda_reload')
  events.addEventListener('reload', () => location.reload())
})()
</script>`

function safeTarget(root, pathname) {
  const decoded = decodeURIComponent(pathname)
  const requested = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '')
  const target = resolve(root, requested)
  const inside = relative(root, target)
  if (inside.startsWith(`..${sep}`) || inside === '..' || isAbsolute(inside)) return null
  return target
}

function injectLiveClient(html) {
  return html.includes('</body>')
    ? html.replace('</body>', `${LIVE_CLIENT}</body>`)
    : `${html}${LIVE_CLIENT}`
}

export async function startDevServer({
  root = DEFAULT_ROOT,
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  debounceMs = 80,
} = {}) {
  const clients = new Set()
  let closed = false
  let reloadTimer = null

  const broadcast = () => {
    reloadTimer = null
    for (const client of clients) client.write('event: reload\ndata: changed\n\n')
  }
  const scheduleReload = () => {
    clearTimeout(reloadTimer)
    reloadTimer = setTimeout(broadcast, debounceMs)
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${host}`)
      if (url.pathname === '/__onda_reload') {
        response.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        })
        response.flushHeaders()
        response.write('retry: 500\n\n')
        clients.add(response)
        request.once('close', () => clients.delete(response))
        return
      }

      const target = safeTarget(root, url.pathname)
      if (!target) {
        response.writeHead(403).end('Forbidden')
        return
      }
      const data = await readFile(target)
      const body = target === resolve(root, 'index.html')
        ? injectLiveClient(data.toString('utf8'))
        : data
      response.writeHead(200, {
        'content-type': MIME.get(extname(target)) ?? 'application/octet-stream',
        'cache-control': 'no-store',
      })
      response.end(body)
    } catch {
      response.writeHead(404).end('Not found')
    }
  })

  await new Promise((resolveListening, rejectListening) => {
    const onError = error => rejectListening(error)
    server.once('error', onError)
    server.listen(port, host, () => {
      server.off('error', onError)
      resolveListening()
    })
  })

  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : port
  return {
    host,
    port: actualPort,
    url: `http://${host}:${actualPort}/`,
    scheduleReload,
    async close() {
      if (closed) return
      closed = true
      clearTimeout(reloadTimer)
      for (const client of clients) client.end()
      clients.clear()
      await new Promise(resolveClosed => server.close(resolveClosed))
    },
  }
}
