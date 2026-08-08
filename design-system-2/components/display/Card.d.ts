import * as React from 'react';
/**
 * Ruhige Inhaltsfläche: weiß auf Papier, Haarlinie, 8px-Radius. Kein Dekor.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Rechts im Kopf, z. B. IconButton */
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Hover-Haarlinie + Schatten, für klickbare Karten */
  interactive?: boolean;
}
export declare function Card(props: CardProps): JSX.Element;
