/* Onda · Anmerkungsarten. Vier Kategorien bestimmen Markierung + Symbol; jede Art gehört genau einer. */
export const CATEGORIES={
  korrektur:{label:'Korrektur',icon:'type'},
  stil:{label:'Stil',icon:'sparkle'},
  struktur:{label:'Struktur',icon:'arrow-up-down'},
  inhalt:{label:'Inhalt',icon:'quote'},
  notiz:{label:'Notiz',icon:'list'}
};
export const KINDS={
  /* Korrektur — objektiv falsch, ein Klick genügt */
  rechtschreibung:{label:'Rechtschreibung',cat:'korrektur'},
  grammatik:{label:'Grammatik',cat:'korrektur'},
  zeichensetzung:{label:'Zeichensetzung',cat:'korrektur'},
  /* Stil — Formulierung, Vorschlag zur Wahl */
  wortwahl:{label:'Wortwahl',cat:'stil'},
  satzstil:{label:'Satzstil',cat:'stil'},
  absatzstil:{label:'Absatzstil',cat:'stil'},
  straffen:{label:'Straffen',cat:'stil'},
  wiederholung:{label:'Wiederholung',cat:'stil'},
  ton:{label:'Ton & Register',cat:'stil'},
  stilmittel:{label:'Stilmittel',cat:'stil'},
  anglizismus:{label:'Anglizismus',cat:'stil'},
  terminologie:{label:'Terminologie',cat:'stil'},
  /* Struktur — Aufbau und Bewegung im Text */
  verschieben:{label:'Verschieben',cat:'struktur'},
  uebergang:{label:'Übergang',cat:'struktur'},
  gliederung:{label:'Gliederung',cat:'struktur'},
  fluss:{label:'Textfluss',cat:'struktur'},
  faden:{label:'Roter Faden',cat:'struktur'},
  ueberschrift:{label:'Überschrift',cat:'struktur'},
  /* Inhalt — Substanz und Belege */
  anmerkung:{label:'Anmerkung',cat:'inhalt'},
  beleg:{label:'Beleg fehlt',cat:'inhalt'},
  faktencheck:{label:'Faktencheck',cat:'inhalt'},
  widerspruch:{label:'Widerspruch',cat:'inhalt'},
  luecke:{label:'Gegenargument fehlt',cat:'inhalt'},
  verstaendlichkeit:{label:'Verständlichkeit',cat:'inhalt'},
  /* Notizmodus — lose Gedanken, Stichworte, Pfeile. Hier wird NICHT korrigiert. */
  ausformulieren:{label:'Ausformulieren',cat:'notiz'},
  buendeln:{label:'Gehört zusammen',cat:'notiz'},
  nachfrage:{label:'Nachfrage',cat:'notiz'},
  ordnen:{label:'Reihenfolge',cat:'notiz'},
  aufgreifen:{label:'Offener Faden',cat:'notiz'}
};
/* Rangfolge: was gemacht werden MUSS, was den Text besser macht, was Geschmack ist. */
export const PRIORITY={muss:'Fehler',sollte:'Empfehlung',geschmack:'Geschmack'};
export const PRIORITY_OF={
  rechtschreibung:'muss',grammatik:'muss',zeichensetzung:'muss',
  beleg:'muss',faktencheck:'muss',widerspruch:'muss',
  satzstil:'sollte',straffen:'sollte',fluss:'sollte',uebergang:'sollte',gliederung:'sollte',
  faden:'sollte',verstaendlichkeit:'sollte',luecke:'sollte',terminologie:'sollte',verschieben:'sollte',
  wortwahl:'geschmack',absatzstil:'geschmack',wiederholung:'geschmack',ton:'geschmack',
  stilmittel:'geschmack',anglizismus:'geschmack',ueberschrift:'geschmack',anmerkung:'geschmack',
  ausformulieren:'sollte',buendeln:'sollte',nachfrage:'sollte',ordnen:'sollte',aufgreifen:'geschmack'
};
export const SCOPES=['Wort','Satz','Absatz','Abschnitt','Text'];
export function kindInfo(kind){
  const k=KINDS[kind]||KINDS.anmerkung;
  const c=CATEGORIES[k.cat];
  return {label:k.label,cat:k.cat,catLabel:c.label,icon:c.icon};
}
