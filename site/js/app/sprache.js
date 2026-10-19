// Sprachausgabe des Geräts (Web Speech API) für den Kinderbereich.
// Nur Stimmen auf dem Gerät (Netzwerkstimmen würden die Texte an einen Dienst senden). Kein Überlappen: Jede neue
// Ausgabe bricht die laufende ab. Teile, getrennt durch «…», werden einzeln mit Pause gesprochen (Silben, Bildnamen).
let stimmen = [];
let bereit = null;
const opt = { tempo: 0.85, pauseMs: 450, sprachen: ['de-CH', 'de-DE', 'de-AT', 'de'], nurLokal: true, dehnlautText: {}, stimmeName: null };
const da = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function initSprache(P) {
  if (P?.sprache) Object.assign(opt, { tempo: P.sprache.tempo, pauseMs: P.sprache.pauseZwischenTeilenMs, sprachen: P.sprache.stimmen, nurLokal: P.sprache.nurLokaleStimmen, dehnlautText: P.sprache.dehnlautText || {} });
  if (!da()) { bereit = Promise.resolve([]); return bereit; }
  bereit = new Promise((ok) => {
    const lade = () => { stimmen = speechSynthesis.getVoices(); if (stimmen.length) ok(stimmen); };
    lade();
    speechSynthesis.addEventListener?.('voiceschanged', lade);
    setTimeout(() => ok(stimmen), 1500);
  });
  return bereit;
}
export const sprachBereit = () => bereit || Promise.resolve([]);

// Einstellungen der Eltern: gewählte Stimme (Name) und Tempo
export function konfiguriere({ stimme, tempo } = {}) {
  if (stimme !== undefined) opt.stimmeName = stimme || null;
  if (typeof tempo === 'number') opt.tempo = tempo;
}

const passt = (v, l) => v.lang?.toLowerCase().replace('_', '-') === l.toLowerCase() || v.lang?.toLowerCase().startsWith(l.toLowerCase());
const lokal = () => stimmen.filter((v) => !opt.nurLokal || v.localService !== false);
export function deutscheStimmen() {
  return lokal().filter((v) => passt(v, 'de')).map((v) => ({ name: v.name, lang: v.lang, standard: !!v.default }))
    .sort((a, b) => opt.sprachen.findIndex((l) => a.lang.startsWith(l)) - opt.sprachen.findIndex((l) => b.lang.startsWith(l)) || a.name.localeCompare(b.name));
}
function stimme() {
  const l = lokal();
  if (opt.stimmeName) { const v = l.find((x) => x.name === opt.stimmeName && passt(x, 'de')); if (v) return v; }
  for (const sp of opt.sprachen) { const v = l.find((x) => passt(x, sp)); if (v) return v; }
  return null;
}
export const stimmeDa = () => da() && !!stimme();
export const stimmeInfo = () => { const v = stimme(); return v ? { name: v.name, lang: v.lang } : null; };

// Text für die Stimme aufbereiten: Anführungszeichen weg, Rechenzeichen und Geld als Wörter
export function sprechText(t) {
  return String(t ?? '')
    .replace(/[«»„“”"‹›]/g, '')
    .replace(/(\d)\s*[−-]\s*(\d)/g, '$1 minus $2').replace(/\s[−]\s/g, ' minus ')
    .replace(/(\d|_)\s*\+\s*(\d|_)/g, '$1 plus $2').replace(/\s=\s/g, ' gleich ')
    .replace(/(\d)\s*<\s*(\d)/g, '$1 ist kleiner als $2').replace(/(\d)\s*>\s*(\d)/g, '$1 ist grösser als $2')
    .replace(/_/g, ' wie viel ').replace(/\bFr\.\s?/g, 'Franken ').replace(/\bRp\./g, 'Rappen')
    .replace(/\s+/g, ' ').trim();
}

let lauf = 0;
let spricht = false;
const melde = () => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('sprache', { detail: { spricht } })); };
export const sprichtGerade = () => spricht;
export function stopp() {
  lauf++;
  if (da()) speechSynthesis.cancel();
  if (spricht) { spricht = false; melde(); }
}
const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));

function sprichTeil(text, meinLauf, tempo) {
  return new Promise((ok) => {
    if (meinLauf !== lauf) { ok(false); return; }
    const v = stimme();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = tempo; u.pitch = 1;
    let fertig = false;
    const ende = (wert) => { if (!fertig) { fertig = true; clearTimeout(t); ok(wert); } };
    // Manche Browser melden das Ende nicht: nach geschätzter Dauer trotzdem weiter
    const t = setTimeout(() => ende(meinLauf === lauf), 2500 + (text.length * 95) / tempo);
    u.onend = () => ende(meinLauf === lauf);
    u.onerror = () => ende(false);
    if (speechSynthesis.paused) speechSynthesis.resume();
    speechSynthesis.speak(u);
  });
}

// Spricht einen Text oder eine Liste von Teilen. Ergebnis: true, wenn alles gesprochen wurde, false bei Abbruch.
export async function sprich(text, { tempo = null, pauseMs = null } = {}) {
  if (!stimmeDa()) return false;
  stopp();
  const meinLauf = lauf;
  const teile = (Array.isArray(text) ? text : String(text).split(/\s*…\s*/)).map(sprechText).filter(Boolean);
  if (!teile.length) return true;
  await warte(60);   // nach cancel() verschluckt Safari sonst den Anfang
  spricht = true; melde();
  let ok = true;
  for (let i = 0; i < teile.length && ok; i++) {
    if (i) await warte(pauseMs ?? opt.pauseMs);
    ok = await sprichTeil(teile[i], meinLauf, tempo ?? opt.tempo);
  }
  if (meinLauf === lauf) { spricht = false; melde(); }
  return ok;
}

// Dehnlaut für einen Buchstaben («mmm») oder null, wenn er sich nicht dehnen lässt
export const dehnlaut = (id) => opt.dehnlautText[id] || null;

// iOS: Sprache und Ton dürfen erst nach einer Berührung starten. Aus einem Tipp heraus aufrufen.
export function freischalten() {
  if (!da()) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    const v = stimme(); if (v) { u.voice = v; u.lang = v.lang; }
    speechSynthesis.speak(u);
  } catch { /* egal */ }
}
