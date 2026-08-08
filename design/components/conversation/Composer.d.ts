import * as React from 'react';
/** Eingabeleiste der Konversation — Signatur-Pill, die beim Mehrzeiler ruhig auf `--radius-panel` aufgeht. Enter sendet, Shift+Enter bricht um; Auto-Grow bis 160px. Während der Agent antwortet (`busy`) wird der Senden- zum Stopp-Knopf. */
export interface ComposerProps {
  /** Gesteuerter Wert; weglassen für ungesteuerten Betrieb */
  value?: string;
  /** Startwert im ungesteuerten Betrieb @default '' */
  defaultValue?: string;
  /** Bei jeder Eingabe, bekommt den Text */
  onChange?: (value: string) => void;
  /** Enter oder Senden-Knopf — bekommt den getrimmten Text; leert das Feld im ungesteuerten Betrieb */
  onSubmit?: (value: string) => void;
  /** Klick auf Stopp, wenn `busy` */
  onStop?: () => void;
  /** @default 'Schreib eine Anweisung …' */
  placeholder?: string;
  /** Knöpfe links im Feld, z. B. <IconButton> für Anhang */
  leading?: React.ReactNode;
  /** Zeile unter der Leiste, z. B. „Enter senden · Shift+Enter neue Zeile" */
  hint?: string;
  /** Zeigt einen Zähler; über der Grenze wird gesperrt */
  maxLength?: number;
  /** Agent antwortet — Senden wird zu Stopp @default false */
  busy?: boolean;
  /** @default false */
  disabled?: boolean;
  /** Startzeilen @default 1 */
  rows?: number;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Composer(props: ComposerProps): JSX.Element;
