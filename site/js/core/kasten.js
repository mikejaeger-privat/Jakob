// Karteikasten (Leitner) für das Aufwärmen: Buchstaben, Verbindungen, Sichtwörter, Lernwörter, Blitzrechnen.
// Reine Funktionen. Eine Karte liegt in Fach 1 bis 5; Abstände in parameter.json (karteikasten.faecher).
// Kartennamen: «b:m» Buchstabe, «v:sch» Verbindung, «s:und» Sichtwort, «l:<id>» Lernwort, «r:7=3+4», «r:3+4», «r:7−3».

export function neueKarte(heute, fach = 1) { return { fach, faellig: heute, n: 0, ok: 0, neu: heute, letzt: null }; }

// wert: 1 richtig, 0.5 nach Hinweis, 0 nicht gelöst. Entdeckerrunde: richtig im ersten Versuch → Startfach
export function verbucheKarte(kasten, id, wert, heute, KK, { entdecker = false } = {}) {
  const k = kasten[id] || (kasten[id] = neueKarte(heute));
  k.n++; k.letzt = heute;
  const abstand = (f) => KK.faecher[Math.min(KK.faecher.length, f) - 1];
  if (wert === 1) {
    k.ok++;
    k.fach = entdecker && k.n === 1 ? Math.max(k.fach, KK.startFachWennSicher) : Math.min(KK.faecher.length, k.fach + 1);
    k.faellig = heute + abstand(k.fach);
  } else if (wert === 0.5) {
    k.faellig = heute + 1;               // bleibt im Fach, morgen nochmals
  } else {
    k.fach = 1; k.faellig = heute + 1;   // zurück ins erste Fach
  }
  return k;
}

// Karten für heute: zuerst fällige (am längsten überfällig, tiefes Fach zuerst), dann neue bis zur Tagesgrenze
export function kartenHeute(kasten, kandidaten, heute, KK, { anzahl = KK.kartenImAufwaermen, neuHeute = 0, neuMax = KK.neueProTag } = {}) {
  const erlaubt = new Set(kandidaten);
  const faellig = Object.entries(kasten)
    .filter(([id, k]) => erlaubt.has(id) && k.faellig <= heute && k.letzt !== heute)
    .sort((a, b) => a[1].faellig - b[1].faellig || a[1].fach - b[1].fach)
    .map(([id]) => id);
  const aus = faellig.slice(0, anzahl);
  let neu = Math.max(0, neuMax - neuHeute);
  for (const id of kandidaten) {
    if (aus.length >= anzahl || neu <= 0) break;
    if (!kasten[id]) { aus.push(id); neu--; }
  }
  return aus;
}

export const istNeu = (kasten, id) => !kasten[id];
export const kartenArt = (id) => ({ b: 'buchstaben', v: 'buchstaben', s: 'sichtwoerter', l: 'lernwoerter', r: 'rechnen' })[id[0]] || null;
