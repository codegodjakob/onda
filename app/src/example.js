// Beispiel-Projekt „Calm Technology" — echte, editierbare Startdaten.
// Wird einmalig als eigenes Projekt angelegt (nicht als Kulisse über jedem Text).
// Struktur/Narrative gehören zum Text, Material zum Projekt.

let seq = 0
function sid(prefix) { return prefix + Date.now().toString(36) + (seq++).toString(36) }

export function buildExampleUnderstanding() {
  return {
    task: 'Ein kurzer argumentativer Essay über Calm Technology in Schreibsoftware.',
    audience: ['Designerinnen und Designer', 'Menschen, die konzentriert schreiben'],
    desiredEffect: 'Das Prinzip verstehen und auf konkrete Produktentscheidungen übertragen können.',
    evidenceStandard: 'Historische Aussagen mit sichtbarer Primärquelle belegen; die Übertragung auf Schreibsoftware als Einordnung kennzeichnen.',
    protectedIntentions: ['Die Formel „volle Kraft, leise Präsentation“ als Schlussgedanke erhalten.'],
    openQuestions: ['Soll der Text stärker wissenschaftlich oder essayistisch argumentieren?'],
    updatedAt: 0,
  }
}

export function buildExampleAgentMessages() {
  const text = 'Beim Weiterlesen ist mir eine allgemeinere Frage aufgefallen: Soll der Text Aufmerksamkeit als individuelle Fähigkeit oder als gestaltete Bedingung behandeln?'
  return [{
    id: 'example-agent-initiative',
    status: 'new',
    earliestAt: 0,
    text,
    thread: [{ id: 'message-example-0', role: 'agent', text, at: 0 }],
  }]
}

// Tiefe Kopie mit frischen IDs — jeder Aufruf liefert unabhängige Objekte.
export function buildExampleStructure() {
  return [
    { id: sid('b'), title: 'Einleitung', role: 'Eröffnung',
      content: 'Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird.',
      why: 'Öffnet das Thema über eine Alltagserfahrung und stellt die Leitfrage, bevor Begriffe fallen.',
      sources: [{ label: 'Weiser & Brown (1996)', url: 'https://calmtech.com/papers' }], note: null, children: [
        { id: sid('b'), title: 'Relevanz', role: 'Motivation', content: 'Ständige Benachrichtigungen fragmentieren die Aufmerksamkeit — ruhige Werkzeuge sind die Gegenbewegung.', why: 'Begründet, warum das Thema jetzt wichtig ist.', sources: [{ label: 'Mark, G. (2023): Attention Span', url: '' }], note: null, children: [] },
        { id: sid('b'), title: 'Leitfrage', role: 'Frage', content: 'Wie muss ein Schreibwerkzeug gestaltet sein, damit es das Denken unterstützt statt es zu unterbrechen?', why: 'Verwandelt die Beobachtung in eine beantwortbare Frage — der Anker des ganzen Textes.', sources: [], note: null, children: [] },
      ]},
    { id: sid('b'), title: 'Hauptteil', role: 'Argumentation', content: '', why: 'Trägt die Argumentation von den Prinzipien zur Anwendung.', sources: [], note: null, children: [
      { id: sid('b'), title: 'Prinzipien', role: 'Fundament', content: 'Weiser und Brown formulierten: Technik soll sich an den Rändern der Aufmerksamkeit bewegen und nahtlos zwischen Zentrum und Peripherie wechseln.', why: 'Setzt den Maßstab, an dem alle Beispiele gemessen werden.', sources: [{ label: 'Weiser & Brown (1996)', url: 'https://calmtech.com/papers' }, { label: 'Case, A. (2015): Calm Technology', url: 'https://calmtech.com' }], note: null, children: [] },
      { id: sid('b'), title: 'Beispiele', role: 'Anschauung', content: 'Die Teekanne pfeift erst, wenn es relevant ist. Eine Statusleuchte informiert, ohne zu unterbrechen.', why: 'Macht die abstrakten Prinzipien an vertrauten Objekten greifbar.', sources: [{ label: 'Case, A. (2015)', url: 'https://calmtech.com' }],
        note: { text: 'Hier fehlt der Übergang von den Beispielen zur Schreib-Domäne.', why: 'Die Beispiele enden bei physischen Objekten (Teekanne, Statusleuchte), der nächste Baustein springt direkt zur Software. Ein Satz, der das Gemeinsame benennt — „informieren ohne zu unterbrechen" — würde die Brücke schlagen.', fix: 'Was Teekanne und Statusleuchte verbindet, ist ein Entwurfsprinzip: Information ohne Unterbrechung. Genau dieses Prinzip lässt sich auf Software übertragen.', resolved: false },
        children: [] },
      { id: sid('b'), title: 'Übertragung aufs Schreiben', role: 'Transfer', content: 'Für Schreibsoftware heißt das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss.', why: 'Führt die Prinzipien in die eigentliche Domäne des Textes — der Kern der Eigenleistung.', sources: [], note: null, children: [] },
    ]},
    { id: sid('b'), title: 'Schluss', role: 'Auflösung', content: 'Ruhige Technik ist kein Verzicht auf Funktionen, sondern eine Haltung: volle Kraft, leise Präsentation.', why: 'Löst die Leitfrage auf und verdichtet die Erkenntnis zu einer Formel.', sources: [], note: null, children: [] },
  ]
}

