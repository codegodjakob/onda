import * as React from 'react';
/** Benennt Icon-Aktionen beim Hover (300ms Verzögerung). Nie für essenzielle Information. */
export interface TooltipProps {
  label: string;
  /** Shortcut-Anzeige rechts, z. B. "⌘K" */
  shortcut?: string;
  side?: 'top' | 'bottom';
  children: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
