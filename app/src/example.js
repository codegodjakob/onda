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

// Anmerkungen am Text — eine je Anmerkungsart, damit jeder Anwendungsfall
// durchgeklickt werden kann. Die Reihenfolge folgt den vier Kategorien:
// Korrektur, Stil, Struktur, Inhalt. Danach die fuenf Arten der
// Notizen-Betriebsart.
//
// Jede Art fuellt die Felder, die IHRE Form braucht — nicht alle Felder:
//   correction  target + action        (die Zeile "alt → neu")
//   rewrite     action + meta          (meta ist der Beweis: "24 → 12 Wörter")
//   insertion   action + label         (der Text, der in die Luecke kommt)
//   slot        move.to                (wohin es soll)
//   region      targets + suggestion   (alle Stellen, ein Vorschlag)
//   source      sources[]              (Link, Ausschnitt, Fundstelle)
//   compare     compare[]              (zwei Stellen nebeneinander)
//   dialogue    short                  (eine Meinung, keine Operation)
//   title       action                 (der neue Titel)
//   card        short                  (nur ein Gedanke)
// Wer ein Feld weglaesst, das die Form braucht, sieht eine halbe Karte —
// example-abdeckung.test.mjs prueft deshalb beides: Vollstaendigkeit der Arten
// UND dass jeder Anker woertlich im Text steht.
export function buildExampleLane() {
  return [
    // ---- Korrektur: objektiv falsch, ein Klick genuegt ---------------------
    { id: sid('l'), status: 'open', anmerkungsart: 'rechtschreibung',
      target: 'Zeit vertreib',
      short: 'Ein Wort, nicht zwei.',
      why: 'Zusammengesetzte Substantive werden im Deutschen zusammengeschrieben. Die Getrenntschreibung stammt meist aus dem Englischen.',
      action: 'Zeitvertreib' },
    { id: sid('l'), status: 'open', anmerkungsart: 'grammatik',
      target: 'Die Ergebnisse der Studie wurde',
      short: 'Das Subjekt ist Plural.',
      why: 'Das Prädikat richtet sich nach „Die Ergebnisse", nicht nach „der Studie" daneben.',
      action: 'Die Ergebnisse der Studie wurden' },
    { id: sid('l'), status: 'open', anmerkungsart: 'zeichensetzung',
      target: 'früher weil',
      short: 'Komma vor dem Nebensatz.',
      why: 'Nebensätze werden im Deutschen durch Komma abgetrennt — auch die kurzen.',
      action: 'früher, weil' },

    // ---- Stil: Formulierung, Vorschlag zur Wahl ---------------------------
    { id: sid('l'), status: 'open', anmerkungsart: 'wortwahl',
      target: 'kriegt',
      short: 'Umgangssprachlich für einen sonst gehobenen Text.',
      why: 'Das Register des Textes ist durchgehend schriftsprachlich. Ein einzelnes umgangssprachliches Wort fällt auf und wirkt wie ein Versehen.',
      action: 'erhält',
      variants: ['erhält', 'bekommt', 'zurückgemeldet bekommt'] },
    { id: sid('l'), status: 'open', anmerkungsart: 'satzstil',
      target: 'Weil die Aufmerksamkeit, die wir am Morgen haben, wenn wir noch nicht abgelenkt sind, die wertvollste Ressource des Tages ist, sollte man sie mit derselben Selbstverständlichkeit schützen wie einen Termin.',
      label: 'Schachtelsatz auflösen',
      meta: '31 → 14 Wörter',
      short: 'Drei Nebensätze vor dem Hauptsatz — die Aussage kommt zu spät.',
      why: 'Der Leser muss 24 Wörter im Kopf behalten, bevor er erfährt, worum es geht. Zwei Sätze tragen dieselbe Aussage ohne diese Last.',
      action: 'Am Morgen ist die Aufmerksamkeit am größten. Diese Zeit sollte man schützen wie einen Termin.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'absatzstil',
      target: 'Wir planen montags. Wir schützen die Blöcke. Wir prüfen am Freitag. Wir passen an.',
      label: 'Rhythmus lösen',
      meta: '4 → 1 Satz',
      short: 'Vier Sätze, vier gleiche Anfänge.',
      why: 'Die Wiederholung derselben Satzform wirkt hier nicht als Stilmittel, sondern als Erschöpfung. Ein zusammengezogener Satz trägt dasselbe leichter.',
      action: 'Geplant wird montags; die Blöcke bleiben geschützt, freitags folgt die Prüfung.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'straffen',
      target: 'Es wurde eine Entscheidung getroffen, die Reihenfolge der Prinzipien zu ändern.',
      label: 'Straffen',
      meta: '11 → 5 Wörter',
      short: 'Nominalstil und Passiv in einem Satz.',
      why: 'Wer etwas entschieden hat, verschwindet hier hinter „es wurde". Ein Verb statt des Substantivs macht den Satz kürzer und ehrlicher.',
      action: 'Wir ändern die Reihenfolge der Prinzipien.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'wiederholung',
      target: 'Aufmerksamkeit',
      targets: [{ text: 'Aufmerksamkeit' }],
      count: 3,
      short: 'Dasselbe Wort in drei aufeinanderfolgenden Sätzen.',
      why: 'Dreimal dasselbe Wort auf engem Raum macht den Absatz zäh. Zwei Ersetzungen genügen — die erste Nennung darf stehen bleiben, sie führt den Begriff ein.',
      suggestion: { from: '2. und 3. Stelle', to: 'Konzentration · Fokus' },
      acceptLabel: 'Beide ersetzen',
      action: 'Konzentration' },
    { id: sid('l'), status: 'open', anmerkungsart: 'ton',
      target: 'Man sollte Blöcke schützen, sobald du deine Woche danach planst.',
      short: 'Der Abschnitt wechselt zwischen „man" und „du".',
      why: 'Die Anrede ist eine Entscheidung, die für den ganzen Text gilt. Ein Wechsel mitten im Satz liest sich, als spräche jemand anders weiter.',
      suggestion: { from: 'man · du gemischt', to: 'durchgehend du' },
      acceptLabel: 'Anrede vereinheitlichen',
      action: 'Du solltest Blöcke schützen, sobald du deine Woche danach planst.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'stilmittel',
      target: 'Der Rest des Vormittags gehört dann der Aufholjagd.',
      label: 'Bild einfügen',
      short: 'Die Zahl bleibt abstrakt, solange sie kein Bild bekommt.',
      why: 'Ein Vergleich macht aus einer Größe eine Erfahrung. Der Mechanismus ist Konkretisierung: das Abstrakte bekommt einen Gegenstand, an dem es sich messen lässt. Prüffrage: Sieht die Leserin danach etwas, das sie vorher nur gewusst hat?',
      action: 'Zwölf Unterbrechungen sind kein Sandkorn, sondern ein halber Vormittag.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'anglizismus',
      target: 'Deadline',
      short: 'Es gibt ein deutsches Wort dafür.',
      why: 'Der Text kommt sonst ohne englische Begriffe aus. Ein einzelner fällt deshalb aus dem Ton.',
      action: 'Abgabetermin' },
    { id: sid('l'), status: 'open', anmerkungsart: 'terminologie',
      target: 'Nutzer',
      targets: [{ text: 'Nutzer' }, { text: 'Anwender' }, { text: 'User' }],
      count: 3,
      short: 'Drei Begriffe für dieselbe Sache.',
      why: 'Wer drei Wörter für eine Sache verwendet, lässt den Leser rätseln, ob drei Sachen gemeint sind. Ein Begriff, durchgehalten, ist keine Armut, sondern Genauigkeit.',
      compare: [
        { ref: 'Nutzer', text: '7 Stellen' },
        { ref: 'Anwender', text: '2 Stellen' },
        { ref: 'User', text: '1 Stelle' },
      ],
      acceptLabel: 'Auf „Nutzer" vereinheitlichen',
      action: 'Nutzer' },

    // ---- Struktur: Aufbau und Bewegung im Text ----------------------------
    { id: sid('l'), status: 'open', anmerkungsart: 'verschieben',
      target: 'Ein Kalender mit geschützten Blöcken kostet nichts und wirkt sofort.',
      short: 'Steht bei den Beispielen, gehört zu den Gegenmitteln.',
      why: 'Der Satz nennt ein Mittel, keine Beobachtung. Zwischen den Beispielen unterbricht er die Beweisführung; bei den Gegenmitteln stützt er sie.',
      move: { to: 'Hinter „Was das fürs Schreiben heißt", zu den Gegenmitteln' },
      action: 'Ein Kalender mit geschützten Blöcken kostet nichts und wirkt sofort.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'uebergang',
      target: 'Eine gute Statusanzeige informiert, ohne sich in den Vordergrund zu drängen.',
      label: 'Brücke einfügen',
      short: 'Zwischen Forschung und Anwendung fehlt ein Satz.',
      why: 'Der Text springt von der historischen Einordnung direkt zu den Regeln. Eine Frage dazwischen führt den Leser hinüber, statt ihn springen zu lassen.',
      action: 'Was folgt daraus für den Arbeitstag?' },
    { id: sid('l'), status: 'open', anmerkungsart: 'gliederung',
      target: 'Der Effekt heißt Attention Residue und wirkt über Stunden.',
      label: 'Zwischentitel hier',
      short: 'Hier bricht das Thema, ohne dass es angekündigt wird.',
      why: 'Ein Zwischentitel an der Bruchstelle gibt dem Leser die Landkarte, bevor er sie braucht.',
      move: { to: 'Was hilft' },
      action: 'Was hilft' },
    { id: sid('l'), status: 'open', anmerkungsart: 'fluss',
      target: 'Wir planen montags. Wir schützen die Blöcke.',
      label: 'Sätze verbinden',
      meta: '2 → 1 Satz',
      short: 'Zwei kurze Sätze in Folge — der Rhythmus stockt.',
      why: 'Kurze Sätze wirken, wenn sie selten sind. In Serie klingen sie gehackt.',
      action: 'Geplant wird montags, und die Blöcke bleiben geschützt.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'faden',
      target: 'Am Ende ist ruhige Technik keine Frage des Verzichts, sondern der Haltung: volle Kraft, leise Präsentation.',
      short: 'Die Kernaussage „begrenzte Ressource" trägt bis Absatz vier — ab da übernehmen die Werkzeuge.',
      why: 'Der Schluss verdichtet gut, greift aber die Leitfrage nicht ausdrücklich wieder auf. Ein Rückbezug im letzten Absatz schließt den Bogen, ohne etwas zu wiederholen.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'ueberschrift',
      target: 'Calm Technology',
      short: 'Der Titel benennt das Thema, nicht die These.',
      why: 'Ein Titel, der die These trägt, macht neugierig und verpflichtet den Text zugleich. „Calm Technology" ist ein Etikett; es kann alles Mögliche bedeuten.',
      action: 'Die begrenzte Ressource' },

    // ---- Inhalt: Substanz und Belege --------------------------------------
    { id: sid('l'), status: 'open', anmerkungsart: 'beleg',
      target: 'Nach jeder Unterbrechung dauert es 23 Minuten, bis die Konzentration wieder trägt.',
      n: 1,
      short: 'Zahl ohne Quelle. Ein passender Beleg liegt vor:',
      why: 'Eine Zahl, die das Argument trägt, braucht ihre Herkunft im Satz daneben. Ohne sie ist sie eine Behauptung im Gewand einer Messung.',
      sources: [{
        label: 'Mark, G. u. a. (2008): The Cost of Interrupted Work',
        type: 'Primärquelle',
        url: 'https://ics.uci.edu/~gmark/chi08-mark.pdf',
        contentType: 'original-excerpt',
        content: 'Nach einer Unterbrechung dauert es im Mittel rund 23 Minuten, bis Probanden die ursprüngliche Aufgabe mit vergleichbarer Konzentration fortsetzen.',
        citation: 'Mark, G., Gudith, D., & Klocke, U. (2008). The Cost of Interrupted Work. CHI 2008.',
        verificationStatus: 'demo',
        locator: 'Demo-Fundstelle: Ergebnisteil',
        limits: 'Die Studie misst Büroarbeit, nicht Schreibarbeit im Besonderen.',
      }],
      acceptLabel: 'Als Fußnote einfügen',
      action: 'Nach jeder Unterbrechung dauert es 23 Minuten, bis die Konzentration wieder trägt (Mark u. a. 2008).' },
    { id: sid('l'), status: 'open', anmerkungsart: 'faktencheck',
      target: 'sechs Prozent',
      n: 2,
      short: 'Weicht von der angegebenen Quelle ab.',
      why: 'Die Zahl im Text und die Zahl in der Quelle stimmen nicht überein. Eine Abweichung von knapp zwei Punkten ist bei einer Marktangabe kein Rundungsfehler.',
      sources: [{
        label: 'Marktbericht Q3 2026 — Branchenverband',
        type: 'Bericht',
        url: 'https://example.org/marktbericht-q3-2026',
        contentType: 'excerpt',
        content: 'Der Gesamtmarkt legte im dritten Quartal um 4,1 Prozent zu.',
        citation: 'Branchenverband (2026). Marktbericht Q3 2026.',
        verificationStatus: 'demo',
        locator: 'Demo-Fundstelle: Kennzahlen',
      }],
      acceptLabel: 'Auf 4,1 Prozent korrigieren',
      action: 'vier Komma eins Prozent' },
    { id: sid('l'), status: 'open', anmerkungsart: 'widerspruch',
      target: 'eine ganze Stunde',
      n: 3,
      short: 'Zwei Angaben zur gleichen Sache.',
      why: 'Weiter oben stehen 23 Minuten, hier eine Stunde. Beides kann nicht stimmen; der Leser merkt es und verliert das Vertrauen in beide Zahlen.',
      compare: [
        { ref: 'Absatz 3', text: '23 Minuten' },
        { ref: 'Absatz 8', text: 'eine ganze Stunde' },
      ],
      acceptLabel: 'Auf 23 Minuten angleichen',
      action: 'rund eine halbe Stunde' },
    { id: sid('l'), status: 'open', anmerkungsart: 'anmerkung',
      target: 'Wer früh Nachrichten liest, verschenkt den besten Teil des Tages.',
      short: 'Die Behauptung ist stark — hast du ein Beispiel aus deinem Alltag? Zwei Sätze würden sie tragen.',
      why: 'Eine zugespitzte Behauptung überzeugt, wenn sie an einer Erfahrung hängt. Ohne Beispiel bleibt sie eine Meinung, die man teilen kann oder nicht.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'luecke',
      target: 'Wer im Support arbeitet, kennt den Einwand.',
      short: 'Bereitschaftsdienste können Blöcke nicht schützen. Soll ich einen Absatz dazu vorschlagen?',
      why: 'Der Text nennt den Einwand, ohne ihn zu beantworten. Ein Leser aus genau diesem Feld liest das als Ausweichen.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'verstaendlichkeit',
      target: 'Attention Residue',
      label: 'Erklärung einfügen',
      short: 'Der Fachbegriff wird benutzt, bevor er erklärt ist.',
      why: 'Ein Begriff, den nur das Fach kennt, kostet den übrigen Leser einen Absatz Aufmerksamkeit — genau die Ressource, um die es hier geht.',
      action: '— der Teil der Aufmerksamkeit, der bei der alten Aufgabe hängen bleibt' },

    // ---- Notizen-Betriebsart: hier wird NICHT korrigiert -------------------
    { id: sid('l'), status: 'open', anmerkungsart: 'ausformulieren',
      target: 'Kerngedanke: Aufmerksamkeit ist keine Fähigkeit, sondern eine Bedingung, die man gestaltet',
      label: 'Ausformulieren',
      short: 'Das ist schon die These — sie steht nur noch als Stichwort da.',
      why: 'Der Gedanke trägt einen ganzen Abschnitt. Als Satz geschrieben, wird sichtbar, was er verlangt und was er nicht behauptet.',
      action: 'Aufmerksamkeit ist keine Fähigkeit, die man hat oder nicht hat. Sie ist eine Bedingung, die sich gestalten lässt — und damit eine Frage des Entwurfs, nicht des Charakters.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'buendeln',
      target: '→ Teekanne pfeift erst wenn relevant. Statusleuchte informiert ohne zu unterbrechen. beides dasselbe Prinzip?',
      short: 'Die beiden Beispiele und die Frage danach gehören zusammen.',
      why: 'Du hast die Antwort schon mitgeschrieben: „beides dasselbe Prinzip". Zusammengefasst ist es ein Baustein statt drei loser Notizen.',
      move: { to: 'Zu einem Block: Beispiele + gemeinsames Prinzip' } },
    { id: sid('l'), status: 'open', anmerkungsart: 'nachfrage',
      target: 'irgendwo unterbringen: der Unterschied zwischen leise und langsam. leise ist nicht weniger Kraft',
      short: 'Meinst du damit den Einwand, ruhige Technik sei ein Verzicht?',
      why: 'Die Notiz klingt nach einer Abgrenzung gegen einen Vorwurf. Wenn ja, gehört sie in die Nähe der These und nicht ans Ende.' },
    { id: sid('l'), status: 'open', anmerkungsart: 'ordnen',
      target: 'Weiser 1988 ubiquitous computing / Weiser + Brown 1996 calm / Case 2015 acht Prinzipien',
      short: 'Die Reihenfolge stimmt schon — sie steht nur mitten in den Beispielen.',
      why: 'Eine Zeitleiste ist Fundament, kein Beleg. Vor die Beispiele gezogen, gibt sie ihnen den Rahmen.',
      move: { to: 'Vor die Beispiele, als Fundament' } },
    { id: sid('l'), status: 'open', anmerkungsart: 'aufgreifen',
      target: 'offene Frage aus dem Gespräch letzte Woche: gilt das auch für Bereitschaftsdienste',
      short: 'Dieser Faden ist noch offen — im Text taucht der Einwand auf, die Antwort nicht.',
      why: 'Du hast die Frage zweimal notiert, einmal hier und einmal im Text („Wer im Support arbeitet"). Zweimal notiert heißt meistens: sie lässt dich nicht los.' },
  ]
}

