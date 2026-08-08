// EIN EIGENER SERVER FÜR JEDEN RAUCHTEST — und das ist keine Bequemlichkeit, sondern
// die Behebung einer Falle, die zweimal falsche Rot-Meldungen erzeugt hat.
//
// Vorher stand in neun Rauchtests `process.env.AIWT_URL || 'http://127.0.0.1:4173/'`.
// Der Port 4173 ist aber nicht reserviert: er gehört dem, der ihn zuerst belegt. Läuft
// gerade eine zweite Arbeitskopie des Projekts — bei paralleler Arbeit die Regel und
// nicht die Ausnahme —, dann prüfte der Test deren Code und nicht den eigenen. Das
// Ergebnis war entweder ein grüner Lauf über fremdem Code oder, häufiger, ein Abbruch
// im Zeitlimit, weil die fremde Fassung das gesuchte Element gar nicht hat.
//
// `mac/build.sh` lief deshalb zufällig rot, ohne dass etwas kaputt war. Wer baut, muss
// aber wissen, ob er etwas zerbrochen hat.
//
// Jetzt macht jeder Rauchtest seinen eigenen Server auf einem Port, den das
// Betriebssystem vergibt (`listen(0)`). Zwei Läufe können sich nicht mehr begegnen.
// AIWT_URL bleibt erhalten: wer ausdrücklich gegen einen laufenden Server prüfen will,
// setzt sie und bekommt genau den.

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

const mimeByExtension = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

// Liefert { baseUrl, stop }. `stop` ist immer aufrufbar, auch wenn gar kein eigener
// Server läuft — so braucht die Abbruchbehandlung im Test keine Fallunterscheidung.
export async function starteAppServer() {
  if (process.env.AIWT_URL) {
    return { baseUrl: process.env.AIWT_URL, stop: async () => {} }
  }

  const server = createServer(async (request, response) => {
    try {
      const pfad = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
      const ziel = resolve(appRoot, pfad === '/' ? 'index.html' : pfad.slice(1))
      // Nichts ausserhalb von app/ ausliefern — ein Test soll das Dateisystem nicht
      // oeffnen, auch nicht auf dem eigenen Rechner.
      if (ziel !== appRoot && !ziel.startsWith(`${appRoot}${sep}`)) {
        response.writeHead(403).end()
        return
      }
      const inhalt = await readFile(ziel)
      response.writeHead(200, {
        'content-type': mimeByExtension[extname(ziel)] || 'application/octet-stream',
      })
      response.end(inhalt)
    } catch {
      response.writeHead(404).end()
    }
  })

  await new Promise(horcht => server.listen(0, '127.0.0.1', horcht))
  // Der Server soll den Prozess nicht am Leben halten. Bricht ein Test mitten im Lauf
  // ab, endet er trotzdem — statt bis zum Zeitlimit der Ablaufsteuerung zu haengen.
  server.unref()

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/`,
    stop: () => new Promise(zu => server.close(zu)),
  }
}
