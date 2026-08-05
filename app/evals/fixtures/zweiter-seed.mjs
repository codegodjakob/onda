// Der zweite Seed-Text (Issue #17, Auftrag 3): ein FREMDER, unordentlicher Text,
// damit nicht jede Messung am einen Beispieltext „Calm Technology" hängt.
//
// Bewusst anders in allem, was den ersten Seed ausmacht:
// - Genre: Interview-Transkript statt ruhigem Essay — gesprochene Sprache,
//   Sprecherwechsel, Zeitmarken, Einwürfe, abgebrochene Sätze.
// - Sprache: Deutsch mit englischen Einsprengseln (der Gast zitiert auf Englisch).
// - Länge: deutlich länger und unregelmäßiger als der Essay.
// - Zustand: unordentlich wie ein echter Web-Fund — gemischte Anführungszeichen,
//   doppelte Leerzeichen, Tabs, und die drei unsichtbaren Klassiker aus
//   Copy-Paste: geschütztes Leerzeichen (U+00A0), weicher Trennstrich (U+00AD),
//   Nullbreite-Leerzeichen (U+200B). Die unsichtbaren Zeichen stehen im Code als
//   Escape-Sequenzen, damit sie kein Editor stillschweigend „repariert".
//
// Wer eine Prüfung oder Eval gegen fremdes Material braucht, nimmt diesen Text —
// und erweitert ihn lieber, als einen dritten Seed anzulegen.

export const ZWEITER_SEED_TITEL = 'Transkript: Vom Brotbacken und vom Warten'
export const ZWEITER_SEED_GENRE = 'Interview-Transkript'

export const ZWEITER_SEED_TEXT = [
  '[00:00:07] MODERATORIN: Herzlich willkommen zu „Handwerk hörbar". Heute zu Gast: ein Bäcker, der seit dreißig Jahren ohne Hefe arbeitet. Schön, dass Sie da sind.',
  '',
  '[00:00:19] GAST:  Danke, gern. Obwohl — ganz ohne Hefe stimmt ja nicht, die wilde Hefe ist ja immer da, die sitzt in der Sauerteig\u200Bkultur. Man kauft sie nur nicht.',
  '',
  '[00:00:41] MODERATORIN: Sie sagen in Ihrem Buch, ich zitiere: "Der Teig hat keine Uhr, der Teig hat einen Zustand." Was heißt das praktisch?',
  '',
  '[00:01:02] GAST: Das heißt, dass alle Rezepte lügen [Lachen]. Nein, im Ernst — ein Rezept sagt: 450\u00A0g Weizenmehl, 250\u00A0g Roggen\u00ADmehl, vier Stunden Stockgare bei 24\u00A0Grad. Aber meine Küche hat im Winter 19 Grad, und dann sind vier Stunden gar nichts, dann fängt der Teig gerade erst an zu leben. Mein Lehrmeister in Lyon hat immer gesagt, auf Englisch übrigens, der war Waliser: "you know, the dough tells you when it\'s ready — your watch doesn\'t."   Und das ist der ganze Beruf, eigentlich. Warten können. Nicht auf die Uhr schauen, sondern auf die Blasen am Rand, auf den Glanz, auf diesen leicht säuerlichen Geruch, der von einem Tag auf den anderen kippen kann, und wenn er kippt, dann ist die ganze Charge hin, das muss man einmal erlebt haben, danach vergisst man das Riechen nie wieder.',
  '',
  '[00:02:31] MODERATORIN: Das klingt fast wie Erziehung –\u00A0man wartet, man beobachtet, man greift möglichst spät ein.',
  '',
  '[00:02:44] GAST: (unverständlich) … genau falsch herum! Alle denken, der Bäcker macht das Brot. Der Bäcker macht gar nichts, der Bäcker verhindert höchstens Unfälle. Das Brot 🍞 macht sich selbst, wenn man es lässt. Deshalb sage ich immer: ‚Ein guter Bäcker ist ein fauler Bäcker.‘ Meine Gesellen hassen den Satz.',
  '',
  '[00:03:12] MODERATORIN: In der Sendung fragen wir am Ende immer nach einem Fehler, aus dem Sie am meisten gelernt haben.',
  '',
  '[00:03:20] GAST: Oh, da gibt es viele. Der teuerste war 2011, da habe ich einer Kette vertraut, die wollte mein "Konzept skalieren" — furchtbares Wort. Wir haben die Gare an Maschinen übergeben, Sensoren, alles automatisch. Das Brot war\ttechnisch fehlerfrei und hat nach nichts geschmeckt. Nach gar nichts. Ich habe ein Jahr gebraucht, um zu verstehen, warum: Die Maschine hat auf Zahlen gewartet, nicht auf den Teig. Seitdem steht bei uns in der Backstube ein Schild: „Der Teig hat keine Uhr." Und darunter hat irgendwer, ich glaube der Jüngste, dazugeschrieben: "but he has a deadline" [Lachen] … Ja. Beides stimmt halt.',
].join('\n')

// Die Absätze einzeln, für Prüfungen, die blockweise arbeiten
// (Momente-Filter, Zwei-Fenster-Test, künftige Struktur-Evals).
export const ZWEITER_SEED_ABSAETZE = ZWEITER_SEED_TEXT.split('\n').filter(zeile => zeile.trim())
