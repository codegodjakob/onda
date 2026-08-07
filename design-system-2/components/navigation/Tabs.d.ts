import * as React from 'react';
/** Ansichtswechsel innerhalb einer Fläche. 'underline' für Seitenebenen, 'segmented' für kompakte Umschalter. */
export interface TabItem { id: string; label: React.ReactNode; count?: number }
export interface TabsProps {
  items: TabItem[];
  /** id des aktiven Tabs */
  active: string;
  onChange?: (id: string) => void;
  variant?: 'underline' | 'segmented';
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
