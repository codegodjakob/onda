import * as React from 'react';
/** Vorschlagskarte am Textrand: Kopfzeile mit Art und optionaler Kennzahl, kurzer Hinweis, darunter die vorgeschlagene Fassung auf getönter Fläche. Für alles, was **mehr als ein Wort** ist — Umschreibungen (Satzstil, Absatzstil, Straffen, Textfluss) und Einfügungen (Übergang, Stilmittel, Erklärung). Die betroffene Stelle bleibt links im Text markiert; nur kurze Wortkorrekturen (`Correction`) stehen direkt am Wort. */
export interface RewriteProps {
  /** Kopfzeile, z. B. 'Umschreiben' | 'Einfügen' @default 'Umschreiben' */
  label?: string;
  /** Die vorgeschlagene Fassung */
  to?: React.ReactNode;
  /** Kennzahl rechts in der Kopfzeile, z. B. „24 → 12 Wörter" */
  meta?: string;
  /** @default 'Übernehmen' */
  acceptLabel?: string;
  /** @default 'Original behalten' */
  dismissLabel?: string;
  onAccept?: () => void;
  onDismiss?: () => void;
  /** Kurze Begründung über dem Vorschlag */
  children?: React.ReactNode;
}
export declare function Rewrite(props: RewriteProps): JSX.Element;