// Findet die id eines Bausteins über seinen Titel (der Anker eines Erzähl-Punkts).
function idByTitle(struct, title) {
  for (const b of struct) {
    if (b.title === title) return b.id
    const r = idByTitle(b.children || [], title); if (r) return r
  }
  return null
}

// Die Erzählfäden werden an Bausteine geankert (blockId) — daher braucht diese
// Funktion die konkrete Struktur mit ihren IDs. color = Index in der Faden-Palette.
export function buildExampleNarrative(struct) {
  const at = t => idByTitle(struct, t)
  return [
    { id: sid('n'), title: 'Problem: laute Technik', color: 0, steps: [
      { id: sid('s'), h: 'Eröffnung', p: 'Der Text beginnt mit einer vertrauten Erfahrung: Geräte, die sich ständig melden. Die Leserin erkennt ihr eigenes Genervt-Sein wieder — das Problem braucht keine Statistik, es ist fühlbar.', open: false, blockId: at('Einleitung') },
      { id: sid('s'), h: 'Vertiefung', p: 'An Teekanne und Statusleuchte wird sichtbar, dass es auch anders geht: dieselbe Information, aber ohne Unterbrechung. Das Problem bekommt eine Kontrastfolie.', open: false, blockId: at('Beispiele') },
      { id: sid('s'), h: 'Auflösung', p: 'Der Schluss kehrt zur Anfangserfahrung zurück und zeigt: Lautheit ist keine Eigenschaft von Technik, sondern eine Design-Entscheidung — sie lässt sich anders treffen.', open: false, blockId: at('Schluss') },
    ]},
    { id: sid('n'), title: 'These: Peripherie statt Alarm', color: 1, steps: [
      { id: sid('s'), h: 'Ankündigung', p: 'Die Leitfrage deutet die These bereits an: Ein gutes Werkzeug unterstützt das Denken, statt es zu unterbrechen — Aufmerksamkeit ist die knappe Ressource.', open: false, blockId: at('Leitfrage') },
      { id: sid('s'), h: 'Begründung', p: 'Mit Weiser und Brown erhält die These ihr Fundament: Technik kann zwischen Zentrum und Peripherie der Aufmerksamkeit wechseln. Ruhe ist machbar, nicht nur wünschenswert.', open: false, blockId: at('Prinzipien') },
      { id: sid('s'), h: 'Noch offen: Rückbindung im Schluss', p: 'Die These wird im Schluss bisher nur angedeutet. Es fehlt der Satz, der sie ausdrücklich als Antwort auf die Leitfrage feststellt.', open: true, blockId: at('Schluss') },
    ]},
    { id: sid('n'), title: 'Methode: vom Prinzip zum Werkzeug', color: 2, steps: [
      { id: sid('s'), h: 'Maßstab setzen', p: 'Zuerst wird der Bewertungsmaßstab etabliert — was „ruhig" überhaupt heißt. Ohne ihn wären die Beispiele beliebig.', open: false, blockId: at('Prinzipien') },
      { id: sid('s'), h: 'Anwenden', p: 'Dann wird der Maßstab auf Schreibsoftware angewendet: Werkzeuge im Kontext, Hinweise in der Peripherie. Hier entsteht die Eigenleistung des Textes.', open: false, blockId: at('Übertragung aufs Schreiben') },
    ]},
  ]
}

