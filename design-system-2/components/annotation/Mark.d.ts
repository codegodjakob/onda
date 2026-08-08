import * as React from 'react';
/** Markierung im Fließtext, an der eine Anmerkung hängt. Die Kategorie der Art bestimmt die Zeichnung — ohne Farbcode: Korrektur mit Haarlinien-Rahmen, Stil auf neutraler Fläche, Struktur als leicht angehobener Block (die Passage lässt sich bewegen), Inhalt auf Akzentfläche. Aktiv (angewählte Anmerkung) tönt sich im Akzent. */
export interface MarkProps {
  /** Anmerkungsart, z. B. 'rechtschreibung' | 'wortwahl' | 'verschieben' | 'beleg' (siehe kinds.js) @default 'anmerkung' */
  kind?: string;
  /** Ziffer der zugehörigen Anmerkung am Rand */
  n?: number;
  /** Zeigt die Markierung als angewählt @default false */
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}
export declare function Mark(props: MarkProps): JSX.Element;
