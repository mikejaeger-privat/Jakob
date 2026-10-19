// Antwortprüfung für alle Aufgabentypen (beide Fächer). Reine Logik ohne Oberfläche, mit node:test prüfbar.
// pruefe(a, eingabe) -> { ok, teile?, fehlerbild? }
//   teile: was an einer mehrteiligen Antwort schon stimmt (bleibt nach dem ersten Fehler liegen)

const k = (x) => (x && typeof x === 'object' ? JSON.stringify(x) : String(x));
const gleich = (a, b) => a.length === b.length && a.every((x, i) => k(x) === k(b[i]));

// Felder einer Fünfergruppe: Zehnerfeld 2 × 5 (jede Reihe eine Gruppe), Zwanzigerfeld 2 × 10 (je zwei Gruppen pro Reihe)
export const FELD = {
  zehner: { reihen: 2, spalten: 5 },
  zwanziger: { reihen: 2, spalten: 10 },
};
// Kraft der Fünf: volle Fünfergruppen, höchstens eine angefangene, und die von links her ohne Lücke
export function hatFuenferstruktur(zellen, feld) {
  const { reihen, spalten } = FELD[feld];
  const gruppen = (reihen * spalten) / 5;
  let angefangen = 0;
  for (let g = 0; g < gruppen; g++) {
    const belegt = [0, 1, 2, 3, 4].map((j) => zellen.includes(g * 5 + j));
    const n = belegt.filter(Boolean).length;
    if (n === 0 || n === 5) continue;
    angefangen++;
    if (belegt.indexOf(false) !== n) return false;   // nicht von links her gefüllt
  }
  return angefangen <= 1;
}

export function pruefe(a, eingabe) {
  switch (a.typ) {
    case 'zahl': {
      const e = Array.isArray(eingabe) ? eingabe : [eingabe];
      const teile = a.loesung.map((l, i) => Number(e[i]) === l);
      const ok = teile.every(Boolean) && e.length === a.loesung.length;
      const fb = !ok && a.loesung.length === 1 ? (a.fehlerbilder || []).find((f) => f.eingabe === String(e[0])) : null;
      return { ok, teile, fehlerbild: fb?.text };
    }
    case 'wahl-bild': case 'wahl-wort': case 'wahl-hoeren': case 'muster': case 'bild-wort': {
      const ok = eingabe === a.richtig;
      const wert = a.optionen?.[eingabe];
      const fb = ok ? null : (a.fehlerbilder || []).find((f) => f.eingabe === k(wert) || f.eingabe === String(eingabe));
      return { ok, fehlerbild: fb?.text };
    }
    case 'zaehlen': {
      const ok = Number(eingabe) === a.anzahl;
      return { ok, fehlerbild: ok ? null : (a.fehlerbilder || []).find((f) => f.eingabe === String(eingabe))?.text };
    }
    case 'reihenfolge': {
      const werte = eingabe.map((i) => a.teile[i]);
      const loesungen = [a.teile, ...(a.alternativen || [])];
      const ok = werte.length === a.teile.length && loesungen.some((l) => gleich(werte, l));
      // so viele Karten von vorn wie in einer Lösung richtig liegen
      let vorn = 0;
      for (const l of loesungen) { let n = 0; while (n < werte.length && k(werte[n]) === k(l[n])) n++; vorn = Math.max(vorn, n); }
      return { ok, teile: werte.map((_, i) => i < vorn) };
    }
    case 'legen': {
      const loesungen = [a.loesung, ...(a.alternativen || [])];
      const ok = loesungen.some((l) => gleich(eingabe, l));
      // richtige Stellen gegen die Lösung, die am meisten trifft
      let beste = [];
      for (const l of loesungen) { const t = eingabe.map((x, i) => k(x) === k(l[i])); if (t.filter(Boolean).length > beste.filter(Boolean).length) beste = t; }
      return { ok, teile: beste.length ? beste : eingabe.map(() => false) };
    }
    case 'menge-legen': {
      if (a.feld === 'muenzen') return { ok: eingabe.summe === a.ziel };
      if (a.feld === 'lautreihe' || a.feld === 'wortreihe') return { ok: eingabe.anzahl === a.ziel, zuViel: eingabe.anzahl > a.ziel, zuWenig: eingabe.anzahl < a.ziel };
      if (a.feld === 'zehnereiner') return { ok: eingabe.zehner * 10 + eingabe.einer === a.ziel && eingabe.einer <= 9 };
      const zellen = eingabe.zellen || [];
      const ok = zellen.length === a.ziel && (!a.struktur || hatFuenferstruktur(zellen, a.feld));
      return { ok, zuViel: zellen.length > a.ziel, zuWenig: zellen.length < a.ziel, struktur: zellen.length === a.ziel && !ok };
    }
    case 'antippen': {
      const e = new Set(eingabe.map(k)), l = new Set(a.loesung.map(k));
      const ok = e.size === l.size && [...e].every((x) => l.has(x));
      return { ok, teile: eingabe.map((x) => l.has(k(x))) };
    }
    case 'hoeren-tippen': {
      if (a.ziehen) {   // eingabe: { element: ort }
        const ok = a.ziehen.every((z) => eingabe?.[z.element] === z.ort) && Object.keys(eingabe || {}).length === a.ziehen.length;
        return { ok, teile: a.ziehen.map((z) => eingabe?.[z.element] === z.ort) };
      }
      const ok = a.reihenfolge === false
        ? eingabe.length === a.loesung.length && a.loesung.every((x) => eingabe.includes(x))
        : gleich(eingabe, a.loesung);
      return { ok, teile: eingabe.map((x, i) => (a.reihenfolge === false ? a.loesung.includes(x) : a.loesung[i] === x)) };
    }
    case 'silben': {
      if (a.modus === 'zaehlen') return { ok: Number(eingabe) === a.silben.length };
      return pruefe({ typ: 'reihenfolge', teile: a.silben }, eingabe);
    }
    case 'lautplatz': return { ok: eingabe === a.loesung };
    default: throw new Error('Unbekannter Aufgabentyp: ' + a.typ);
  }
}

