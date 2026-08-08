import * as React from 'react';
/** Kanonisches Icon-Set des Systems — Lucide-Pfade im 24er-Raster, Strichstärke 1.75, erbt `currentColor`. Nie eigene Glyphen zeichnen: fehlt ein Symbol, wird der Pfad in `Icon.jsx` ergänzt. */
export type IconName =
  | 'file-text' | 'folder' | 'archive' | 'users' | 'plus' | 'search' | 'share' | 'send'
  | 'paperclip' | 'link' | 'type' | 'scissors' | 'arrow-up-down' | 'list' | 'help-circle'
  | 'square' | 'check' | 'x' | 'sun' | 'moon' | 'more-horizontal'
  | 'chevron-left' | 'chevron-right' | 'clock' | 'sparkle' | 'book-open' | 'settings'
  | 'history' | 'quote';
export interface IconProps {
  /** Symbolname aus dem Set */
  name: IconName;
  /** Kantenlänge in px @default 16 */
  size?: number;
  /** @default 1.75 */
  strokeWidth?: number;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
/** Alle verfügbaren Namen — z. B. für Specimen-Karten */
export declare const iconNames: IconName[];
