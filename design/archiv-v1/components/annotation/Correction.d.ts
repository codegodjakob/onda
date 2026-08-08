import * as React from 'react';
/** Korrektur direkt am Wort: die markierte Stelle mit einer kleinen Blase darunter, die „alt → neu" zeigt und in einem Klick übernommen wird. Für die Kategorie **Korrektur** (Rechtschreibung, Grammatik, Zeichensetzung) — objektiv falsch, kurz, keine Begründung nötig. Längere Hinweise (Stil, Struktur, Inhalt) gehören als `Annotation` an den Textrand. */
export interface CorrectionProps {
  /** Art aus `kinds.js` — bestimmt die Zeichnung der Markierung @default 'rechtschreibung' */
  kind?: string;
  /** Die korrigierte Fassung; `children` erscheint daneben durchgestrichen */
  to?: string;
  /** Kurzer Zusatz statt oder neben dem Vorschlag, z. B. „Komma fehlt" */
  note?: string;
  /** Ausrichtung der Blase an der Markierung @default 'left' */
  align?: 'left' | 'right';
  /** Blase sichtbar @default false */
  open?: boolean;
  onAccept?: () => void;
  onDismiss?: () => void;
  /** Klick auf die Markierung */
  onClick?: () => void;
  /** Die fehlerhafte Textstelle */
  children?: React.ReactNode;
}
export declare function Correction(props: CorrectionProps): JSX.Element;
