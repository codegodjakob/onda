import * as React from 'react';
/** Quadratischer Button für eine einzelne Icon-Aktion; `label` ist Pflicht (aria-label + Tooltip). */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Pflicht: benennt die Aktion für Screenreader und title-Tooltip */
  label: string;
  variant?: 'ghost' | 'secondary';
  /** 28 / 32 / 36 px */
  size?: 'sm' | 'md' | 'lg';
  /** Das Icon (16–18px Stroke-Icon) */
  children?: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
