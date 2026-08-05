// Stilmittel — PUR, node-testbar, kein DOM, kein Netz.
//
// Die Frage, die dieses Modul beantwortet: WELCHES sprachliche Mittel trägt bei DIESER
// Textart, und welches wirkt dort aufgesetzt? Nicht: welche Stilmittel es gibt. Das sind
// zwei verschiedene Dinge. Eine Figurenliste ist ein Lexikon; sie sagt niemandem, ob ein
// Chiasmus im Methodenteil eine gute Idee ist.
//
// Warum es das Modul überhaupt gibt: Ein Begriff von Stilmittel fehlte im Programm
// vollständig. Es gab eine Rechtschreibliste aus drei Wörtern, eine Grammatikregel und
// keinen einzigen Namen für das, was einen Text sprachlich trägt. Die Hinweisart 'sprache'
// hieß deshalb nur "Wortwahl, Register oder Satzbau passen nicht" — sie konnte gar nichts
// anderes benennen.
//
// Die Regel dahinter: Kein Mittel ist an sich gut oder schlecht. Dieselbe Alliteration ist
// im Slogan Handwerk und im Methodenteil ein Registerbruch. Was ein Mittel wert ist, hängt
// daran, was der Text tun soll — also an der Textart.
//
// Fail-closed: Ist die Textart unbekannt oder gar nicht angegeben, trägt hier nichts. Der
// Agent darf dann diagnostizieren, was im Text schon steht, aber kein Mittel vorschlagen.
// Ein Vorschlag ohne Textart ist ein Ratschlag ins Blaue, und Ratschläge ins Blaue sind
// genau die, die einem Text die eigene Stimme nehmen.
//
// Grundlage: docs/research/2026-08-05-feld-stilmittel.md (Lausberg für die Systematik,
// Menninghaus/Dubey/Heritage für die Mechanismen, Lakoff/Bowdle für die Tropen).

import { LANGUAGE_GENRES } from './language-profile.mjs'

// Die Textarten sind KEINE eigene Liste: es sind die des Sprachprofils, unverändert
// weitergereicht — wie in textart-regeln.mjs. Zwei Listen wären zwei Wahrheiten.
export const STILMITTEL_TEXTARTEN = LANGUAGE_GENRES

// Namen für den Prompt. Sie stehen hier, weil ein reines Modul keinen Zugriff auf die
// Oberflächenbeschriftungen haben darf (language-ui.mjs ist DOM-Code). Fehlt eine Textart,
// fällt der Name auf den Schlüssel zurück — dann steht dort 'prosa' statt 'Prosa', aber
// nie eine Leerstelle.
export const TEXTART_NAME = Object.freeze({
  scientific: 'wissenschaftlicher Text',
  essay: 'Essay',
  project: 'Projekttext',
  web: 'Webtext',
  marketing: 'Marketingtext',
  campaign: 'Kampagnentext',
  prosa: 'Prosa',
  lyrik: 'Lyrik',
  other: 'Sonstiges',
})

// Die fünf Klassen der Arbeitssystematik (Klang, Wort, Satz, Gedanke, Trope). Sie sind
// keine Wissenschaftstaxonomie, sondern ein Werkzeugbrett — und sie entscheiden, WIE
// sicher ein Mittel überhaupt erkennbar ist (siehe ERKENNUNG).
export const STILMITTEL_KLASSEN = Object.freeze(['klang', 'wort', 'satz', 'gedanke', 'trope'])

export const KLASSE_NAME = Object.freeze({
  klang: 'Klangfigur',
  wort: 'Wortfigur',
  satz: 'Satzfigur',
  gedanke: 'Gedankenfigur',
  trope: 'Trope',
})

// Fast alle Stilmittel arbeiten über genau drei Mechanismen. Wer den Mechanismus kennt,
// braucht die Figurennamen nicht auswendig — deshalb steht er in jedem Hinweis.
export const MECHANISMEN = Object.freeze(['wiederholung', 'abweichung', 'uebertragung'])

