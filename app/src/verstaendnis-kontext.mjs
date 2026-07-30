// Reiner Kontext-Bauer für den Task 'verstaendnis' — PUR, node-testbar, kein DOM.
//
// Hintergrund (Fix-Runde 1, Finding 1, Critical): workspace.js kannte lange Zeit ein
// Kontext-Objekt mit den Feldnamen {modus, verstaendnis, geschuetzt, docText, nutzerText,
// interviewVerlauf} — aber baueAnfrage (agent-tasks.mjs, G-2) konsumiert ausschließlich
// {verstaendnis, docText, volatiles, verlauf, anfrage}. modus/nutzerText/interviewVerlauf/
// geschuetzt wurden von baueAnfrage stillschweigend ignoriert: das Modell bekam nie die
// Nutzerantwort, nie den Interview-Verlauf und nie die INTERVIEW_REGELN zu sehen.
//
// Dieses Modul übersetzt das Interview-Domänenmodell auf den tatsächlichen baueAnfrage-
// Vertrag, den der Vertrag selbst unverändert lässt (er ist getestet und wird von 'chat'
// genutzt). workspace.js sammelt nur noch die Rohdaten ein (verstaendnisEingabe) und ruft
// baueVerstaendnisKontext auf.
import { INTERVIEW_REGELN } from './agent-prompts.mjs'

const MODUS_HINWEIS = {
  entwurf: 'Kontext: Es liegt bereits Dokumenttext vor. Leite daraus einen ersten Entwurf des '
    + 'Projektverständnisses ab und lege ihn zur Korrektur vor.',
  antwort: 'Kontext: Die Autorin oder der Autor hat soeben im Gespräch geantwortet. Aktualisiere '
    + 'dein Verständnis entsprechend und stelle bei Bedarf die eine naheliegende Rückfrage.',
}

function modusHinweis(modus) {
  return MODUS_HINWEIS[modus] || MODUS_HINWEIS.antwort
}

// Klare Anweisung statt stiller Rohliste: geschützte Felder sind Nutzer-Korrekturen und
// dürfen nie überschrieben oder erneut zur Diskussion gestellt werden (siehe
// reasoning-model.mjs mergeVerstaendnis — dieselbe Regel, hier dem Modell selbst gesagt,
// nicht erst nachträglich beim Merge erzwungen).
function geschuetzteFelderHinweis(geschuetzt) {
  const felder = Array.isArray(geschuetzt) ? geschuetzt.map(f => String(f || '').trim()).filter(Boolean) : []
  if (!felder.length) return null
  return 'Diese Felder des Projektverständnisses hat die Autorin oder der Autor ausdrücklich '
    + 'selbst gesetzt — nicht überschreiben, nicht erneut zur Diskussion stellen: '
    + felder.join(', ') + '.'
}

function rolleFuerAnthropic(rolle) {
  return rolle === 'agent' ? 'assistant' : 'user'
}

// interviewVerlauf: BISHERIGER Verlauf, chronologisch, ÄLTERE Turns zuerst — OHNE die
// aktuelle Antwort/Frage (die kommt separat über nutzerText/anfrage). Der Aufrufer
// (workspace.js verstaendnisEingabe) schneidet den soeben angehängten aktuellen Turn
// vorher ab; diese Funktion geht davon aus, dass interviewVerlauf reine Vorgeschichte ist.
export function baueVerstaendnisKontext({
  modus,
  verstaendnis,
  geschuetzt = [],
  docText = '',
  nutzerText = '',
  interviewVerlauf = [],
} = {}) {
  const volatiles = [INTERVIEW_REGELN, modusHinweis(modus)]
  const geschuetztHinweis = geschuetzteFelderHinweis(geschuetzt)
  if (geschuetztHinweis) volatiles.push(geschuetztHinweis)

  const kontext = { verstaendnis, docText, volatiles }

  // 'entwurf' hat keine aktuelle Nutzerantwort: weder verlauf noch anfrage mitgeben —
  // baueAnfrage wirft sonst („anfrage fehlt bei vorhandenem verlauf"), siehe G-2-Vertrag.
  const text = String(nutzerText || '').trim()
  if (text) {
    if (interviewVerlauf && interviewVerlauf.length) {
      kontext.verlauf = interviewVerlauf.map(eintrag => ({
        role: rolleFuerAnthropic(eintrag.role),
        content: String(eintrag.text || ''),
      }))
    }
    kontext.anfrage = text
  }

  return kontext
}
