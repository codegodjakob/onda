import { context as createBuildContext } from 'esbuild'
import { createHash } from 'node:crypto'
import { watch } from 'node:fs'
import { createServer } from 'node:http'
import { readdir, readFile } from 'node:fs/promises'
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

const WATCHED_CODE = /\.(?:css|[cm]?js)$/

// Der Fingerabdruck des Inhalts. Eine unlesbare oder gelöschte Datei gilt als
// verändert — dann soll die Vorschau ruhig neu laden.
async function fingerprint(file) {
  try {
    return createHash('sha1').update(await readFile(file)).digest('hex')
  } catch {
    return 'fehlt'
  }
}

async function watchedFiles(sourceDir) {
  try {
    const entries = await readdir(sourceDir, { recursive: true })
    return entries.filter(name => WATCHED_CODE.test(name)).map(name => resolve(sourceDir, name))
  } catch {
    return []
  }
}

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

// `nachladen: false` macht aus dem Entwicklungsserver einen PRUEFSERVER: er baut und
// liefert weiter, spritzt aber keinen Nachlade-Client in die Seite und schickt kein
// reload-Ereignis.
//
// WARUM DAS SEIN MUSS. Beim Entwickeln ist der Client ein Segen — Datei speichern,
// Seite aktualisiert sich. Als Pruefserver ist er ein Fallstrick: jede Testseite traegt
// dann ein `location.reload()`, das jederzeit feuern kann. Feuert es mitten in einer
// Pruefung, bricht sie mit "Execution context was destroyed, most likely because of a
// navigation" ab — oder, schlimmer, eine Zusicherung schlaegt fehl, weil die Seite
// heimlich neu geladen und ihren Zustand verloren hat. Beides sah am 9. August 2026 im
// Bau wie ein Befund aus und war keiner: zwei verschiedene rote Laeufe, keiner davon in
// 19 Wiederholungen ohne diesen Server reproduzierbar.
//
// Ein Tor, dessen Seiten sich unter ihm selbst neu laden koennen, prueft nicht.
export async function startDevServer({
  root = DEFAULT_ROOT,
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  debounceMs = 80,
  nachladen = true,
  logger = console,
} = {}) {
  const clients = new Set()
  const marks = new Map()
  const pendingReload = new Set()
  const pendingBuild = new Set()
  let closed = false
  let reloadTimer = null
  let forceReload = false

  // Die gemeldeten Dateien lesen und mit dem zuletzt gesehenen Stand vergleichen.
  //
  // Erst hier, am Ende der Entprellung — nicht schon beim Eintreffen der Meldung.
  // writeFile leert eine Datei zuerst und schreibt dann: wer zu früh liest, erwischt
  // sie halbleer und hält das für eine Änderung. Gemessen am 8.8.2026: bei einer
  // 40-MB-Datei lud jede von zehn Runden grundlos neu, bei 200 Byte jede zwanzigste.
  const hasRealChange = async pending => {
    const files = [...pending]
    pending.clear()
    const fresh = await Promise.all(files.map(fingerprint))
    let changed = false
    files.forEach((file, index) => {
      if (marks.get(file) === fresh[index]) return
      marks.set(file, fresh[index])
      changed = true
    })
    return changed
  }

  const sendReload = () => {
    if (!nachladen) return
    for (const client of clients) client.write('event: reload\ndata: changed\n\n')
  }
  const scheduleReload = () => {
    clearTimeout(reloadTimer)
    reloadTimer = setTimeout(async () => {
      reloadTimer = null
      const forced = forceReload
      forceReload = false
      // Die Warteliste wird immer geleert, auch beim erzwungenen Neuladen — sonst
      // schleppt sie einen alten Eintrag mit und löst später ein zweites Mal aus.
      const changed = await hasRealChange(pendingReload)
      if (forced || changed) sendReload()
    }, debounceMs)
  }
  // Ein gelungener Build lädt immer neu — dort steht die Änderung schon fest.
  const requestReload = () => {
    forceReload = true
    scheduleReload()
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
        ? (nachladen ? injectLiveClient(data.toString('utf8')) : data.toString('utf8'))
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

  const buildContext = await createBuildContext({
    entryPoints: [resolve(root, 'src/editor.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'AIWT',
    outfile: resolve(root, 'dist/editor.bundle.js'),
    logLevel: 'silent',
  })
  try {
    await buildContext.rebuild()
  } catch (error) {
    for (const detail of error.errors ?? [error]) logger.error?.(detail.text ?? detail.message)
    await buildContext.dispose()
    throw error
  }

  let buildTimer = null
  let buildQueue = Promise.resolve()
  const scheduleJavaScriptBuild = () => {
    clearTimeout(buildTimer)
    buildTimer = setTimeout(() => {
      buildTimer = null
      buildQueue = buildQueue.then(async () => {
        if (!(await hasRealChange(pendingBuild))) return
        try {
          const result = await buildContext.rebuild()
          if (result.errors.length) {
            for (const detail of result.errors) logger.error?.(detail.text)
            return
          }
          requestReload()
        } catch (error) {
          for (const detail of error.errors ?? [error]) logger.error?.(detail.text ?? detail.message)
        }
      })
    }, Math.max(debounceMs, 80))
  }

  // Onda lädt nur neu, wenn eine Datei wirklich anders ist als zuletzt gesehen.
  //
  // macOS reicht beim Anhängen des Wächters auch Meldungen aus der Vergangenheit
  // nach. Bis zum 8.8.2026 hielt hier ein Wartefenster von debounceMs + 20 dagegen —
  // ein Wettlauf gegen das Betriebssystem, den das Betriebssystem manchmal gewann:
  // gemessen kam die Meldung für eine unveränderte style.css erst nach 62 ms und
  // löste ein grundloses Neuladen aus. Mit dem Wartefenster war etwa jeder
  // vierzigste Lauf von dev-server.test.mjs rot, ohne es 37 von 40. Der Vergleich am
  // Inhalt kennt keine Frist und braucht deshalb auch keine.
  const indexHtml = resolve(root, 'index.html')
  const sourceDir = resolve(root, 'src')
  await Promise.all([indexHtml, ...(await watchedFiles(sourceDir))].map(
    async file => { marks.set(file, await fingerprint(file)) },
  ))

  const fileWatchers = [
    watch(indexHtml, () => {
      pendingReload.add(indexHtml)
      scheduleReload()
    }),
    watch(sourceDir, { recursive: true }, (_event, filename) => {
      if (!filename || !WATCHED_CODE.test(filename)) return
      const file = resolve(sourceDir, filename)
      if (filename.endsWith('.css')) {
        pendingReload.add(file)
        scheduleReload()
      } else {
        pendingBuild.add(file)
        scheduleJavaScriptBuild()
      }
    }),
  ]

  try {
    await new Promise((resolveListening, rejectListening) => {
      const onError = error => rejectListening(error)
      server.once('error', onError)
      server.listen(port, host, () => {
        server.off('error', onError)
        resolveListening()
      })
    })
  } catch (error) {
    for (const watcher of fileWatchers) watcher.close()
    await buildContext.dispose()
    throw error
  }

  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : port
  return {
    host,
    port: actualPort,
    url: `http://${host}:${actualPort}/`,
    scheduleReload: requestReload,
    async close() {
      if (closed) return
      closed = true
      clearTimeout(reloadTimer)
      clearTimeout(buildTimer)
      for (const watcher of fileWatchers) watcher.close()
      for (const client of clients) client.end()
      clients.clear()
      const serverClosed = new Promise(resolveClosed => server.close(resolveClosed))
      server.closeAllConnections()
      await serverClosed
      await buildQueue
      await buildContext.dispose()
    },
  }
}

// --kein-nachladen: als Pruefserver laufen. Siehe die Begruendung an startDevServer.
function cliNachladen(args) {
  return !args.includes('--kein-nachladen')
}

function cliPort(args) {
  const token = args.find(argument => argument.startsWith('--port='))
  if (!token) return DEFAULT_PORT
  const port = Number(token.slice('--port='.length))
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Ungültiger Port: ${token}`)
  }
  return port
}

const isMain = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  let running = null
  try {
    const argumente = process.argv.slice(2)
    const port = cliPort(argumente)
    const nachladen = cliNachladen(argumente)
    running = await startDevServer({ port, nachladen })
    console.log(`Onda ${nachladen ? 'Live' : 'Pruefserver'}: ${running.url}`)

    let stopping = false
    const stop = async () => {
      if (stopping) return
      stopping = true
      await running.close()
      process.exit(0)
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  } catch (error) {
    let hint = ''
    try {
      const port = cliPort(process.argv.slice(2))
      if (error?.code === 'EADDRINUSE') hint = `Port ${port} ist bereits belegt. `
    } catch {
      // The original validation message below is more precise.
    }
    console.error(`Onda Live konnte nicht starten. ${hint}${error.message}`)
    process.exitCode = 1
  }
}