// Der Beispieltext ist eine Testkulisse, die sich nicht als eine anfuehlen soll.
// Jakob liest ihn wirklich, wenn er die Rueckmeldung prueft — Blindtext waere
// wertlos, weil sich an ihm nicht beurteilen laesst, ob ein Hinweis hilft.
//
// Er traegt deshalb echte, absichtliche Schwaechen: einen falsch geschriebenen
// Zeitvertreib, einen Schachtelsatz, eine Zahl ohne Quelle, einen Widerspruch
// zu einer frueheren Zahl, dreimal dasselbe Wort, drei Begriffe fuer dieselbe
// Sache. Jede davon ist der Anker genau einer Anmerkungsart — welche wo haengt,
// steht in buildExampleLane(), und example-abdeckung.test.mjs prueft, dass
// jeder Anker woertlich hier vorkommt.
export function buildExampleBody() {
  return '<p>Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird.</p>'

    + '<h2>Warum es wichtig ist</h2>'
    + '<p>Ständige Benachrichtigungen fragmentieren die Aufmerksamkeit und zerreißen den Denkfluss. Der eigentliche Schaden ist nicht die einzelne Meldung, sondern die Summe der kleinen Unterbrechungen über den Tag.</p>'
    + '<p>Nach jeder Unterbrechung dauert es 23 Minuten, bis die Konzentration wieder trägt. Der Rest des Vormittags gehört dann der Aufholjagd. Die Ergebnisse der Studie wurde 2009 veröffentlicht und seither mehrfach bestätigt.</p>'
    + '<p>Die Aufmerksamkeit zerfällt in Bruchstücke, und mit der Aufmerksamkeit die Qualität. Wer seine Aufmerksamkeit schützt, schützt seine Arbeit.</p>'
    + '<p>Weil die Aufmerksamkeit, die wir am Morgen haben, wenn wir noch nicht abgelenkt sind, die wertvollste Ressource des Tages ist, sollte man sie mit derselben Selbstverständlichkeit schützen wie einen Termin. Trotzdem behandeln wir sie wie einen Vorrat, aus dem man beliebig schöpfen kann — ein teurer Zeit vertreib.</p>'

    + '<h2>Was die Forschung sagt</h2>'
    + '<p>Weiser und Brown beschrieben schon 1996, wie Technik zwischen Zentrum und Peripherie der Aufmerksamkeit wechseln kann. Eine gute Statusanzeige informiert, ohne sich in den Vordergrund zu drängen.</p>'
    + '<p>Der Markt für solche Werkzeuge wuchs im selben Zeitraum um sechs Prozent. Bis ein unterbrochener Gedanke wieder trägt, vergeht eine ganze Stunde.</p>'
    + '<p>Der Effekt heißt Attention Residue und wirkt über Stunden. Es wurde eine Entscheidung getroffen, die Reihenfolge der Prinzipien zu ändern.</p>'

    + '<h2>Was das fürs Schreiben heißt</h2>'
    + '<p>Für Schreibsoftware bedeutet das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss. Im Text stehen Nutzer, Anwender und User nebeneinander.</p>'
    + '<p>Man sollte Blöcke schützen, sobald du deine Woche danach planst. Wer sich daran hält, gewinnt zwei ruhige Tage. Bis zur Deadline bleiben dann noch zwei Tage Luft.</p>'
    + '<p>Wir planen montags. Wir schützen die Blöcke. Wir prüfen am Freitag. Wir passen an.</p>'
    + '<p>Ein Kalender mit geschützten Blöcken kostet nichts und wirkt sofort. Wer im Support arbeitet, kennt den Einwand. Wer früh Nachrichten liest, verschenkt den besten Teil des Tages.</p>'
    + '<p>Er kam früher weil er die Zahlen selbst sehen wollte. Wer dann noch Rückmeldung kriegt, arbeitet an einem Text, den er längst abgeschlossen hätte.</p>'

    + '<p>Am Ende ist ruhige Technik keine Frage des Verzichts, sondern der Haltung: volle Kraft, leise Präsentation.</p>'
}