// Zuordnen: passt das linke Element i zum rechten Element j? (gleiche Werte gelten als gleich)
export function passt(a, i, j) { return k(a.paare[i][1]) === k(a.paare[j][1]) || k(a.paare[i][0]) === k(a.paare[j][0]); }

// Die richtige Eingabe einer Aufgabe (für Tests, Selbsttest und die Vorschau der Eltern)
export function richtigeEingabe(a) {
  switch (a.typ) {
    case 'zahl': return a.loesung.slice();
    case 'wahl-bild': case 'wahl-wort': case 'wahl-hoeren': case 'muster': case 'bild-wort': return a.richtig;
    case 'zaehlen': return a.anzahl;
    case 'reihenfolge': return a.teile.map((_, i) => i);
    case 'legen': return a.loesung.slice();
    case 'menge-legen': {
      if (a.feld === 'muenzen') return { summe: a.ziel };
      if (a.feld === 'lautreihe' || a.feld === 'wortreihe') return { anzahl: a.ziel };
      if (a.feld === 'zehnereiner') return { zehner: Math.floor(a.ziel / 10), einer: a.ziel % 10 };
      return { zellen: Array.from({ length: a.ziel }, (_, i) => i) };   // Zellen in Lesereihenfolge, Fünfergruppen zuerst
    }
    case 'antippen': return a.loesung.slice();
    case 'hoeren-tippen': return a.ziehen ? Object.fromEntries(a.ziehen.map((z) => [z.element, z.ort])) : a.loesung.slice();
    case 'silben': return a.modus === 'zaehlen' ? a.silben.length : a.silben.map((_, i) => i);
    case 'lautplatz': return a.loesung;
    case 'zuordnen': return a.paare.map((_, i) => i);
    default: return null;
  }
}

// Die Lösung als kurzer Text (Elternbereich, Prüfwerkzeuge)
export function loesungText(a) {
  const opt = (o) => (typeof o === 'object' ? (o.text ?? o.bild ?? o.wort ?? JSON.stringify(o.visual ?? o.szene ?? o)) : String(o));
  switch (a.typ) {
    case 'zahl': return a.loesung.join(', ') + (a.einheit ? ' ' + a.einheit : '');
    case 'wahl-bild': case 'wahl-wort': case 'wahl-hoeren': case 'muster': case 'bild-wort': return opt(a.optionen[a.richtig]);
    case 'zaehlen': return String(a.anzahl);
    case 'reihenfolge': return a.teile.map(opt).join(' – ');
    case 'legen': return a.loesung.join(' ');
    case 'menge-legen': return a.feld === 'muenzen' ? `${a.ziel / 100} Fr.` : String(a.ziel);
    case 'antippen': return a.loesung.join(', ');
    case 'hoeren-tippen': return a.ziehen ? a.ziehen.map((z) => `${z.element} → ${z.ort}`).join(', ') : a.loesung.join(', ');
    case 'zuordnen': return a.paare.map(([x, y]) => `${opt(x)} – ${opt(y)}`).join('; ');
    case 'nachspuren': return a.zeichen || a.wort;
    case 'silben': return a.modus === 'zaehlen' ? String(a.silben.length) : a.silben.join(' – ');
    case 'lautplatz': return a.loesung;
    case 'vorlesen': return a.zeige;
    default: return '';
  }
}