export function buildExampleCoach() {
  return [
    { id: sid('c'), type: 'Struktur', category: 'structure', priority: 'critical', tone: 'warn', status: 'open', createdAt: Date.now(),
      text: 'Der Abschnitt „Beispiele" kommt vor den „Prinzipien" — die Argumentation trägt besser andersherum.',
      why: 'Deine geplante Struktur sieht Prinzipien → Beispiele vor. Im Text ist die Reihenfolge aktuell vertauscht. Leser brauchen erst den Maßstab („was heißt ruhig?"), dann die Anschauung — sonst wirken die Beispiele beliebig und ihre Pointe verpufft.',
      narrative: 'Im Faden „Methode: vom Prinzip zum Werkzeug" ist der erste Schritt „Maßstab setzen". Wird er übersprungen, bricht dieser Handlungsstrang an seiner ersten Stelle — die Narrative verlöre ihre Begründungslogik.',
      action: null, sources: [] },
    { id: sid('c'), type: 'Inhalt', category: 'research', tone: 'idea', status: 'open', createdAt: Date.now(),
      text: 'Zur Leitfrage passt Mark Weisers Aufsatz „The Coming Age of Calm Technology" (1996).',
      claim: 'Calm Technology kann Aufmerksamkeit schonen, indem Technik zwischen Zentrum und Peripherie wechselt.',
      gesamt: 'Calm Technology ist ein Gestaltungsprinzip: Technik bleibt in der Peripherie und tritt nur ins Zentrum, wenn sie gebraucht wird. Weiser & Brown prägten es 1996 am Xerox PARC, als das Büro von piependen Geräten geflutet wurde; Amber Case führte es 2015 zu acht Prinzipien weiter. Über alle Quellen hinweg ist der Kern derselbe — die knappste Ressource ist nicht Rechenleistung, sondern menschliche Aufmerksamkeit.',
      why: 'Der Aufsatz ist die Primärquelle des Begriffs — hier wurde „Calm Technology" zum ersten Mal formuliert. Ein Verweis in den „Prinzipien" verankert deine Definition historisch.',
      narrative: 'Stärkt den Faden an seiner Begründungsstelle: Die These bekommt eine zitierfähige Autorität, bevor deine eigenen Beispiele kommen.',
      thread: 'These: Peripherie statt Alarm',
      quote: { text: 'The most potentially interesting, challenging, and profound change implied by the ubiquitous computing era is a focus on calm.', by: 'Weiser & Brown, 1996' },
      action: 'Weiser und Brown prägten den Begriff 1996 in „The Coming Age of Calm Technology" — Technik solle sich, so ihre Formel, an den Rändern unserer Aufmerksamkeit bewegen.',
      sources: [
        {
          label: 'Weiser & Brown (1996): The Coming Age of Calm Technology',
          type: 'Primärquelle',
          url: 'https://calmtech.com/papers',
          contentType: 'original-excerpt',
          content: 'The most potentially interesting, challenging, and profound change implied by the ubiquitous computing era is a focus on calm.',
          citation: 'Weiser, M., & Brown, J. S. (1996). The Coming Age of Calm Technology.',
          verificationStatus: 'demo',
          locator: 'Demo-Fundstelle: Aufsatz, einleitender Abschnitt',
          context: 'Der Satz formuliert den historischen Ausgangspunkt des Calm-Technology-Ansatzes.',
          limits: 'Die Quelle begründet das Gestaltungsprinzip, belegt aber nicht automatisch die Wirkung jeder konkreten Schreibsoftware.',
        },
        {
          label: 'Wikipedia: Calm technology',
          type: 'Enzyklopädie',
          url: 'https://en.wikipedia.org/wiki/Calm_technology',
          contentType: 'excerpt',
          content: 'Calm technology is a type of information technology where the interaction between the technology and its user is designed to occur in the user’s periphery rather than constantly at the center of attention.',
          citation: 'Wikipedia contributors. Calm technology. Wikipedia.',
          verificationStatus: 'demo',
          locator: 'Demo-Fundstelle: Einleitung des Artikels',
        },
        {
          label: 'Case, A. (2015): Calm Technology — Principles',
          type: 'Buch',
          url: 'https://calmtech.com',
          contentType: 'summary',
          content: 'Amber Case überführt den Ansatz in praktische Gestaltungsprinzipien für aufmerksamkeitsarme Technik.',
          citation: 'Case, A. (2015). Calm Technology. O’Reilly Media.',
          verificationStatus: 'demo',
          locator: 'Demo-Angabe: Buchzusammenfassung ohne live geprüfte Seite',
        },
      ] },

    // Begriff + Zeitstrahl: hier ergeben Definition und Einordnung Sinn — kein Diagramm, keine Zitate.
    { id: sid('c'), type: 'Inhalt', tone: 'idea', status: 'open', createdAt: Date.now(),
      text: 'Bevor „Calm Technology" trägt, sollte „Ubiquitous Computing" kurz definiert und historisch eingeordnet werden.',
      claim: 'Calm Technology ist als Gestaltungsantwort auf die Idee des Ubiquitous Computing entstanden.',
      gesamt: 'Calm Technology ist die Gestaltungsantwort auf eine ältere Idee: dass Rechner in den Alltag verschwinden. Wer den Begriff „Ubiquitous Computing" kurz einführt, gibt der Definition ein Fundament — sonst hängt „ruhige Technik" in der Luft.',
      definition: { term: 'Ubiquitous Computing', text: 'Von Mark Weiser 1988 am Xerox PARC geprägt: Rechenkraft verteilt sich unsichtbar in Alltagsdinge, statt im Zentrum eines Bildschirms zu sitzen. Calm Technology beschreibt, wie sich solche allgegenwärtige Technik anfühlen soll.' },
      timeline: [
        { when: '1988', what: 'Weiser prägt „Ubiquitous Computing" (Xerox PARC).' },
        { when: '1996', what: 'Weiser & Brown: „The Coming Age of Calm Technology".' },
        { when: '2015', what: 'Amber Case fasst es zu acht Design-Prinzipien.' },
        { when: 'heute', what: 'Wearables und Ambient Displays machen es alltäglich.' },
      ],
      narrative: 'Legt das Fundament für den Faden „These: Peripherie statt Alarm" — die Definition kommt, bevor die These sie braucht.',
      thread: 'These: Peripherie statt Alarm',
      action: 'Der Begriff geht auf Mark Weisers „Ubiquitous Computing" (1988) zurück: Technik verschwindet in den Alltag, statt ihn zu beherrschen.',
      sources: [
        {
          label: 'Weiser (1991): The Computer for the 21st Century',
          type: 'Primärquelle',
          url: 'https://calmtech.com/papers',
          contentType: 'original-excerpt',
          content: 'The most profound technologies are those that disappear.',
          citation: 'Weiser, M. (1991). The Computer for the 21st Century. Scientific American, 265(3), 94–104.',
          verificationStatus: 'demo',
          locator: 'Demo-Fundstelle: Aufsatzanfang',
        },
      ] },

    // Pro/Contra: eine zu absolute These — hier zählen Argumente von beiden Seiten, kein Diagramm.
    { id: sid('c'), type: 'Inhalt', category: 'logic', priority: 'high', tone: 'warn', status: 'open', createdAt: Date.now(),
      text: 'Deine These „Unterbrechung ist immer schädlich" ist zu absolut — es gibt starke Gegenbeispiele.',
      gesamt: 'Der Text behauptet, jede Unterbrechung schade. Das stimmt für Benachrichtigungs-Fluten, aber nicht ausnahmslos: Manche Unterbrechungen sind lebenswichtig. Eine These, die das einräumt, wirkt souveräner und ist schwerer angreifbar.',
      procontra: {
        pro: ['Ständige Benachrichtigungen stören fokussierte Arbeit.', 'Nach Unterbrechungen ist die Rückkehr in komplexe Aufgaben erschwert.', 'Aufgabenwechsel kann die Ergebnisqualität senken.'],
        contra: ['Sicherheits- und Notfallwarnungen MÜSSEN unterbrechen.', 'Eine nahende Deadline profitiert von einem rechtzeitigen Hinweis.', 'Ganz ohne Signale verpasst man Relevantes.'],
      },
      narrative: 'Schützt den Faden „These: Peripherie statt Alarm" vor dem Vorwurf der Einseitigkeit — die These überlebt den Einwand, statt an ihm zu zerbrechen.',
      thread: 'These: Peripherie statt Alarm',
      action: 'Ruhige Technik heißt nicht, nie zu unterbrechen — sondern nur dann, wenn es die Sache wirklich verlangt.' },

  ]
}

