import * as React from 'react';
/** Einfachauswahl in einer Gruppe — gleiches `name` pro Gruppe. Für 2–3 sichtbare Optionen. */
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export declare function Radio(props: RadioProps): JSX.Element;