// Der Notiz-Text ist bewusst roh: Stichworte, Fragmente, Pfeile. In der
// Notizen-Betriebsart wird NICHT korrigiert — kein Rechtschreib-, kein
// Grammatik-, kein Zeichensetzungshinweis. Lose Gedanken duerfen lose bleiben.
// Deshalb braucht dieser Modus einen eigenen Text: an fertigen Saetzen liesse
// sich nicht zeigen, dass der Agent sie hier in Ruhe laesst.
export function buildExampleNotizen() {
  return '<p>Kerngedanke: Aufmerksamkeit ist keine Fähigkeit, sondern eine Bedingung, die man gestaltet</p>'
    + '<p>→ Teekanne pfeift erst wenn relevant. Statusleuchte informiert ohne zu unterbrechen. beides dasselbe Prinzip?</p>'
    + '<p>Weiser 1988 ubiquitous computing / Weiser + Brown 1996 calm / Case 2015 acht Prinzipien</p>'
    + '<p>irgendwo unterbringen: der Unterschied zwischen leise und langsam. leise ist nicht weniger Kraft</p>'
    + '<p>offene Frage aus dem Gespräch letzte Woche: gilt das auch für Bereitschaftsdienste</p>'
}

// Die acht Hinweisarten des Agenten — die Einordnung, mit der er jeden Hinweis
// versieht (kiKategorie). Vier davon zaehlen zur Integritaet: fakt, quelle,
// methode, logik. Sie stehen am Text, nicht am Dokument, damit Jakob sie an der
// Stelle sieht, auf die sie sich beziehen.
export function buildExampleHinweisarten() {
  const hinweis = (kiKategorie, anker, beobachtung, relevanz, folge, muster) => ({
    id: sid('h'), status: 'open', createdAt: 0,
    kiKategorie,
    target: anker,
    short: beobachtung,
    why: `${relevanz} ${folge}`,
    muster,
    integritaet: ['fakt', 'quelle', 'methode', 'logik'].includes(kiKategorie),
  })
  return [
    hinweis('fakt', 'sechs Prozent',
      'Die Zahl weicht von der Quelle ab.',
      'Eine falsche Zahl in einem belegten Absatz beschädigt auch die richtigen daneben.',
      'Bleibt sie, prüft ein aufmerksamer Leser den ganzen Abschnitt gegen.',
      'Eine Zahl, die aus einer Quelle stammt, muss mit ihr übereinstimmen — auch in der Rundung.'),
    hinweis('quelle', 'Nach jeder Unterbrechung dauert es 23 Minuten, bis die Konzentration wieder trägt.',
      'Der tragende Befund hat keine Herkunft.',
      'Das Publikum sind Fachleute; sie lesen Zahlen als Messungen und suchen die Studie.',
      'Ohne Beleg bleibt der Satz eine Behauptung im Gewand einer Messung.',
      'Eine Zahl, die das Argument trägt, braucht ihre Herkunft im Satz daneben.'),
    hinweis('methode', '2009 veröffentlicht und seither mehrfach bestätigt',
      '„Mehrfach bestätigt" nennt weder wie oft noch von wem.',
      'Das Wort behauptet Konsens, ohne ihn zu zeigen.',
      'Bleibt es, kann der Text einen Konsens vortäuschen, den es so nicht gibt.',
      'Wer Bestätigung behauptet, nennt Zahl und Herkunft — sonst ist es Rhetorik.'),
    hinweis('logik', 'eine ganze Stunde',
      'Widerspricht der Angabe weiter oben.',
      'Zwei Zahlen für dieselbe Sache lassen den Leser wählen, welcher er glaubt.',
      'Er glaubt dann keiner von beiden.',
      'Zwei Angaben zur gleichen Größe im selben Text müssen zusammenpassen oder sich ausdrücklich unterscheiden.'),
    hinweis('struktur', 'Ein Kalender mit geschützten Blöcken kostet nichts und wirkt sofort.',
      'Ein Gegenmittel steht zwischen den Beispielen.',
      'Der Abschnitt soll das Problem zeigen; eine Lösung darin nimmt der Beweisführung den Zug.',
      'Der Leser hält die Lösung für einen Teil des Problems.',
      'Ein Satz gehört dorthin, wo seine Funktion gebraucht wird — nicht dorthin, wo er einem einfiel.'),
    hinweis('wirkung', 'Wer früh Nachrichten liest, verschenkt den besten Teil des Tages.',
      'Die stärkste Behauptung des Textes steht ohne Beispiel.',
      'Zugespitzte Sätze überzeugen über eine Erfahrung, nicht über die Zuspitzung.',
      'Ohne Beispiel liest sie sich als Meinung, die man teilen kann oder nicht.',
      'Je stärker die Behauptung, desto konkreter muss der Beleg daneben sein.'),
    hinweis('erklaerung', 'Der Effekt heißt Attention Residue und wirkt über Stunden.',
      'Der Fachbegriff wird benutzt, bevor er erklärt ist.',
      'Der Text richtet sich auch an Leser außerhalb des Fachs.',
      'Sie überlesen den Begriff und verlieren den Grund des Absatzes mit.',
      'Ein Fachwort beim ersten Auftreten in einem Halbsatz erklären — oder es weglassen.'),
    hinweis('sprache', 'Wir planen montags. Wir schützen die Blöcke. Wir prüfen am Freitag. Wir passen an.',
      'Vier Sätze mit demselben Anfang — eine Anapher, die hier nicht trägt.',
      'Der Mechanismus der Anapher ist Verstärkung durch Wiederkehr. Verstärkt wird hier aber nichts, es werden nur vier gleichrangige Schritte aufgezählt.',
      'Prüffrage: Steigert sich etwas von Satz zu Satz? Wenn nein, ist die Figur Dekoration.',
      'Eine Wiederholungsfigur trägt nur, wenn sich über die Wiederholungen hinweg etwas steigert.'),
  ]
}

