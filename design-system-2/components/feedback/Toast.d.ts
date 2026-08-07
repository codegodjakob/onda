import * as React from 'react';
/** Kurzmeldung unten rechts: Titel in 1–3 Wörtern, verschwindet von selbst. Positionierung übernimmt die App. */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Eine optionale Textaktion, z. B. „Rückgängig" */
  actionLabel?: string;
  onAction?: () => void;
  /** Zeigt das ×er */
  onDismiss?: () => void;
}
export declare function Toast(props: ToastProps): JSX.Element;
