import * as React from 'react';
/** Einfügemarke im Text: ein schmaler Karet an der Stelle, an der etwas hinzukommt. Ist sie geöffnet, erscheint der Vorschlag **im Textfluss** — er öffnet eine Lücke an genau dieser Stelle und verdeckt keinen Text. Für Anmerkungen, die etwas hinzufügen: Übergangssatz, Stilmittel, Erklärung eines Fachbegriffs. */
export interface InsertionProps {
  /** Der Text, der eingefügt werden soll; ohne `text` bleibt nur die Marke */
  text?: React.ReactNode;
  /** Kopfzeile des Vorschlags @default 'Einfügen' */
  label?: string;
  /** @default 'Einfügen' */
  acceptLabel?: string;
  /** Vorschlag ausgeklappt @default false */
  open?: boolean;
  onAccept?: () => void;
  onDismiss?: () => void;
  /** Klick auf die Marke */
  onClick?: () => void;
}
export declare function Insertion(props: InsertionProps): JSX.Element;
