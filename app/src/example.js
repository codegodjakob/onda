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

// Karten zum ganzen Text (placement 'document'). Auch hier steht die Anmerkungsart
// ausdrücklich da — es ist genau die, die bisher aus category/sources erraten wurde.
export function buildExampleCoach() {
  return [
    { id: sid('c'), type: 'Struktur', category: 'structure', anmerkungsart: 'faden', priority: 'critical', tone: 'warn', status: 'open', createdAt: Date.now(),
      text: 'Der Abschnitt „Beispiele" kommt vor den „Prinzipien" — die Argumentation trägt besser andersherum.',
      why: 'Deine geplante Struktur sieht Prinzipien → Beispiele vor. Im Text ist die Reihenfolge aktuell vertauscht. Leser brauchen erst den Maßstab („was heißt ruhig?"), dann die Anschauung — sonst wirken die Beispiele beliebig und ihre Pointe verpufft.',
      narrative: 'Im Faden „Methode: vom Prinzip zum Werkzeug" ist der erste Schritt „Maßstab setzen". Wird er übersprungen, bricht dieser Handlungsstrang an seiner ersten Stelle — die Narrative verlöre ihre Begründungslogik.',
      action: null, sources: [] },
    { id: sid('c'), type: 'Inhalt', category: 'research', anmerkungsart: 'beleg', tone: 'idea', status: 'open', createdAt: Date.now(),
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
    { id: sid('c'), type: 'Inhalt', anmerkungsart: 'beleg', tone: 'idea', status: 'open', createdAt: Date.now(),
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
    { id: sid('c'), type: 'Inhalt', category: 'logic', anmerkungsart: 'widerspruch', priority: 'high', tone: 'warn', status: 'open', createdAt: Date.now(),
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

// Anmerkungen am Text. Der Beispieltext trägt jede der 29 Anmerkungsarten aus
// annotation-contract.mjs genau einmal — damit sich jede Gestalt am eigenen Text
// ansehen und ausprobieren lässt.
//
// Drei Regeln, an die sich jeder Eintrag hält:
// 1. anmerkungsart steht ausdrücklich da. Früher wurde sie aus kind/form geraten,
//    und aus 24 möglichen Arten wurden dabei immer dieselben fünf.
// 2. target steht wörtlich in buildExampleBody() und nur an einer einzigen Stelle —
//    sonst findet die Anmerkung ihren Absatz nicht (workspace-model.mjs).
// 3. Jeder Eintrag trägt die Felder, die seine Gestalt braucht: action bei Korrektur,
//    Umschrift und Einschub, targets beim Bereich, compare beim Vergleich, sources
//    beim Beleg, move beim Verschieben, heading beim Gliedern, thread beim Gespräch.
//
// kind bleibt daneben stehen ('form' für Sprachliches, 'inhalt' für Inhaltliches):
// daraus leitet reasoning-model.mjs weiterhin die alte category ab.
export function buildExampleLane() {
  return [
    // --- Korrektur: die drei eindeutigen Fehler --------------------------------------
    { id: 'anm-rechtschreibung', kind: 'form', anmerkungsart: 'rechtschreibung', status: 'open',
      blockId: 'b-calm-warum-1',
      target: 'Konzentation',
      short: '„Konzentation" ist ein Tippfehler.',
      why: 'Das Wort heißt „Konzentration". Ein Fehler dieser Art kostet keine Überlegung — nur die Aufmerksamkeit derer, die ihn beim Lesen entdecken.',
      action: 'Konzentration' },
    { id: 'anm-grammatik', kind: 'form', anmerkungsart: 'grammatik', status: 'open',
      blockId: 'b-calm-warum-1',
      target: 'Wegen dem ständigen Nachfragen',
      short: '„wegen" verlangt den Genitiv.',
      why: '„Wegen dem" ist gesprochene Sprache. In einem Essay, der Sorgfalt behauptet, fällt der Dativ als Nachlässigkeit auf.',
      action: 'Wegen des ständigen Nachfragens' },
    { id: 'anm-zeichensetzung', kind: 'form', anmerkungsart: 'zeichensetzung', status: 'open',
      blockId: 'b-calm-warum-2',
      target: 'Man merkt erst dass',
      short: 'Vor „dass" fehlt das Komma.',
      why: 'Der Nebensatz beginnt mit „dass" und wird deshalb abgetrennt. Ohne Komma stolpert man beim Lesen genau dort, wo der Satz seine Pointe vorbereitet.',
      action: 'Man merkt erst, dass' },

    // --- Stil: Wort, Satz, Absatz, Bereich -------------------------------------------
    { id: 'anm-wortwahl', kind: 'form', anmerkungsart: 'wortwahl', status: 'open',
      blockId: 'b-calm-warum-1',
      target: 'fragmentieren',
      short: 'Fachwort raus, Wirkung rein.',
      why: '„Fragmentieren" beschreibt den Vorgang korrekt, aber es bleibt abstrakt. Ein Alltagswort macht den Schaden fühlbar, statt ihn nur zu behaupten.',
      action: 'zerteilen' },
    { id: 'anm-satzstil', kind: 'form', anmerkungsart: 'satzstil', status: 'open',
      blockId: 'b-calm-warum-3',
      target: 'Dass die Technik, die uns umgibt, in dem Augenblick, in dem sie etwas von uns will, nur selten fragt, ob es gerade passt, ist kein Zufall, sondern eine Entscheidung am Reißbrett.',
      short: 'Vier Einschübe vor dem Hauptverb — der Satz trägt sich selbst nicht.',
      why: 'Bis das Prädikat kommt, hat die Leserin drei Nebensätze im Kopf behalten. Zwei Sätze halten dieselbe Aussage, ohne dass jemand mitzählen muss.',
      action: 'Die Technik, die uns umgibt, fragt selten, ob es gerade passt. Das ist kein Zufall, sondern eine Entscheidung am Reißbrett.' },
    { id: 'anm-straffen', kind: 'form', anmerkungsart: 'straffen', status: 'open',
      blockId: 'b-calm-warum-3',
      target: 'Das gilt in einer ganzen Reihe von Fällen, die man durchaus als typisch bezeichnen kann.',
      short: 'Vierzehn Wörter für „fast immer".',
      why: 'Die Absicherung „in einer ganzen Reihe von Fällen, die man durchaus als typisch bezeichnen kann" sagt nichts, was „fast immer" nicht auch sagt — sie macht die Aussage nur vorsichtiger, als sie gemeint ist.',
      action: 'Das gilt fast immer.' },
    { id: 'anm-absatzstil', kind: 'form', anmerkungsart: 'absatzstil', status: 'open',
      blockId: 'b-calm-haltung',
      target: 'Ein ruhiges Werkzeug verzichtet nicht auf Funktionen, es ordnet sie nur anders an, es zeigt sie dann, wenn sie gebraucht werden, es hält sie zurück, wenn sie stören würden, und es überlässt die Entscheidung darüber der Person, die schreibt.',
      short: 'Ein Absatz, ein Satz, fünf gleichrangige Kommateile.',
      why: 'Alles hängt an derselben Schnur, nichts wird betont. Mit einem kurzen Anfangssatz, einem Doppelpunkt und einem knappen Schluss bekommt der Absatz eine Kurve statt einer geraden Linie.',
      action: 'Ein ruhiges Werkzeug verzichtet auf nichts. Es ordnet nur anders: zeigen, wenn es gebraucht wird; zurückhalten, wenn es stören würde. Wer schreibt, entscheidet.' },
    { id: 'anm-wiederholung', kind: 'form', anmerkungsart: 'wiederholung', status: 'open',
      blockId: 'b-calm-warum-2',
      target: 'Aufmerksamkeit ist die eigentliche Währung dieser Jahre.',
      short: '„Aufmerksamkeit" steht dreimal in drei Sätzen.',
      why: 'Beim ersten Mal ist es der Begriff, beim dritten Mal ein Tick. Zwei der Nennungen lassen sich durch ein Pronomen ersetzen — der Absatz verliert nichts und gewinnt Tempo.',
      targets: [
        { blockId: 'b-calm-warum-2', text: 'Wer Aufmerksamkeit verliert', replacement: 'Wer sie verliert' },
        { blockId: 'b-calm-warum-2', text: 'muss Aufmerksamkeit noch einmal aufbringen', replacement: 'muss sie noch einmal aufbringen' },
      ],
      action: 'Die erste Nennung bleibt, die beiden folgenden werden zu „sie".' },
    { id: 'anm-ton', kind: 'form', anmerkungsart: 'ton', status: 'open',
      blockId: 'b-calm-schreiben-3',
      target: 'Wer einmal so gearbeitet hat, will nie wieder zurück.',
      short: 'Zwei Sätze klingen nach Werbung statt nach Essay.',
      why: 'Der Text argumentiert sonst nüchtern und überlässt das Urteil der Leserin. Diese beiden Sätze verkaufen — und der Bruch fällt stärker auf als die Behauptung selbst.',
      targets: [
        { blockId: 'b-calm-schreiben-3', text: 'Wer einmal so gearbeitet hat, will nie wieder zurück.', replacement: 'Wer so gearbeitet hat, merkt den Unterschied sofort.' },
        { blockId: 'b-calm-schreiben-3', text: 'Das fühlt sich einfach großartig an.', replacement: 'Das ist keine Geschmacksfrage, sondern eine messbare Entlastung.' },
      ],
      action: 'Beide Sätze auf das zurückführen, was der Text belegen kann.' },
    { id: 'anm-stilmittel', kind: 'form', anmerkungsart: 'stilmittel', status: 'open',
      blockId: 'b-calm-beispiele',
      stilmittelId: 'anapher',
      target: 'Ein ruhiges Werkzeug meldet sich selten.',
      short: 'Hier trägt eine Anapher: dreimal derselbe Auftakt.',
      why: 'Die Anapher wiederholt den Satzanfang „Es meldet sich" und markiert damit jedes Glied als Fortsetzung derselben Reihe — die Form ersetzt das Bindewort. Prüffrage: Trägt jedes Glied eigenes Gewicht, oder füllt eines nur die Form?',
      action: 'Ein ruhiges Werkzeug meldet sich selten. Es meldet sich spät. Es meldet sich nur einmal.' },
    { id: 'anm-anglizismus', kind: 'form', anmerkungsart: 'anglizismus', status: 'open',
      blockId: 'b-calm-schreiben-1',
      target: 'den Workflow',
      short: '„Workflow" ist das einzige englische Wort weit und breit.',
      why: 'Der Text spricht sonst von Denkfluss, Peripherie und Aufmerksamkeit. Ein einzelner Anglizismus wirkt daneben wie aus einer anderen Textsorte hereingerutscht.',
      action: 'den Arbeitsfluss' },
    { id: 'anm-terminologie', kind: 'form', anmerkungsart: 'terminologie', status: 'open',
      blockId: 'b-calm-geschichte-1',
      target: 'dem Randbereich der Aufmerksamkeit',
      short: 'Dieselbe Sache heißt dreimal anders.',
      why: 'Peripherie, Randbereich, Hintergrund — die Leserin muss raten, ob drei Begriffe drei Dinge meinen. Der Text beginnt mit „Peripherie"; dabei sollte er bleiben.',
      compare: [
        { ref: 'Auftakt', text: 'in der Peripherie' },
        { ref: 'Woher der Begriff kommt', text: 'dem Randbereich der Aufmerksamkeit' },
        { ref: 'Was das fürs Schreiben heißt', text: 'Der Hintergrund bleibt dabei ruhig' },
      ],
      targets: [
        { blockId: 'b-calm-geschichte-1', text: 'dem Randbereich der Aufmerksamkeit', replacement: 'der Peripherie der Aufmerksamkeit' },
        { blockId: 'b-calm-schreiben-2', text: 'Der Hintergrund bleibt dabei ruhig', replacement: 'Die Peripherie bleibt dabei ruhig' },
      ],
      action: 'Überall „Peripherie" — der Begriff, mit dem der Text anfängt.' },

    // --- Struktur: Reihenfolge, Übergänge, Gliederung, Fluss, Faden, Titel ------------
    { id: 'anm-verschieben', kind: 'inhalt', anmerkungsart: 'verschieben', status: 'open',
      blockId: 'b-calm-massstab',
      target: 'Woran misst man Ruhe?',
      short: 'Der Maßstab steht hinter den Beispielen — er gehört davor.',
      why: 'Wer erst die Teekanne liest und danach erfährt, woran Ruhe gemessen wird, hat die Beispiele ohne Maßstab beurteilt. Umgestellt trägt der Abschnitt seine eigene Begründung.',
      move: { fromBlockId: 'b-calm-massstab', toBlockId: 'b-calm-beispiele', position: 'before', to: 'Vor die Beispiele — der Maßstab kommt zuerst.' } },
    { id: 'anm-uebergang', kind: 'inhalt', anmerkungsart: 'uebergang', status: 'open',
      blockId: 'b-calm-schreiben-1',
      target: 'Für Schreibsoftware heißt das:',
      short: 'Zwischen Teekanne und Software fehlt die Brücke.',
      why: 'Die Beispiele enden bei physischen Dingen, der nächste Abschnitt springt zur Software. Ein Satz, der das Gemeinsame benennt — informieren, ohne zu unterbrechen —, trägt den Sprung.',
      action: 'Was Teekanne und Statusleuchte verbindet, ist ein Entwurfsprinzip: informieren, ohne zu unterbrechen. Für Schreibsoftware heißt das:' },
    { id: 'anm-gliederung', kind: 'inhalt', anmerkungsart: 'gliederung', status: 'open',
      blockId: 'b-calm-beispiele',
      target: 'Die Teekanne pfeift erst, wenn das Wasser kocht.',
      short: 'Zwei Absätze ohne Überschrift zwischen zwei Abschnitten.',
      why: 'Beispiele und Maßstab bilden einen eigenen Gedanken, stehen aber unter der Überschrift zur Begriffsgeschichte. Eine Zwischenüberschrift macht den Aufbau im Inhaltsverzeichnis sichtbar.',
      heading: { afterBlockId: 'b-calm-geschichte-2', id: 'b-calm-prinzipien-h', text: 'Wie es im Alltag aussieht', level: 2 },
      action: 'Wie es im Alltag aussieht' },
    { id: 'anm-fluss', kind: 'form', anmerkungsart: 'fluss', status: 'open',
      blockId: 'b-calm-schreiben-2',
      target: 'Das Werkzeug wartet. Es prüft im Stillen. Es sammelt. Es meldet sich erst später.',
      short: 'Vier Hauptsätze hintereinander — der Absatz stockt.',
      why: 'Jeder Satz beginnt neu, keiner verbindet sich mit dem vorigen. Als ein Satz gelesen, entsteht die Ruhe, von der der Absatz spricht.',
      action: 'Das Werkzeug wartet, prüft im Stillen und sammelt, was ihm auffällt; melden wird es sich erst später.' },
    { id: 'anm-faden', kind: 'inhalt', anmerkungsart: 'faden', status: 'open',
      blockId: 'b-calm-schluss',
      target: 'Am Ende ist ruhige Technik keine Frage des Verzichts',
      short: 'Der Schluss löst die Leitfrage nicht ausdrücklich auf.',
      why: 'Die Einleitung fragt, wie ein Schreibwerkzeug gestaltet sein muss, damit es das Denken unterstützt. Der Schluss deutet die Antwort nur an — ein Satz davor macht den Bogen sichtbar.',
      action: 'Damit ist die Leitfrage beantwortet: Ein Werkzeug unterstützt das Denken genau dann, wenn es den Zeitpunkt seiner Meldungen dem Schreibenden überlässt.' },
    { id: 'anm-ueberschrift', kind: 'inhalt', anmerkungsart: 'ueberschrift', status: 'open',
      blockId: 'b-calm-auftakt',
      target: 'Calm Technology',
      short: 'Der Titel nennt den Begriff, nicht die These.',
      why: '„Calm Technology" ist ein Stichwort. Wer den Begriff nicht kennt, erfährt aus dem Titel nichts — ein Titel mit These lädt eher zum Lesen ein.',
      action: 'Ruhige Technik: warum gute Werkzeuge schweigen können' },

    // --- Inhalt: Gespräch, Belege, Widerspruch, Lücke, Verständlichkeit ---------------
    { id: 'anm-anmerkung', kind: 'inhalt', anmerkungsart: 'anmerkung', status: 'open',
      blockId: 'b-calm-schluss',
      target: 'volle Kraft, leise Präsentation',
      short: 'Die Formel steht im Nebensatz — sie könnte allein stehen.',
      why: 'Die Antithese ist der Merksatz des ganzen Textes. Ob sie als eigener Schlusssatz stärker wirkt, entscheidet der Klang — das ist eine Frage an dich, keine Korrektur.',
      thread: [{ id: 'message-anm-anmerkung-0', role: 'agent', at: 0,
        text: 'Die Formel „volle Kraft, leise Präsentation" hängt gerade hinter einem Doppelpunkt. Als eigener Satz gesetzt, bekäme sie eine Pause davor. Willst du sie so stehen lassen oder freistellen?' }] },
    { id: 'anm-beleg', kind: 'inhalt', anmerkungsart: 'beleg', status: 'open',
      blockId: 'b-calm-geschichte-1',
      target: 'beschrieb er 1996',
      short: 'Die Jahreszahl trägt das Argument — hier gehört die Quelle hin.',
      why: 'Dein Belegmaßstab verlangt für historische Aussagen eine sichtbare Primärquelle. Der Aufsatz von 1996 ist genau das: die Stelle, an der der Begriff zum ersten Mal steht.',
      sources: [{
        label: 'Weiser & Brown (1996): The Coming Age of Calm Technology',
        type: 'Primärquelle',
        url: 'https://calmtech.com/papers',
        contentType: 'original-excerpt',
        content: 'The most potentially interesting, challenging, and profound change implied by the ubiquitous computing era is a focus on calm.',
        citation: 'Weiser, M., & Brown, J. S. (1996). The Coming Age of Calm Technology.',
        verificationStatus: 'demo',
        locator: 'Demo-Fundstelle: Aufsatz, einleitender Abschnitt',
        limits: 'Die Quelle belegt den Ursprung des Begriffs, nicht die Wirkung einer bestimmten Software.',
      }] },
    { id: 'anm-faktencheck', kind: 'inhalt', anmerkungsart: 'faktencheck', status: 'open',
      blockId: 'b-calm-geschichte-2',
      target: 'in zwölf Prinzipien',
      short: 'Amber Case nennt acht Prinzipien, nicht zwölf.',
      why: 'Eine falsche Zahl an einer prüfbaren Stelle beschädigt das Vertrauen in alle anderen Angaben des Textes — auch in die richtigen.',
      action: 'in acht Prinzipien',
      sources: [{
        label: 'Case, A. (2015): Calm Technology — Principles',
        type: 'Buch',
        url: 'https://calmtech.com',
        contentType: 'summary',
        content: 'Amber Case fasst den Ansatz in acht Gestaltungsprinzipien für aufmerksamkeitsarme Technik.',
        citation: 'Case, A. (2015). Calm Technology. O’Reilly Media.',
        verificationStatus: 'demo',
        locator: 'Demo-Angabe: Buchzusammenfassung ohne live geprüfte Seite',
      }] },
    { id: 'anm-widerspruch', kind: 'inhalt', anmerkungsart: 'widerspruch', status: 'open',
      blockId: 'b-calm-warum-3',
      target: 'Jede Unterbrechung ist ein Verlust, ausnahmslos.',
      short: 'Zwei Stellen im Text widersprechen einander.',
      why: 'Oben steht „ausnahmslos", unten steht die Ausnahme. Ein Leser, der beides bemerkt, traut ab da keiner der beiden Stellen mehr — die abgeschwächte Fassung ist außerdem die haltbarere.',
      compare: [
        { ref: 'Warum es wichtig ist', text: 'Jede Unterbrechung ist ein Verlust, ausnahmslos.' },
        { ref: 'Ein Einwand', text: 'es gibt Meldungen, die unterbrechen müssen' },
      ],
      action: 'Die meisten Unterbrechungen sind ein Verlust.' },
    { id: 'anm-luecke', kind: 'inhalt', anmerkungsart: 'luecke', status: 'open',
      blockId: 'b-calm-einwand',
      target: 'Ein Rauchmelder, der höflich wartet, ist ein schlechter Rauchmelder',
      short: 'Der Einwand bleibt beim Notfall stehen.',
      why: 'Neben dem Notfall gibt es Arbeit, die aus Unterbrechungen besteht: Pflege, Leitstelle, Kundendienst. Für diese Menschen ist „ruhig" kein Ziel, sondern ein Hindernis — das Gegenargument macht deine These belastbarer.',
      thread: [{ id: 'message-anm-luecke-0', role: 'agent', at: 0,
        text: 'Der Rauchmelder ist der offensichtliche Einwand. Der unbequemere: Für wen ist Unterbrechung die Arbeit selbst — und gilt dein Maßstab für die auch?' }] },
    { id: 'anm-verstaendlichkeit', kind: 'inhalt', anmerkungsart: 'verstaendlichkeit', status: 'open',
      blockId: 'b-calm-geschichte-1',
      target: 'den Begriff Ubiquitous Computing',
      short: '„Ubiquitous Computing" fällt ohne Erklärung.',
      why: 'Der Begriff trägt den ganzen historischen Abschnitt, wird aber vorausgesetzt. Ein Halbsatz genügt — er kostet nichts und rettet alle, die den Ausdruck zum ersten Mal lesen.',
      action: 'den Begriff Ubiquitous Computing — die Idee, dass Rechenkraft unsichtbar in Alltagsdinge wandert, statt auf einem Bildschirm zu sitzen' },

    // --- Notizen: die fünf Arten für lose Gedanken -----------------------------------
    { id: 'anm-ausformulieren', kind: 'inhalt', anmerkungsart: 'ausformulieren', status: 'open',
      blockId: 'b-calm-notiz-2',
      target: 'der Unterschied zwischen Stille und Ruhe',
      short: 'Aus dem Stichwort lässt sich ein Absatz machen.',
      why: 'Die Notiz enthält bereits die Unterscheidung, nur noch nicht ausgesprochen. So formuliert, ist sie ein Baustein für den Abschnitt über die Haltung.',
      action: 'Stille ist die Abwesenheit von Geräusch. Ruhe ist die Abwesenheit von Zwang. Ein Werkzeug darf sich melden — solange es nichts erzwingt.' },
    { id: 'anm-buendeln', kind: 'inhalt', anmerkungsart: 'buendeln', status: 'open',
      blockId: 'b-calm-notiz-6',
      target: 'die Ampel, die nur bei Rot etwas verlangt',
      short: 'Diese Notiz gehört zur Beispielsammlung weiter oben.',
      why: 'Teekanne, Statusleuchte, Armbanduhr und Ampel sind dieselbe Sorte Beleg. Beieinander sieht man, ob die Reihe trägt oder ob ein Beispiel zu viel ist.',
      move: { fromBlockId: 'b-calm-notiz-6', toBlockId: 'b-calm-notiz-1', position: 'after', to: 'Direkt unter die Notiz mit Teekanne und Statusleuchte' } },
    { id: 'anm-nachfrage', kind: 'inhalt', anmerkungsart: 'nachfrage', status: 'open',
      blockId: 'b-calm-notiz-3',
      target: 'aber der Ton passt vielleicht nicht',
      short: 'Wessen Ton ist gemeint?',
      why: 'Die Notiz kann zweierlei heißen: Harris’ eigener Ton passt nicht zu deinem Text, oder dein Text müsste seinen Ton ändern, um ihn zu zitieren. Das entscheidet, ob die Quelle bleibt.',
      thread: [{ id: 'message-anm-nachfrage-0', role: 'agent', at: 0,
        text: 'Meinst du, dass Tristan Harris’ Tonfall zu alarmierend für deinen Essay ist — oder dass dein Essay zu ruhig ist, um ihn zu zitieren?' }] },
    { id: 'anm-ordnen', kind: 'inhalt', anmerkungsart: 'ordnen', status: 'open',
      blockId: 'b-calm-notiz-5',
      target: 'Der Maßstab ist noch nicht zu Ende gedacht',
      short: 'Die offenste Frage steht ganz unten.',
      why: 'Die anderen Notizen sind Fundstücke, diese eine ist eine offene Baustelle. Oben stehend, ist sie beim nächsten Öffnen das Erste, was du siehst.',
      move: { fromBlockId: 'b-calm-notiz-5', toBlockId: 'b-calm-notizen-h', position: 'after', to: 'An den Anfang der Notizen, direkt unter die Überschrift' } },
    { id: 'anm-aufgreifen', kind: 'inhalt', anmerkungsart: 'aufgreifen', status: 'open',
      blockId: 'b-calm-notiz-5',
      target: 'im Text steht bisher nur die halbe Antwort',
      short: 'Ein angefangener Gedanke wartet seit dem letzten Durchgang.',
      why: 'Die Notiz nennt eine Lücke, die der Text tatsächlich hat: Der Maßstab misst Unterbrechungen, aber nicht, was ein Werkzeug im gleichen Zug gewinnt. Der Faden ist noch offen.',
      thread: [{ id: 'message-anm-aufgreifen-0', role: 'agent', at: 0,
        text: 'Die halbe Antwort steht im Abschnitt über den Maßstab. Die andere Hälfte hast du hier notiert, aber nie in den Text geholt — willst du das jetzt?' }] },
  ]
}

// Der Beispieltext. Jeder Baustein trägt seine Kennung schon hier im Quelltext:
// Verschieben, Gliedern und Mehrfachersetzungen brauchen eine Kennung, die vor dem
// ersten Öffnen feststeht — sonst hätten diese Anmerkungen kein Ziel. Die Kennungen
// überleben das Laden (block-identity.js) und werden in der Seed-Signatur
// ausgeblendet (example-seed.mjs), zählen also nicht als Änderung.
//
// Der Text enthält absichtlich Schwächen: einen Tippfehler, einen Dativ nach „wegen",
// ein fehlendes Komma, eine falsche Zahl, einen Widerspruch, einen Anglizismus, drei
// Namen für dieselbe Sache. Sie sind die echten Anlässe der Anmerkungen oben — ohne
// sie wären die Anmerkungen Behauptungen über einen Text, der sie gar nicht hergibt.
export function buildExampleBody() {
  return [
    '<p data-block-id="b-calm-auftakt">Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird. Der Gedanke ist über dreißig Jahre alt; die Erfahrung, die ihn nötig macht, ist täglich neu.</p>',
    '<h2 data-block-id="b-calm-warum-h">Warum es wichtig ist</h2>',
    '<p data-block-id="b-calm-warum-1">Ständige Benachrichtigungen fragmentieren die Konzentation und zerreißen den Denkfluss. Der eigentliche Schaden ist nicht die einzelne Meldung, sondern die Summe der kleinen Unterbrechungen über den Tag. Wegen dem ständigen Nachfragen bleibt am Abend das Gefühl, viel getan und wenig gedacht zu haben.</p>',
    '<p data-block-id="b-calm-warum-2">Aufmerksamkeit ist die eigentliche Währung dieser Jahre. Wer Aufmerksamkeit verliert, verliert nicht nur Zeit, sondern den Faden; und wer den Faden verliert, muss Aufmerksamkeit noch einmal aufbringen, um ihn wiederzufinden. Man merkt erst dass diese Rechnung nicht aufgeht, wenn der Nachmittag vorbei ist.</p>',
    '<p data-block-id="b-calm-warum-3">Dass die Technik, die uns umgibt, in dem Augenblick, in dem sie etwas von uns will, nur selten fragt, ob es gerade passt, ist kein Zufall, sondern eine Entscheidung am Reißbrett. Das gilt in einer ganzen Reihe von Fällen, die man durchaus als typisch bezeichnen kann. Jede Unterbrechung ist ein Verlust, ausnahmslos.</p>',
    '<h2 data-block-id="b-calm-geschichte-h">Woher der Begriff kommt</h2>',
    '<p data-block-id="b-calm-geschichte-1">Mark Weiser prägte am Xerox PARC den Begriff Ubiquitous Computing. Gemeinsam mit John Seely Brown beschrieb er 1996, wie Technik zwischen dem Zentrum und dem Randbereich der Aufmerksamkeit wechseln kann.</p>',
    '<p data-block-id="b-calm-geschichte-2">Amber Case hat den Ansatz zwei Jahrzehnte später in zwölf Prinzipien übersetzt. Sie sind bis heute die brauchbarste Prüfliste für alle, die etwas bauen, das sich melden könnte.</p>',
    '<p data-block-id="b-calm-beispiele">Die Teekanne pfeift erst, wenn das Wasser kocht. Eine Statusleuchte informiert, ohne sich in den Vordergrund zu drängen. Ein ruhiges Werkzeug meldet sich selten.</p>',
    '<p data-block-id="b-calm-massstab">Woran misst man Ruhe? An der Zahl der Unterbrechungen, die ein Werkzeug erzwingt, und an der Zeit, die es kostet, den Faden wiederzufinden. Ohne diesen Maßstab bleibt jedes Beispiel Geschmackssache.</p>',
    '<h2 data-block-id="b-calm-schreiben-h">Was das fürs Schreiben heißt</h2>',
    '<p data-block-id="b-calm-schreiben-1">Für Schreibsoftware heißt das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss. Eine Rechtschreibprüfung, die jeden Tippfehler sofort anstreicht, unterbricht öfter als sie hilft; eine, die ihre Funde am Rand sammelt, stört den Workflow nicht.</p>',
    '<p data-block-id="b-calm-schreiben-2">Das Werkzeug wartet. Es prüft im Stillen. Es sammelt. Es meldet sich erst später. Der Hintergrund bleibt dabei ruhig, und vorn steht weiter der Satz, an dem gerade gearbeitet wird.</p>',
    '<p data-block-id="b-calm-schreiben-3">Wer einmal so gearbeitet hat, will nie wieder zurück. Das fühlt sich einfach großartig an. Nüchtern betrachtet verschiebt sich nur, wann eine Information erscheint — und genau darin liegt der ganze Unterschied.</p>',
    '<p data-block-id="b-calm-haltung">Ein ruhiges Werkzeug verzichtet nicht auf Funktionen, es ordnet sie nur anders an, es zeigt sie dann, wenn sie gebraucht werden, es hält sie zurück, wenn sie stören würden, und es überlässt die Entscheidung darüber der Person, die schreibt.</p>',
    '<h2 data-block-id="b-calm-einwand-h">Ein Einwand</h2>',
    '<p data-block-id="b-calm-einwand">So absolut lässt sich das nicht halten. Ein Rauchmelder, der höflich wartet, ist ein schlechter Rauchmelder; es gibt Meldungen, die unterbrechen müssen.</p>',
    '<p data-block-id="b-calm-schluss">Am Ende ist ruhige Technik keine Frage des Verzichts, sondern der Haltung: volle Kraft, leise Präsentation.</p>',
    '<h2 data-block-id="b-calm-notizen-h">Notizen für den nächsten Durchgang</h2>',
    '<p data-block-id="b-calm-notiz-1">— Teekanne, Statusleuchte, Armbanduhr: Dinge, die informieren, ohne zu rufen.</p>',
    '<p data-block-id="b-calm-notiz-2">— irgendwo unterbringen: der Unterschied zwischen Stille und Ruhe</p>',
    '<p data-block-id="b-calm-notiz-3">— Amber Case zitieren? evtl. auch Tristan Harris, aber der Ton passt vielleicht nicht</p>',
    '<p data-block-id="b-calm-notiz-4">— Gegenprobe: Wo wäre ruhige Technik gefährlich? Medizin, Auto, Baustelle</p>',
    '<p data-block-id="b-calm-notiz-5">— Der Maßstab ist noch nicht zu Ende gedacht; im Text steht bisher nur die halbe Antwort.</p>',
    '<p data-block-id="b-calm-notiz-6">— noch ein Beispiel: die Ampel, die nur bei Rot etwas verlangt</p>',
  ].join('')
}

export function buildExampleMaterial() {
  return [
    { id: sid('m'), kind: 'Notiz', text: 'Ruhige Technik = volle Kraft, leise Präsentation. Vielleicht als Schlussformel?', x: 24, y: 40 },
    { id: sid('m'), kind: 'PDF', text: 'Weiser & Brown (1996): The Coming Age of Calm Technology — Originalaufsatz, 8 Seiten.', x: 150, y: 168 },
    { id: sid('m'), kind: 'YouTube', text: 'Amber Case: „Calm Technology" — Vortrag, gute Beispiele ab Minute 12.', x: 40, y: 300 },
    { id: sid('m'), kind: 'Zitat', text: '„Technology should require the smallest possible amount of attention." — Case, Prinzip 1', x: 172, y: 424 },
  ]
}

// Das Beispielprojekt bleibt vom Pausen-Ausloeser ausgeschlossen: Eine Vorfuehrung soll
// nichts kosten und ohne Schluessel funktionieren. Damit die Struktur-Spalte dort trotzdem
// etwas zeigt, kommt der Bestand mitgeliefert -- so wie die vorgefertigten Anmerkungen auch.
//
// Die Namen sind die eines Essays, nicht die einer allgemeinen Liste: 'Anlass' und 'Einwand'
// wuerde eine Lektorin bei DIESEM Text sagen, 'Kernbehauptung' und 'Gegenposition' stehen im
// Lehrbuch. Genau dieser Unterschied ist der Zweck der Erkennung, und das Beispiel muss ihn
// vorfuehren, sonst fuehrt es das Falsche vor.
//
// funktion ist die unsichtbare Seite: Sie speist block.role und damit die Rechenlogik
// (claim-ledger.mjs, argument-projection.mjs). Genau EINE Art traegt claim -- die Projektion
// verlangt genau eine zentrale Aussage und kehrt sonst wirkungslos zurueck.
//
// Die Kennungen und die Zeichenzahlen stammen aus buildExampleBody(), einmal gemessen.
export function buildExampleBausteinarten() {
  return {
    textsorte: 'Essay',
    arten: [
      { id: 'art-bsp-anlass', name: 'Anlass', beschreibung: 'Setzt den Gegenstand und sagt, worum es geht.', funktion: 'claim' },
      { id: 'art-bsp-begruendung', name: 'Begründung', beschreibung: 'Trägt einen Grund für die These nach.', funktion: 'evidence' },
      { id: 'art-bsp-herkunft', name: 'Herkunft', beschreibung: 'Woher der Gedanke stammt und von wem.', funktion: 'evidence' },
      { id: 'art-bsp-bild', name: 'Bild', beschreibung: 'Macht den Gedanken an einem konkreten Fall greifbar.', funktion: null },
      { id: 'art-bsp-massstab', name: 'Maßstab', beschreibung: 'Benennt, woran sich die Behauptung messen lässt.', funktion: null },
      { id: 'art-bsp-haltung', name: 'Haltung', beschreibung: 'Sagt, was daraus für die eigene Arbeit folgt.', funktion: null },
      { id: 'art-bsp-einwand', name: 'Einwand', beschreibung: 'Spricht gegen die eigene These.', funktion: 'counterpoint' },
      { id: 'art-bsp-schluss', name: 'Schluss', beschreibung: 'Führt die Fäden zusammen.', funktion: 'transition' },
      { id: 'art-bsp-notiz', name: 'Notiz', beschreibung: 'Material für den nächsten Durchgang, noch nicht Text.', funktion: null },
    ],
    zuordnung: {
      'b-calm-auftakt': { artId: 'art-bsp-anlass', zeichen: 227 },
      'b-calm-warum-1': { artId: 'art-bsp-begruendung', zeichen: 301 },
      'b-calm-warum-2': { artId: 'art-bsp-begruendung', zeichen: 306 },
      'b-calm-warum-3': { artId: 'art-bsp-begruendung', zeichen: 316 },
      'b-calm-geschichte-1': { artId: 'art-bsp-herkunft', zeichen: 203 },
      'b-calm-geschichte-2': { artId: 'art-bsp-herkunft', zeichen: 176 },
      'b-calm-beispiele': { artId: 'art-bsp-bild', zeichen: 161 },
      'b-calm-massstab': { artId: 'art-bsp-massstab', zeichen: 198 },
      'b-calm-schreiben-1': { artId: 'art-bsp-begruendung', zeichen: 288 },
      'b-calm-schreiben-2': { artId: 'art-bsp-bild', zeichen: 180 },
      'b-calm-schreiben-3': { artId: 'art-bsp-haltung', zeichen: 210 },
      'b-calm-haltung': { artId: 'art-bsp-haltung', zeichen: 240 },
      'b-calm-einwand': { artId: 'art-bsp-einwand', zeichen: 152 },
      'b-calm-schluss': { artId: 'art-bsp-schluss', zeichen: 107 },
      'b-calm-notiz-1': { artId: 'art-bsp-notiz', zeichen: 77 },
      'b-calm-notiz-2': { artId: 'art-bsp-notiz', zeichen: 65 },
      'b-calm-notiz-3': { artId: 'art-bsp-notiz', zeichen: 85 },
      'b-calm-notiz-4': { artId: 'art-bsp-notiz', zeichen: 73 },
      'b-calm-notiz-5': { artId: 'art-bsp-notiz', zeichen: 89 },
      'b-calm-notiz-6': { artId: 'art-bsp-notiz', zeichen: 62 },
    },
    laufSignatur: '',
    standAt: 0,
  }
}