export const MECHANISMUS_ERKLAERUNG = Object.freeze({
  wiederholung: 'Was formgleich wiederkehrt, liest sich schneller, wird als zusammengehörig '
    + 'erlebt und besser erinnert. Die Form übernimmt die Verbindung, die sonst ein Bindewort '
    + 'leisten müsste.',
  abweichung: 'Was von der erwartbaren Form abweicht, fällt auf und zieht die Aufmerksamkeit '
    + 'genau dorthin. Der Preis ist Verarbeitungsaufwand: Auffälligkeit kauft Einprägsamkeit '
    + 'gegen Verstehenskosten.',
  uebertragung: 'Ein Bild importiert nicht ein Bild, sondern ein Bündel von Beziehungen aus '
    + 'einem anderen Bereich, mit dem der Leser dann weiterdenkt. Wer die Übertragung wählt, '
    + 'wählt mit, was an der Sache sichtbar wird und was das Bild verdeckt.',
})

// Wie sicher lässt sich das Mittel überhaupt finden? Der Unterschied ist kein Detail: Bei
// 'form' steht die Figur an der Oberfläche und die Zuordnung ist belastbar. Bei 'sinn'
// braucht es Bedeutung, und jede Zuordnung bleibt eine Wirkungshypothese, die danebenliegen
// darf. Ein Agent, der beides gleich sicher behauptet, täuscht.
export const ERKENNUNG = Object.freeze(['form', 'sinn'])

