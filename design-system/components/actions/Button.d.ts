import * as React from 'react';
/**
 * Löst die Aktion aus, die ihr Label benennt. Eine primäre Aktion pro Ansicht.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 'primary' einmal pro Ansicht; 'secondary' Standard-Flächenaktion; 'ghost' Toolbars/inline; 'danger' destruktiv. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** 15–16px Icon vor dem Label */
  icon?: React.ReactNode;
  /** Ersetzt das Icon durch einen Spinner und deaktiviert den Button */
  loading?: boolean;
}
export declare function Button(props: ButtonProps): JSX.Element;
