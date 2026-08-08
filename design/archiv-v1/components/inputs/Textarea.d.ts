import * as React from 'react';
/** Mehrzeiliges Textfeld — Kernbaustein des Schreibwerkzeugs. Vertikal resizable. */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
}
export declare function Textarea(props: TextareaProps): JSX.Element;
