import * as React from 'react';
/** Neutraler Metadaten-Chip (Themen, Filter), optional entfernbar. Kein Statusersatz — dafür Badge. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Zeigt das ×; wird beim Klick aufgerufen */
  onRemove?: () => void;
}
export declare function Tag(props: TagProps): JSX.Element;
