import * as React from 'react';
/** Einzeiliges Textfeld mit Label, Hint und Fehlerzustand. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Hilfszeile unter dem Feld */
  hint?: string;
  /** Fehlertext — färbt Rand und ersetzt hint */
  error?: string;
}
export declare function Input(props: InputProps): JSX.Element;
