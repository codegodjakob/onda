import * as React from 'react';
/** Mehrfachauswahl mit optionaler Beschreibungszeile. */
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Zweite, tertiäre Zeile unter dem Label */
  description?: string;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
