import * as React from 'react';
/** Kleiner Statusmarker (Tint-Fläche + getönter Text). Ein Wort, Sentence case. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  /** Statuspunkt vor dem Text */
  dot?: boolean;
}
export declare function Badge(props: BadgeProps): JSX.Element;
