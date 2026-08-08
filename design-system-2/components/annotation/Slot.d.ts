import * as React from 'react';
/** Gestrichelter Zielplatz im Text: zeigt, WOHIN etwas kommt — der verschobene Satz als Geistertext am neuen Ort, der Ursprung bleibt gedimmt sichtbar. Auch für „Zwischentitel hier einsetzen". */
export interface SlotProps {
  /** Kopfzeile @default 'Hierher verschieben' */
  label?: string;
  /** Vorschau des Inhalts, der hier landet */
  text?: React.ReactNode;
  onAccept?: () => void;
  onDismiss?: () => void;
}
export declare function Slot(props: SlotProps): JSX.Element;
/** Bereichsmarkierung: tönt einen ganzen Absatz oder Abschnitt und trägt oben rechts eine Kennzeichnung. Für Anmerkungen, die sich auf viele Stellen gleichzeitig beziehen — Ton & Register, Wiederholungen, Abschnittsfeedback. */
export interface RegionProps {
  /** Kurzer Aufkleber, z. B. „Ton wechselt" */
  tag?: React.ReactNode;
  children?: React.ReactNode;
}
export declare function Region(props: RegionProps): JSX.Element;
