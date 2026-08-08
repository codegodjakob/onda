import * as React from 'react';
/** Sprechblase der Agent-Konversation. Agent mit avatar: Orb-Sitz und Blasenkörper sind EINE durchgehende SVG-Kontur — der Sitzkreis liegt mit Abstand zur Kante, zwei exakt tangentiale konkave Fillets führen in den Blasenkörper; Fläche, Haarlinie und Schatten folgen einer Form. Der Pfad wird zur gemessenen Blasengröße generiert (ResizeObserver). User: schlichte neutrale Fläche mit Haarlinie, rechts (Akzent bleibt Aktionen vorbehalten). Optional: name/meta, eingebettete Karte (card), Aktionsleiste (actions). Max. zwei Schriftgrößen + zwei Textfarben pro Blase. */
export interface BubbleProps {
  /** Sprecher — bestimmt Seite + Fläche. @default 'agent' */
  from?: 'agent' | 'user';
  /** Sitz des Orbs: 'left' — Orb links oben, Blase wächst nach rechts; 'top' — dieselbe Kontur um 90° gedreht, Orb sitzt oben rechts und die Blase wächst nach unten. @default 'left' */
  seat?: 'left' | 'top';
  /** Name in der Kopfzeile */
  name?: string;
  /** Meta rechts vom Namen, z. B. Zeitstempel */
  meta?: string;
  /** Orb/Avatar (36px empfohlen) — beim Agenten sitzt er im organischen Sitz der Blasenkontur, z. B. <Aura size={36}/> */
  avatar?: React.ReactNode;
  /** Eingebettete Vorschau-Karte (E-Mail, Dokument …) */
  card?: React.ReactNode;
  /** Aktionen unter dem Inhalt, z. B. Verwerfen/Senden-Buttons */
  actions?: React.ReactNode;
  /** Denk-Zustand: statt Inhalt drei ruhig wandernde Platzhalterzeilen (Orb dazu auf state="thinking") @default false */
  thinking?: boolean;
  children?: React.ReactNode;
  className?: string;
}
export declare function Bubble(props: BubbleProps): JSX.Element;
