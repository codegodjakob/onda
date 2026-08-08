import * as React from 'react';
/** Modaler Dialog: Scrim + Blur, Fläche steigt 8px auf. Für Entscheidungen — nie für bloße Bestätigungen (dafür Toast). */
export interface DialogProps {
  open: boolean;
  /** Escape, Scrim-Klick und × rufen dies auf */
  onClose?: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Aktionen rechtsbündig; primäre Aktion zuletzt */
  footer?: React.ReactNode;
  /** max-width in px */
  width?: number;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