// Die vollständige Tabelle: 23 Mittel in fünf Klassen. Je Zeile: was es ist, welcher
// Mechanismus arbeitet, wie sicher es erkennbar ist, was es leistet, wann es kippt, welche
// Prüffrage der Autorin oder dem Autor die Entscheidung überlässt — und bei welchen
// Textarten es trägt beziehungsweise aufgesetzt wirkt.
//
// traegt und aufgesetzt sind BEIDE unvollständig, und das ist Absicht. Eine Textart, die in
// keiner der beiden Listen steht, ist der dritte Fall: erlaubt, aber nichts, wozu man rät.
// Wer alle neun Textarten in jede Zeile zwingt, erfindet Urteile, die niemand hat.
export const STILMITTEL = Object.freeze([
  // --- Klangfiguren -------------------------------------------------------------------
  Object.freeze({
    id: 'alliteration',
    name: 'Alliteration',
    klasse: 'klang',
    mechanismus: 'wiederholung',
    erkennung: 'form',
    was: 'Gleicher Anlaut in benachbarten betonten Wörtern.',
    leistung: 'Der Gleichklang wirkt als Gedächtnisanker: Lautähnliche Stellen rufen einander '
      + 'auf, auch beim stillen Lesen. Deshalb trägt sie an Merkstellen — Titel, Zwischentitel, '
      + 'Merksatz, Slogan.',
    kippt: 'Die dritte Alliteration in Folge wird zur Manier. Und wo sie eine unbelegte '
      + 'Behauptung eingängiger klingen lässt, verschiebt sie Überzeugungsarbeit vom Beleg '
      + 'zum Klang.',
    pruefFrage: 'Soll diese Stelle erinnert werden — oder soll sie verstanden werden?',
    traegt: Object.freeze(['marketing', 'campaign', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'reim',
    name: 'Reim',
    klasse: 'klang',
    mechanismus: 'wiederholung',
    erkennung: 'form',
    was: 'Gleichklang der Wortausgänge an Zeilen- oder Satzenden.',
    leistung: 'Reim macht Sätze nicht nur merkbar, sondern glaubhafter: Gereimte Aussagen '
      + 'werden als zutreffender beurteilt als bedeutungsgleiche ungereimte. Das ist im '
      + 'Merksatz ein Gewinn.',
    kippt: 'Genau dieselbe Wirkung ist im Sachtext ein Problem: Die gefühlte Wahrheit stammt '
      + 'dann aus der Form, nicht aus der Sache. Ein Reim, der ein Argument trägt, ersetzt es.',
    pruefFrage: 'Wirkt der Satz überzeugender, weil er stimmt — oder weil er klingt?',
    traegt: Object.freeze(['campaign', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project', 'web']),
    vorsicht: '',
  }),

  // --- Wortfiguren: die Wiederholungsfamilie -------------------------------------------
  Object.freeze({
    id: 'anapher',
    name: 'Anapher',
    klasse: 'wort',
    mechanismus: 'wiederholung',
    erkennung: 'form',
    was: 'Gleicher Anfang aufeinanderfolgender Sätze oder Wortgruppen.',
    leistung: 'Der gleiche Auftakt markiert jedes neue Glied als Fortsetzung derselben Reihe. '
      + 'Der Leser weiß vor dem Inhalt, dass noch etwas zur selben Sache kommt — die Form '
      + 'ersetzt das Bindewort.',
    kippt: 'Wenn das dritte Glied nichts trägt, was das zweite nicht schon trug, ist die Reihe '
      + 'Füllung. Und dieselbe Wortwiederholung ohne Figurenwillen ist keine Anapher, sondern '
      + 'ein Lapsus.',
    pruefFrage: 'Trägt jedes Glied der Reihe eigenes Gewicht, oder füllt eines nur die Form?',
    traegt: Object.freeze(['essay', 'marketing', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'anadiplose',
    name: 'Anadiplose',
    klasse: 'wort',
    mechanismus: 'wiederholung',
    erkennung: 'form',
    was: 'Das Ende der einen Einheit wird zum Anfang der nächsten.',
    leistung: 'Die Verschränkung baut eine Kette und eignet sich deshalb genau dort, wo eine '
      + 'Kette gemeint ist: Ursachenfolge, Steigerung, Schritt für Schritt.',
    kippt: 'Wo keine Folge besteht, behauptet die Kettenform eine Kausalität, die es nicht gibt.',
    pruefFrage: 'Führt das eine wirklich zum anderen, oder steht beides nur nebeneinander?',
    traegt: Object.freeze(['essay', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'polyptoton',
    name: 'Polyptoton',
    klasse: 'wort',
    mechanismus: 'wiederholung',
    erkennung: 'form',
    was: 'Dasselbe Wort kehrt in anderer Form wieder — der Mensch dem Menschen.',
    leistung: 'Die sparsamste Art, eine Beziehung auszudrücken: Der Gegenstand bleibt derselbe, '
      + 'nur seine Rolle im Satz wechselt. Es braucht kein neues Vokabular und keine Erklärung.',
    kippt: 'Selten. Am ehesten dort, wo die Formgleichheit eine Symmetrie behauptet, die '
      + 'sachlich nicht besteht.',
    pruefFrage: 'Ist die Beziehung wirklich wechselseitig, wie die Form es nahelegt?',
    traegt: Object.freeze(['essay', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze([]),
    vorsicht: '',
  }),

  // --- Satzfiguren: das Arbeitspferd der Gebrauchstexte --------------------------------
  Object.freeze({
    id: 'parallelismus',
    name: 'Parallelismus',
    klasse: 'satz',
    mechanismus: 'wiederholung',
    erkennung: 'form',
    was: 'Gleicher Satzbau in benachbarten Einheiten.',
    leistung: 'Messbare Lesehilfe: Das zweite Glied wird schneller gelesen, wenn es gebaut ist '
      + 'wie das erste. Zugleich signalisiert die Gleichform Gleichrangigkeit des Inhalts. Das '
      + 'ist das unauffälligste Mittel überhaupt — es fällt nicht als Rhetorik auf.',
    kippt: 'Leere Symmetrie: Gleichform über Ungleichrangiges behauptet eine Ordnung, die es '
      + 'nicht gibt.',
    pruefFrage: 'Sind die Glieder wirklich gleichrangig, oder macht die Form sie nur gleich?',
    traegt: Object.freeze(['scientific', 'essay', 'project', 'web', 'marketing', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze([]),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'trikolon',
    name: 'Dreierreihe',
    klasse: 'satz',
    mechanismus: 'wiederholung',
    erkennung: 'form',
    was: 'Drei gleichgebaute Glieder in einer Reihe.',
    leistung: 'Drei ist die kleinste Zahl, bei der zwei Glieder ein Muster stiften und das '
      + 'dritte es bestätigt und schließt. Deshalb hört man am dritten Glied, dass die Reihe zu '
      + 'Ende ist — in Reden löst genau das den Applaus aus.',
    kippt: 'Die Reihe schließt FORMAL ab, unabhängig davon, ob die Aufzählung sachlich '
      + 'vollständig ist. Ein drittes Glied, das nur rundet, täuscht Vollständigkeit vor.',
    pruefFrage: 'Formal geschlossen — aber ist die Aufzählung auch sachlich vollständig?',
    traegt: Object.freeze(['essay', 'marketing', 'campaign']),
    aufgesetzt: Object.freeze(['scientific']),
    vorsicht: 'Dreierlisten sind die häufigste Signatur maschinell geschriebener Texte. '
      + 'Diagnostizieren ja, von dir aus vorschlagen nur mit einem Grund, der an dieser Stelle liegt.',
  }),
  Object.freeze({
    id: 'klimax',
    name: 'Klimax',
    klasse: 'satz',
    mechanismus: 'wiederholung',
    erkennung: 'form',
    was: 'Eine Reihe, deren Glieder an Gewicht zunehmen.',
    leistung: 'Die Steigerung gibt der Reihe eine Richtung: Sie sagt nicht nur, dass mehreres '
      + 'gilt, sondern wohin es läuft. Das ist die Standardform des Schlusses.',
    kippt: 'Ohne echte Steigerung ist es eine Aufzählung, die sich für einen Höhepunkt hält. '
      + 'Und ein Höhepunkt mitten im Text lässt den Rest wie Nachklapp wirken.',
    pruefFrage: 'Steigt hier wirklich etwas — und ist das hier die Stelle für einen Höhepunkt?',
    traegt: Object.freeze(['essay', 'marketing', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project', 'web']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'antithese',
    name: 'Antithese',
    klasse: 'satz',
    mechanismus: 'abweichung',
    erkennung: 'form',
    was: 'Zwei Positionen als Gegensatz gegenübergestellt.',
    leistung: 'Das wirksamste Einzelformat überhaupt: Ein Gegensatzpaar spannt einen '
      + 'vollständigen Möglichkeitsraum auf und macht die eigene Position als dessen Auflösung '
      + 'hörbar. Wo ein echter Gegensatz besteht, ist sie auch im Sachtext die klarste Form.',
    kippt: 'Schein-Antithese: Wenn die verneinte Position niemand vertritt, ist es ein '
      + 'Strohmann in Satzform. Das ist dann kein Sprach-, sondern ein Logikbefund.',
    pruefFrage: 'Hat die verneinte Position einen echten Vertreter?',
    traegt: Object.freeze(['scientific', 'essay', 'project', 'web', 'marketing', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze([]),
    vorsicht: 'Die Form "nicht X, sondern Y" ist die zweite große Signatur maschinell '
      + 'geschriebener Texte. Prüfe bei jedem Vorschlag, ob X wirklich behauptet wurde.',
  }),
  Object.freeze({
    id: 'chiasmus',
    name: 'Chiasmus',
    klasse: 'satz',
    mechanismus: 'abweichung',
    erkennung: 'form',
    was: 'Überkreuzstellung: erst A-B, dann B-A.',
    leistung: 'Die Umkehrung wird syntaktisch vollzogen, nicht nur behauptet. Das ist die '
      + 'schärfste Form des Kontrasts, weil die Form die Aussage schon macht.',
    kippt: 'Der Chiasmus ist so auffällig, dass er die Sache überstrahlt. Wo die Umkehrung '
      + 'nicht wirklich gilt, bleibt nur ein Bonmot.',
    pruefFrage: 'Gilt die Umkehrung sachlich, oder klingt sie nur gut?',
    traegt: Object.freeze(['essay', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project', 'web']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'ellipse',
    name: 'Ellipse',
    klasse: 'satz',
    mechanismus: 'abweichung',
    erkennung: 'form',
    was: 'Auslassung des Erwartbaren — meist des Verbs.',
    leistung: 'Ein Temporegler nach oben. Was fehlt, ergänzt der Leser selbst, und Ergänztes '
      + 'wird stärker mitgetragen als Vorgesagtes. Deshalb trägt sie in Schlagzeile, Slogan '
      + 'und in erlebter Rede.',
    kippt: 'Wo mehr als eine Ergänzung möglich ist, spart die Ellipse nicht Wörter, sondern '
      + 'Eindeutigkeit.',
    pruefFrage: 'Gibt es genau eine Ergänzung, die jeder Leser einsetzt?',
    traegt: Object.freeze(['web', 'marketing', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'asyndeton',
    name: 'Asyndeton',
    klasse: 'satz',
    mechanismus: 'abweichung',
    erkennung: 'form',
    was: 'Reihung ohne Bindewörter — kam, sah, siegte.',
    leistung: 'Beschleunigt: Die Glieder rücken zusammen, die Reihe wirkt gedrängt und offen, '
      + 'als ließe sie sich fortsetzen.',
    kippt: 'Ohne Bindewort fehlt auch die Angabe, WIE die Glieder zusammenhängen. Wo das '
      + 'Verhältnis zählt, ist das Tempo zu teuer erkauft.',
    pruefFrage: 'Ist das Verhältnis der Glieder zueinander gleichgültig — oder wäre es die '
      + 'eigentliche Aussage?',
    traegt: Object.freeze(['essay', 'marketing', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'polysyndeton',
    name: 'Polysyndeton',
    klasse: 'satz',
    mechanismus: 'abweichung',
    erkennung: 'form',
    was: 'Reihung mit durchgehendem Bindewort — und … und … und.',
    leistung: 'Verlangsamt und wiegt jedes Glied einzeln. Das Gegenstück zum Asyndeton: nicht '
      + 'Tempo, sondern Gewicht.',
    kippt: 'Ohne Grund zur Langsamkeit wirkt es umständlich statt feierlich.',
    pruefFrage: 'Soll hier jedes einzelne Glied Gewicht bekommen?',
    traegt: Object.freeze(['essay', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project', 'web']),
    vorsicht: '',
  }),

  // --- Gedankenfiguren: nur semantisch erkennbar ---------------------------------------
  Object.freeze({
    id: 'rhetorische-frage',
    name: 'Rhetorische Frage',
    klasse: 'gedanke',
    mechanismus: 'abweichung',
    erkennung: 'sinn',
    was: 'Eine Frage, deren Antwort feststeht.',
    leistung: 'Der Leser produziert die Antwort selbst, und selbst Gefolgertes wird stärker '
      + 'angenommen als Vorgesagtes.',
    kippt: 'Steht die Antwort NICHT fest, gehört die Frage echt gestellt und beantwortet. Eine '
      + 'rhetorische Frage über eine offene Sache überspringt genau die Arbeit, um die es geht. '
      + 'Und mehrere hintereinander wirken wie eine Vernehmung.',
    pruefFrage: 'Steht die Antwort wirklich fest — für dein Publikum, nicht für dich?',
    traegt: Object.freeze(['essay', 'marketing', 'campaign']),
    aufgesetzt: Object.freeze(['scientific', 'project', 'web']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'ironie',
    name: 'Ironie',
    klasse: 'gedanke',
    mechanismus: 'abweichung',
    erkennung: 'sinn',
    was: 'Gemeint ist das Gegenteil des Gesagten.',
    leistung: 'Setzt geteiltes Wissen voraus und belohnt es mit Komplizenschaft: Wer sie '
      + 'versteht, gehört dazu.',
    kippt: 'Ohne gesicherten gemeinsamen Kontext wird Ironie wörtlich gelesen. In einem '
      + 'geschriebenen Text für unbekanntes Publikum ist sie das riskanteste Mittel überhaupt — '
      + 'sie hat keine Stimme und kein Gesicht, die sie retten.',
    pruefFrage: 'Weiß dein Publikum sicher genug, was du wirklich meinst?',
    traegt: Object.freeze(['essay', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project', 'web', 'marketing', 'campaign']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'hyperbel',
    name: 'Hyperbel',
    klasse: 'gedanke',
    mechanismus: 'abweichung',
    erkennung: 'sinn',
    was: 'Erkennbare Übertreibung — tausendmal gesagt.',
    leistung: 'Die erkennbare Unglaubwürdigkeit ist ihr Schutz: Wer tausendmal schreibt, lügt '
      + 'nicht, weil niemand zählt. Sie macht ein Ausmaß fühlbar, das eine Zahl nur benennt.',
    kippt: 'Genau dort, wo die Übertreibung nicht mehr als Übertreibung erkennbar ist. Dann ist '
      + 'sie keine Figur, sondern eine unbelegte Tatsachenbehauptung und gehört in die '
      + 'Faktenprüfung, nicht in die Sprachprüfung.',
    pruefFrage: 'Liest ein fremder Leser das als Übertreibung — oder als Angabe?',
    traegt: Object.freeze(['campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project', 'web']),
    vorsicht: 'Dauerwörter wie entscheidend, zentral, fundamental, tiefgreifend sind keine '
      + 'Hyperbel mehr, sondern Bedeutungsinflation — die dritte große Signatur maschinell '
      + 'geschriebener Texte.',
  }),
  Object.freeze({
    id: 'litotes',
    name: 'Litotes',
    klasse: 'gedanke',
    mechanismus: 'abweichung',
    erkennung: 'sinn',
    was: 'Bejahung durch verneintes Gegenteil — nicht eben wenig.',
    leistung: 'Kalibriert die Behauptungsstärke nach unten und wirkt dadurch souverän. Für '
      + 'Texte, deren Kapital Zurückhaltung ist, das passendste Mittel überhaupt.',
    kippt: 'Gehäuft wird sie zur Ausweichbewegung: Wer nie etwas behauptet, sondern immer nur '
      + 'das Gegenteil verneint, wirkt nicht vorsichtig, sondern unentschieden.',
    pruefFrage: 'Ist die Zurückhaltung sachlich begründet, oder weichst du aus?',
    traegt: Object.freeze(['scientific', 'essay', 'project']),
    aufgesetzt: Object.freeze(['campaign']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'concessio',
    name: 'Einräumung',
    klasse: 'gedanke',
    mechanismus: 'abweichung',
    erkennung: 'sinn',
    was: 'Ein Zugeständnis an die Gegenseite, bevor das eigene Argument kommt.',
    leistung: 'Sie zeigt, dass der Einwand gesehen wurde, und nimmt ihm damit die Kraft. In '
      + 'Texten, die geprüft werden, ist sie kein Schmuck, sondern Handwerk.',
    kippt: 'Ein Zugeständnis, das sofort wieder kassiert wird, ist keine Einräumung, sondern '
      + 'eine Geste. Und wo für die Auflösung kein Platz ist, bleibt nur der Einwand stehen.',
    pruefFrage: 'Ist das Zugeständnis echt — und löst du es danach wirklich auf?',
    traegt: Object.freeze(['scientific', 'essay', 'project', 'web']),
    aufgesetzt: Object.freeze(['campaign']),
    vorsicht: '',
  }),

  // --- Tropen: Übertragung, nur semantisch erkennbar -----------------------------------
  Object.freeze({
    id: 'metapher',
    name: 'Metapher',
    klasse: 'trope',
    mechanismus: 'uebertragung',
    erkennung: 'sinn',
    was: 'Übertragung nach Ähnlichkeit — der verkürzte Vergleich.',
    leistung: 'Sie liefert kein Bild, sondern ein ganzes Beziehungsgefüge, mit dem der Leser '
      + 'weiterdenkt. Eine früh gesetzte Leitmetapher lenkt, welche Lösungen überhaupt in den '
      + 'Sinn kommen — das ist eine inhaltliche Entscheidung, keine sprachliche.',
    kippt: 'Dreifach. Schief: Das Bild überträgt die falschen Beziehungen. Gemischt: Zwei '
      + 'frische Bilder kollidieren im Kopf. Tot: Beleuchten, Brücke schlagen, eintauchen sind '
      + 'keine Bilder mehr, sondern deren Rückstände — billig zu lesen und wirkungslos.',
    pruefFrage: 'Lässt sich das Bild wörtlich zu Ende denken, ohne dass es vorher bricht?',
    traegt: Object.freeze(['essay', 'web', 'marketing', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze([]),
    vorsicht: 'Landschaft, Geflecht, Reise, beleuchten, eintauchen: tote Leitmetaphern, die '
      + 'maschinell geschriebene Texte übernutzen. Diagnostizieren ja, vorschlagen nein.',
  }),
  Object.freeze({
    id: 'vergleich',
    name: 'Vergleich',
    klasse: 'trope',
    mechanismus: 'uebertragung',
    erkennung: 'sinn',
    was: 'Übertragung mit ausgesprochenem Vergleichswort — wie, gleich einem.',
    leistung: 'Die ehrliche Form der Übertragung: Sie sagt, DASS verglichen wird, und lässt '
      + 'sich deshalb bestreiten. Darum trägt sie auch dort, wo die Metapher zu viel behauptet.',
    kippt: 'Wenn das Gemeinsame nicht genannt wird, ist der Vergleich nur eine Behauptung mit '
      + 'einem Wie davor.',
    pruefFrage: 'Steht im Satz, worin die beiden sich gleichen?',
    traegt: Object.freeze(['scientific', 'essay', 'project', 'web', 'marketing', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze([]),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'metonymie',
    name: 'Metonymie',
    klasse: 'trope',
    mechanismus: 'uebertragung',
    erkennung: 'sinn',
    was: 'Ersetzung nach realer Beziehung — ein Glas trinken, Kafka lesen, Berlin entschied.',
    leistung: 'Kürzt eine bekannte Beziehung ab, ohne ein fremdes Bild einzuführen. Sparsam '
      + 'und unauffällig, solange die Beziehung wirklich bekannt ist.',
    kippt: 'Sie verdeckt den Handelnden. Berlin entschied nennt niemanden, der entschieden hat '
      + '— wo Zurechenbarkeit zählt, ist das eine Auslassung, keine Kürze.',
    pruefFrage: 'Wer genau ist gemeint, und muss es im Satz stehen?',
    traegt: Object.freeze(['essay', 'marketing', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'personifikation',
    name: 'Personifikation',
    klasse: 'trope',
    mechanismus: 'uebertragung',
    erkennung: 'sinn',
    was: 'Abstraktes handelt — die Inflation frisst Ersparnisse.',
    leistung: 'Macht aus einem Zustand ein Geschehen mit Richtung. Der Leser bekommt einen '
      + 'Handelnden, an dem er die Sache festmachen kann.',
    kippt: 'Der erfundene Handelnde verdrängt den echten. Wo eine Ursache benannt werden müsste, '
      + 'steht dann ein Akteur, den es nicht gibt — und die Kausalität bleibt ungeprüft.',
    pruefFrage: 'Wer handelt hier wirklich, und verdeckt das Bild ihn?',
    traegt: Object.freeze(['essay', 'marketing', 'campaign', 'prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project']),
    vorsicht: '',
  }),
  Object.freeze({
    id: 'euphemismus',
    name: 'Euphemismus',
    klasse: 'trope',
    mechanismus: 'uebertragung',
    erkennung: 'sinn',
    was: 'Beschönigende Umschreibung des Unangenehmen.',
    leistung: 'In der Figurenrede und im Umgang mit Betroffenen ist Schonung eine Leistung, '
      + 'keine Schwäche — sie hält eine Aussage sagbar.',
    kippt: 'Fast überall sonst. Ein Euphemismus verschiebt nicht den Ton, sondern die Sache: '
      + 'Wer Preisanpassung schreibt, hat nicht höflich formuliert, sondern die Erhöhung '
      + 'weggelassen. Das ist dann eine Wahrhaftigkeitsfrage, keine Stilfrage.',
    pruefFrage: 'Schont die Umschreibung den Leser — oder dich?',
    traegt: Object.freeze(['prosa', 'lyrik']),
    aufgesetzt: Object.freeze(['scientific', 'project', 'web']),
    vorsicht: '',
  }),
])

// Die vier Fehlerbilder aus der Mechanik. Sie sind keine Verbote, sondern Prüffragen: Das
// Urteil bleibt bei der Autorin oder dem Autor, der Agent liefert Mechanismus und Fundstelle.
export const FEHLERBILDER = Object.freeze([
  Object.freeze({
    id: 'schiefes-bild',
    name: 'Schiefes Bild',
    diagnose: 'Das Bild überträgt die falschen Beziehungen — das Rückgrat des Projekts ist ins '
      + 'Rollen gekommen.',
    pruefFrage: 'Lässt sich das Bild wörtlich zu Ende denken, ohne dass es vorher bricht?',
  }),
  Object.freeze({
    id: 'gemischtes-bild',
    name: 'Gemischtes Bild',
    diagnose: 'Zwei Bilder kollidieren in einer Vorstellung. Nur ein Befund, wenn BEIDE frisch '
      + 'genug sind, um Vorstellung zu erzwingen — tote Wendungen dürfen sich mischen, das tut '
      + 'Alltagssprache ständig.',
    pruefFrage: 'Sind beide Bilder noch lebendig genug, dass sie im Kopf aufeinandertreffen?',
  }),
  Object.freeze({
    id: 'leere-symmetrie',
    name: 'Leere Symmetrie',
    diagnose: 'Die Form behauptet eine Ordnung, die der Inhalt nicht einlöst: Gleichform über '
      + 'Ungleichrangiges, Dreierreihe mit Füllglied, Schein-Antithese ohne echten Gegner.',
    pruefFrage: 'Trägt jedes Glied eigenes Gewicht, und hat die verneinte Position einen '
      + 'echten Vertreter?',
  }),
  Object.freeze({
    id: 'manier',
    name: 'Manier und geliehene Wirkung',
    diagnose: 'Häufung entwertet die Abweichung — die vierte Alliteration, die dritte '
      + 'rhetorische Frage. Und wo Klang oder Pathos Überzeugungsarbeit leisten, die der Inhalt '
      + 'nicht deckt, ist die Wirkung geliehen. Beides sind Verhältnisdiagnosen: Sie brauchen '
      + 'den Textzusammenhang, nie die Einzelstelle.',
    pruefFrage: 'Wie oft trägt dieselbe Passage dasselbe Mittel, und deckt der Inhalt die '
      + 'Wirkung, die die Form erzeugt?',
  }),
])

const NACH_ID = new Map(STILMITTEL.map(mittel => [mittel.id, mittel]))

// Nachschlagen über hasOwnProperty statt direkt: sonst liefert der Zugriff auf 'constructor'
// oder 'toString' eine geerbte Funktion statt undefined, und aus der Fail-closed-Regel würde
// ein Absturz. Gleiche Vorsicht wie in textart-regeln.mjs.
function eigenerWert(tabelle, schluessel) {
  const name = String(schluessel ?? '').trim()
  if (!name) return null
  return Object.prototype.hasOwnProperty.call(tabelle, name) ? tabelle[name] : null
}

function saubererName(wert) {
  return String(wert ?? '').trim()
}

export function stilmittel(id) {
  const name = saubererName(id)
  return name && NACH_ID.has(name) ? NACH_ID.get(name) : null
}

export function textartName(textart) {
  const name = saubererName(textart)
  return eigenerWert(TEXTART_NAME, name) || name
}

function bekannteTextart(textart) {
  const name = saubererName(textart)
  return STILMITTEL_TEXTARTEN.includes(name) ? name : ''
}

// Das Urteil in drei Werten. 'offen' ist kein Ausweichen, sondern eine eigene Aussage:
// erlaubt, aber nichts, wozu man rät. Unbekanntes Mittel und unbekannte oder fehlende
// Textart ergeben immer 'offen' — fail-closed, denn nur 'traegt' berechtigt zum Vorschlag.
export function stilmittelUrteil(id, textart) {
  const mittel = stilmittel(id)
  const art = bekannteTextart(textart)
  if (!mittel || !art) return 'offen'
  if (mittel.traegt.includes(art)) return 'traegt'
  if (mittel.aufgesetzt.includes(art)) return 'aufgesetzt'
  return 'offen'
}

// Die einzige Frage, die vor einem Vorschlag zählt. Bewusst eng: Wer keine Textart
// angegeben hat, bekommt keinen Stilmittelvorschlag, sondern höchstens eine Diagnose
// dessen, was schon dasteht.
export function darfVorgeschlagenWerden(id, textart) {
  return stilmittelUrteil(id, textart) === 'traegt'
}

export function tragendeStilmittel(textart) {
  return STILMITTEL.filter(mittel => stilmittelUrteil(mittel.id, textart) === 'traegt')
}

export function aufgesetzteStilmittel(textart) {
  return STILMITTEL.filter(mittel => stilmittelUrteil(mittel.id, textart) === 'aufgesetzt')
}

// Die Mittel, die ein Sprachmodell von sich aus überstrapaziert. Sie sind nicht falsch —
// sie sind entwertet: Ihre Häufung ist zur Signatur geworden. Diagnostizieren ist erlaubt,
// selbst vorschlagen nur mit einem Grund, der an dieser Stelle liegt.
export function vorsichtsListe() {
  return STILMITTEL.filter(mittel => Boolean(mittel.vorsicht))
}

// Die Zeile für genau eine Textart — die Form, in der die Tabelle in den Prompt geht.
export function stilmittelFuerTextart(textart) {
  const art = bekannteTextart(textart)
  return {
    textart: art,
    name: art ? textartName(art) : '',
    traegt: tragendeStilmittel(art).map(mittel => mittel.name),
    aufgesetzt: aufgesetzteStilmittel(art).map(mittel => mittel.name),
  }
}

// Die Tabelle als Daten, für Oberfläche und Dokumentation — damit die Begründung an genau
// einer Stelle steht und nicht im Text daneben noch einmal. Läuft über STILMITTEL_TEXTARTEN,
// nicht über die eigenen Schlüssel: Eine im Sprachprofil neu hinzugekommene Textart taucht
// dadurch sofort auf, mit leeren Listen, statt still zu fehlen.
export function stilmittelTabelle() {
  return STILMITTEL.map(mittel => ({
    id: mittel.id,
    name: mittel.name,
    klasse: mittel.klasse,
    klasseName: KLASSE_NAME[mittel.klasse],
    mechanismus: mittel.mechanismus,
    erkennung: mittel.erkennung,
    was: mittel.was,
    leistung: mittel.leistung,
    kippt: mittel.kippt,
    pruefFrage: mittel.pruefFrage,
    traegt: [...mittel.traegt],
    aufgesetzt: [...mittel.aufgesetzt],
    vorsicht: mittel.vorsicht,
  }))
}

export function textartTabelleStilmittel() {
  return STILMITTEL_TEXTARTEN.map(textart => stilmittelFuerTextart(textart))
}