// Anmerkungen am Text: kind 'form' (Formulierung, Satzebene) · 'inhalt' (inhaltlich/generell).
export function buildExampleLane() {
  return [
    { id: sid('l'), kind: 'form', status: 'open',
      form: 'mark',
      target: 'nur beansprucht, wenn sie wirklich gebraucht wird',
      short: 'Doppelt abgeschwächt — dichter geht’s.',
      why: '„nur … wenn wirklich gebraucht" schwächt gleich zweifach ab. Eine der beiden Abtönungen genügt; der Satz wird klarer und behält sein Tempo.',
      action: 'nur beansprucht, wenn es nötig ist',
      variants: ['nur beansprucht, wenn es nötig ist', 'sich nur meldet, wenn es zählt', 'nur dann anklopft, wenn es wirklich zählt'] },
    { id: sid('l'), kind: 'form', status: 'open',
      form: 'mark',
      target: 'fragmentieren die Aufmerksamkeit',
      short: 'Konkreteres Verb — „fragmentieren" bleibt abstrakt.',
      why: 'Ein Bild macht den Schaden fühlbar, statt ihn nur zu behaupten. Fachwort raus, Wirkung rein.',
      action: 'zerteilen die Aufmerksamkeit in immer kleinere Stücke',
      variants: ['zerteilen die Aufmerksamkeit in immer kleinere Stücke', 'zersplittern die Aufmerksamkeit', 'hacken die Aufmerksamkeit in Fetzen'] },
    { id: sid('l'), kind: 'inhalt', status: 'open',
      form: 'note',
      target: 'Der eigentliche Schaden ist nicht die einzelne Meldung, sondern die Summe der kleinen Unterbrechungen über den Tag.',
      short: 'Starker Gedanke — trägt vielleicht den ganzen Absatz.',
      why: 'Dieser Satz ist die eigentliche Pointe des Absatzes, steht aber hinten. Nach vorn gezogen, gibt er dem „Warum" sofort Gewicht — der Rest belegt ihn dann.',
      action: 'Vorschlag: den Satz an den Anfang des Absatzes ziehen.',
      variants: [] },
    { id: sid('l'), kind: 'form', status: 'open',
      form: 'mark',
      target: 'ohne sich in den Vordergrund zu drängen',
      short: 'Bild schärfen — „Vordergrund" ist blass.',
      why: 'Ein konkreteres Bild trägt weiter als die räumliche Metapher „Vordergrund".',
      action: 'ohne nach Aufmerksamkeit zu rufen',
      variants: ['ohne nach Aufmerksamkeit zu rufen', 'ohne sich vorzudrängen', 'ohne laut zu werden'] },
    { id: sid('l'), kind: 'inhalt', status: 'open',
      form: 'para',
      target: 'Für Schreibsoftware bedeutet das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss.',
      short: 'Behauptet die Wirkung, zeigt sie aber nicht.',
      why: 'Der Absatz nennt drei Prinzipien, bleibt aber abstrakt. Ein konkretes Beispiel — eine Statusleuchte, die nur bei Bedarf aufleuchtet — würde die Behauptung tragen und an den Anfangston (Teekanne) anknüpfen.',
      action: 'Ein Beispiel macht es greifbar: Die Rechtschreibprüfung sammelt ihre Funde am Rand, statt bei jedem Wort zu unterbrechen — sichtbar, aber nie im Weg.',
      variants: [] },
    { id: sid('l'), kind: 'form', status: 'open',
      form: 'note',
      target: 'volle Kraft, leise Präsentation',
      short: 'Schöne Formel — verdient vielleicht einen eigenen Satz.',
      why: 'Die Antithese ist der Merksatz des Textes. Als eigenständiger Schlusssatz gesetzt, klingt sie stärker nach.',
      action: 'Ruhige Technik ist kein Verzicht, sondern eine Haltung. Volle Kraft, leise Präsentation.',
      variants: [] },
  ]
}

