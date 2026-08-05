function mitZeitlimit(arbeit, timeoutMs) {
  return new Promise(resolve => {
    let erledigt = false
    const timer = setTimeout(() => {
      if (erledigt) return
      erledigt = true
      resolve({ ok: false, wert: null })
    }, timeoutMs)

    Promise.resolve()
      .then(arbeit)
      .then(wert => {
        if (erledigt) return
        erledigt = true
        clearTimeout(timer)
        resolve({ ok: true, wert })
      })
      .catch(() => {
        if (erledigt) return
        erledigt = true
        clearTimeout(timer)
        resolve({ ok: false, wert: null })
      })
  })
}

/**
 * Prueft die beiden asynchronen Rueckkanaele der Mac-Huelle. Ein Rueckruf ist
 * die Wahrheit; die Frist begrenzt nur einen wirklich ausgebliebenen Rueckruf.
 */
export async function pruefeNativeBruecken({ bildSpeichern, zustandSpeichern, timeoutMs = 8000 } = {}) {
  if (typeof bildSpeichern !== 'function' || typeof zustandSpeichern !== 'function') {
    throw new TypeError('bildSpeichern und zustandSpeichern muessen Funktionen sein')
  }
  const frist = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 8000
  // Parallel statt nacheinander: Ein kalter, unsichtbarer WKWebView kann beide
  // Rueckrufe um mehrere Sekunden verzoegern. So bleiben trotzdem beide innerhalb
  // der zehn Sekunden, die die native Huelle der gesamten Startprobe einraeumt.
  const [bild, zustand] = await Promise.all([
    mitZeitlimit(bildSpeichern, frist),
    mitZeitlimit(zustandSpeichern, frist),
  ])
  return {
    imgBridge: bild.ok && typeof bild.wert === 'string' && bild.wert.startsWith('aiwt-img://'),
    ackOk: zustand.ok && zustand.wert === true,
  }
}
