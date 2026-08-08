// Das Kanal-Register: die eine Liste der Kanäle, über die Onda mit dem Modell spricht.
//
// Warum es diese Datei gibt: Dieselbe Liste stand vierfach im Projekt, jedes Mal von Hand
// abgeschrieben — und eine der vier Abschriften kannte den Quellen-Kanal nie, obwohl es
// ihn seit dem 8.8.2026 gibt. Eine Liste, die man an vier Stellen nachziehen muss, zieht
// man irgendwann nur an dreien nach. Ab hier steht sie einmal.
//
// DREI NAMEN JE KANAL, weil dieselbe Sache im Projekt tatsächlich drei Namen trägt. Das ist
// gewachsen, nicht gewollt; die Namen umzubenennen wäre ein eigener Umbau. Was diese Datei
// leistet, ist die Zuordnung, die es bisher nirgends gab:
//
//   torName  — so heißt der Kanal am Lauf-Tor (lauf-tor.mjs), das Sperre, Signatur und
//              Journal führt. Wer hier den falschen Namensraum erwischt, merkte es bisher
//              erst zur Laufzeit an einem geworfenen Fehler.
//   aufgabe  — so heißt dieselbe Sache gegenüber dem Modell (agent-tasks.mjs, TASK_TABLE).
//              Nur beim Gespräch stimmen die beiden Namen überein.
//   modul    — die Datei unter app/src/, die den Anfragekontext dieses Kanals baut. Ein
//              dritter Name, und er lässt sich aus keinem der beiden anderen ableiten:
//              der Kanal 'interview' baut seinen Kontext in verstaendnis-kontext.mjs, die
//              Aufgabe 'hinweise' in hinweis-kontext.mjs. Wer ihn errechnen wollte, läge
//              bei drei von fünf Kanälen falsch.
//
// DIESE DATEI IMPORTIERT NICHTS, und das ist eine Entscheidung, keine Bequemlichkeit.
// Holte sich das Register die Ausführung eines Kanals selbst, entstünde ein Ring:
// Register -> Kanal -> Ausführung -> Lauf-Tor -> Register. Solche Ringe hat das Projekt
// heute keinen einzigen, und sie sollen keinen bekommen: ein Ring macht aus fünf Dateien,
// die man einzeln lesen kann, einen Knoten, den man nur noch ganz versteht oder gar nicht.
// Wer eine Ausführung braucht, bekommt sie hereingereicht — als Fabrik, die der Aufrufer
// mitbringt. Der Wächter betrieb/waechter/kanal-register.mjs hält die Regel fest.
//
// WAS HIER ABSICHTLICH NICHT STEHT: das JSON-Schema, mit dem eine Antwort geprüft wird.
// Die Schemata stehen in agent-tasks.mjs, direkt neben dem Anfragebau, der sie benutzt.
// Zöge das Register sie zu sich herüber, müsste es aus agent-tasks.mjs importieren —
// und agent-tasks.mjs importiert dieses Register. Genau der Ring von oben. Das Register
// nennt stattdessen den Aufgabennamen, und der ist der Schlüssel in die Schema-Tabelle.
//
// EIN SECHSTER KANAL: eine Zeile hier, eine Datei unter app/src/ für den Kontextbau, ein
// Eintrag in der Schema-Tabelle von agent-tasks.mjs — und eine bewusste Änderung an
// app/test/lauf-tor.test.mjs, wo die Tor-Liste absichtlich von Hand festgenagelt bleibt,
// damit ein Kanal nicht stillschweigend dazukommt.

// MODELL UND TOKEN-BUDGET stehen mit im Register, weil sie zum Kanal gehören und nicht zur
// Anfrage, die daraus gebaut wird. Warum die Zahlen so aussehen, wie sie aussehen:
//
// Auf claude-opus-5 ist adaptives Denken standardmäßig an, und maxTokens deckelt DENKEN UND
// ANTWORT zusammen — es gibt kein getrenntes Denk-Budget. Bei 16000 lief das regelmäßig ins
// Token-Ende, bevor die eigentliche Antwort fertig war; das Gateway verwirft einen solchen
// Lauf komplett (agent-gateway.mjs): bezahlt und ohne Ergebnis. Deshalb 32000 für die
// nicht streamenden Aufgaben. Das Gespräch streamt sichtbar für die Autorin oder den Autor,
// ein hoher Wert ist dort unkritisch (64000).
//
// Erweiterungen und Quellenthemen laufen bewusst auf dem starken Modell: bei beiden hängt
// der ganze Wert daran, das Naheliegende zu erkennen und zu verwerfen. Genau das kann ein
// Routine-Modell nicht — es liefert zuverlässig den erwartbaren Gedanken, also den einen,
// den die Autorin oder der Autor schon hatte, und bei den Quellen die Bibliotheksrubrik
// „Web-Quellen" und „Sonstiges", die jeder Mensch selbst hinbekommt. Die Ausgabe der
// Quellenthemen ist dabei klein (Namen, ein Satz, Kennungen), 8000 reichen weit; nur
// gedacht wird viel, und das teilt sich dasselbe Budget.
export const KANAELE = Object.freeze([
  Object.freeze({ torName: 'interview', aufgabe: 'verstaendnis', modul: 'verstaendnis-kontext.mjs', modell: 'stark', maxTokens: 32000, stream: false }),
  Object.freeze({ torName: 'chat', aufgabe: 'chat', modul: 'chat-kontext.mjs', modell: 'stark', maxTokens: 64000, stream: true }),
  Object.freeze({ torName: 'hinweis', aufgabe: 'hinweise', modul: 'hinweis-kontext.mjs', modell: 'stark', maxTokens: 32000, stream: false }),
  Object.freeze({ torName: 'erweiterung', aufgabe: 'erweiterungen', modul: 'erweiterung-kontext.mjs', modell: 'stark', maxTokens: 32000, stream: false }),
  Object.freeze({ torName: 'quellen', aufgabe: 'quellenthemen', modul: 'quellen-kontext.mjs', modell: 'stark', maxTokens: 8000, stream: false }),
])

// Die Reihenfolge ist die des Lauf-Tors und wird von app/test/lauf-tor.test.mjs von Hand
// nachgehalten. Sie umzustellen ist erlaubt, aber nie beiläufig: der Test wird rot.
export const TOR_NAMEN = Object.freeze(KANAELE.map(kanal => kanal.torName))
export const AUFGABEN_NAMEN = Object.freeze(KANAELE.map(kanal => kanal.aufgabe))

export function kanalNachTorName(torName) {
  return KANAELE.find(kanal => kanal.torName === torName) || null
}

export function kanalNachAufgabe(aufgabe) {
  return KANAELE.find(kanal => kanal.aufgabe === aufgabe) || null
}