// Die drei Erweiterungsarten. Eine Erweiterung ist KEIN Mangel — sie sagt nicht,
// was fehlt, sondern was noch möglich wäre. Die Ankerzahl folgt der Art:
// weiterfuehrung genau einer, verbindung genau zwei, feld keiner.
export function buildExampleErweiterungen() {
  return [
    { id: sid('e'), art: 'weiterfuehrung', status: 'neu', createdAt: 0,
      stellen: [{ text: 'Wer seine Aufmerksamkeit schützt, schützt seine Arbeit.', index: null, laenge: null, blockId: null, docId: null, docTitel: '' }],
      gedanke: 'Der Satz macht Aufmerksamkeit zu etwas, das man schützen kann — also zu einer Bedingung, nicht zu einer Eigenschaft. Damit wird ihre Verteilung eine Frage der Macht: Wer darf ungestört arbeiten und wer nicht? In vielen Organisationen ist die Ruhe nach Rang verteilt, ohne dass das je entschieden wurde.',
      muster: 'Wer eine Eigenschaft zur Bedingung erklärt, macht sie verhandelbar — und damit zur Frage, wer über sie verfügt.' },
    { id: sid('e'), art: 'feld', status: 'neu', createdAt: 0,
      stellen: [],
      gedanke: 'Die Architektur kennt dasselbe Problem seit Jahrzehnten unter dem Namen Großraumbüro. Was dort über Sichtachsen, Rückzugsorte und akustische Zonen gelernt wurde, lässt sich auf Oberflächen übertragen: auch ein Bildschirm hat Zonen, in denen man arbeitet, und Zonen, aus denen etwas ruft.',
      muster: 'Ein Problem, das in der eigenen Disziplin neu wirkt, ist in einer älteren oft schon durchgearbeitet.' },
    { id: sid('e'), art: 'verbindung', status: 'neu', createdAt: 0,
      stellen: [
        { text: 'Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird.', index: null, laenge: null, blockId: null, docId: null, docTitel: '' },
        { text: 'volle Kraft, leise Präsentation', index: null, laenge: null, blockId: null, docId: null, docTitel: '' },
      ],
      gedanke: 'Der erste und der letzte Satz sagen dasselbe, einmal als Definition und einmal als Formel. Diese Klammer trägt den Text bereits — sie ließe sich ausdrücklich machen, indem der Schluss die Eingangsformulierung wörtlich aufgreift und umdreht.',
      muster: 'Wenn Anfang und Ende dieselbe Aussage in verschiedener Form tragen, ist die Klammer schon da und muss nur sichtbar gemacht werden.' },
  ]
}

export function buildExampleMaterial() {
  return [
    { id: sid('m'), kind: 'Notiz', text: 'Ruhige Technik = volle Kraft, leise Präsentation. Vielleicht als Schlussformel?', x: 24, y: 40 },
    { id: sid('m'), kind: 'PDF', text: 'Weiser & Brown (1996): The Coming Age of Calm Technology — Originalaufsatz, 8 Seiten.', x: 150, y: 168 },
    { id: sid('m'), kind: 'YouTube', text: 'Amber Case: „Calm Technology" — Vortrag, gute Beispiele ab Minute 12.', x: 40, y: 300 },
    { id: sid('m'), kind: 'Zitat', text: '„Technology should require the smallest possible amount of attention." — Case, Prinzip 1', x: 172, y: 424 },
  ]
}
