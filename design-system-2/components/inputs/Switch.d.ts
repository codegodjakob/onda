import * as React from 'react';
/** Sofort wirksames An/Aus (Einstellungen). Nicht für Auswahl in Formularen — dafür Checkbox. */
export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export declare function Switch(props: SwitchProps): JSX.Element;
