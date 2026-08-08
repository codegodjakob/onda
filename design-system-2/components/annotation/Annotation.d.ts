import * as React from 'react';
/** Anmerkung des Agenten am Textrand. Kopfzeile = Art + Ziffer + Bezug; darunter der Hinweis, optional ein Vorschlag (vorher/nachher), ein Verschiebeziel, oder ein Beleg (Link + Ausschnitt); Fuß = Aktionsform. Vier Kategorien (Korrektur, Stil, Struktur, Inhalt) tragen Symbol und Markierungsart — kein Farbcode. */
export interface AnnotationProps {
  /** Anmerkungsart aus `kinds.js` — z. B. 'rechtschreibung', 'grammatik', 'zeichensetzung', 'wortwahl', 'satzstil', 'absatzstil', 'straffen', 'wiederholung', 'ton', 'stilmittel', 'anglizismus', 'terminologie', 'verschieben', 'uebergang', 'gliederung', 'fluss', 'faden', 'ueberschrift', 'anmerkung', 'beleg', 'faktencheck', 'widerspruch', 'luecke', 'verstaendlichkeit' @default 'anmerkung' */
  kind?: string;
  /** Bezug: 'Wort' | 'Satz' | 'Absatz' | 'Abschnitt' | 'Text' */
  scope?: string;
  /** Ziffer, die die Markierung im Text trägt */
  n?: number;
  /** Anzahl betroffener Stellen, z. B. 4 bei einer Wortwiederholung */
  count?: number;
  /** Rangfolge — wird sonst aus der Art abgeleitet (`PRIORITY_OF` in kinds.js): 'muss' (Fehler) | 'sollte' (Empfehlung) | 'geschmack' */
  priority?: 'muss' | 'sollte' | 'geschmack';
  /** Die Regel dahinter — erscheint erst nach Klick auf ‚Warum?‘ */
  why?: React.ReactNode;
  /** Anmerkung, die dieser Vorschlag ausschließt, z. B. ‚Vorschlag 7 (Straffen)‘ */
  conflict?: string;
  /** Ersetzungsvorschlag — durchgestrichenes Vorher, vorgeschlagenes Nachher */
  suggestion?: { from?: string; to?: string };
  /** Verschiebeziel, z. B. { to: 'nach Absatz 3' } */
  move?: { to: string };
  /** Beleg: Link, Ausschnitt und Herkunft (`meta`, z. B. ‚Peer-reviewed · 2009 · zuletzt geprüft heute‘) */
  source?: { title?: string; url?: string; excerpt?: string; meta?: string };
  /** Gegenüberstellung zweier Textstellen — für Widersprüche: [{ref:'Absatz 2',text:'23 Minuten'}, …] */
  compare?: Array<{ ref: string; text: string }>;
  /** Angewählt — hebt Ziffer und Schatten hervor @default false */
  active?: boolean;
  /** Ruhezustand am Textrand: nur Kopfzeile + eine Zeile Hinweis; Vorschlag, Beleg und Aktionen erscheinen erst ausgeklappt @default false */
  collapsed?: boolean;
  /** Überschreibt die Beschriftung der Hauptaktion */
  acceptLabel?: string;
  onAccept?: () => void;
  /** Dritte, leise Aktion — z. B. ‚Andere Quelle suchen‘ */
  onSecondary?: () => void;
  /** @default 'Andere Quelle' */
  secondaryLabel?: string;
  /** Zeigt die Sekundäraktion (Verwerfen bzw. Verstanden) */
  onDismiss?: () => void;
  /** Macht die ganze Karte klickbar (Auswahl) */
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}
export declare function Annotation(props: AnnotationProps): JSX.Element;
