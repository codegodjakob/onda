import * as React from 'react';
/** Natives Select im Feld-Look, mit Chevron. Für 4+ Optionen; darunter Radio verwenden. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Kurzform statt <option>-Kindern: Strings oder {value,label} */
  options?: Array<string | { value: string; label: string }>;
}
export declare function Select(props: SelectProps): JSX.Element;
