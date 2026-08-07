import * as React from 'react';
/**
 * Die Präsenz des KI-Agenten — der einzige Ort für Verlauf, Glow und Spring-Motion. Genau eine pro Ansicht.
 */
export interface AuraProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Durchmesser in px */
  size?: number;
  /** idle: langsames Atmen · thinking: Verlauf rotiert, Atmung schneller · quiet: statisch, ohne Glow */
  state?: 'idle' | 'thinking' | 'quiet';
  /** aria-label */
  label?: string;
}
export declare function Aura(props: AuraProps): JSX.Element;