export function buildExampleBody() {
  return '<p>Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird.</p>'
    + '<h2>Warum es wichtig ist</h2>'
    + '<p>Ständige Benachrichtigungen fragmentieren die Aufmerksamkeit und zerreißen den Denkfluss. Der eigentliche Schaden ist nicht die einzelne Meldung, sondern die Summe der kleinen Unterbrechungen über den Tag.</p>'
    + '<p>Weiser und Brown beschrieben schon 1996, wie Technik zwischen Zentrum und Peripherie der Aufmerksamkeit wechseln kann. Eine gute Statusanzeige informiert, ohne sich in den Vordergrund zu drängen.</p>'
    + '<h2>Was das fürs Schreiben heißt</h2>'
    + '<p>Für Schreibsoftware bedeutet das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss.</p>'
    + '<p>Am Ende ist ruhige Technik keine Frage des Verzichts, sondern der Haltung: volle Kraft, leise Präsentation.</p>'
}

export function buildExampleMaterial() {
  return [
    { id: sid('m'), kind: 'Notiz', text: 'Ruhige Technik = volle Kraft, leise Präsentation. Vielleicht als Schlussformel?', x: 24, y: 40 },
    { id: sid('m'), kind: 'PDF', text: 'Weiser & Brown (1996): The Coming Age of Calm Technology — Originalaufsatz, 8 Seiten.', x: 150, y: 168 },
    { id: sid('m'), kind: 'YouTube', text: 'Amber Case: „Calm Technology" — Vortrag, gute Beispiele ab Minute 12.', x: 40, y: 300 },
    { id: sid('m'), kind: 'Zitat', text: '„Technology should require the smallest possible amount of attention." — Case, Prinzip 1', x: 172, y: 424 },
  ]
}
