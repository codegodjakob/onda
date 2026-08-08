import * as React from 'react';
/** Personenkreis mit Initialen oder Bild. Der einzige runde Container neben Dot und Aura-Orb. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Voller Name — Initialen werden abgeleitet */
  name: string;
  src?: string;
  /** 24 / 32 / 40 px */
  size?: 'sm' | 'md' | 'lg';
  /** Gedeckte Tönung aus dem Namen (für Kollaborations-Listen) */
  tinted?: boolean;
  /** Grüner Statuspunkt */
  online?: boolean;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
