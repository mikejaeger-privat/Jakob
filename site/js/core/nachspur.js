// Tolerante Prüfung beim Nachspuren (Zeichenkoordinaten: Höhe 100 von der Oberlinie bis zur Grundlinie).
// Abdeckung: Anteil der Vorlage, den der Finger überfahren hat (Toleranz 10 % der Zeilenhöhe), mindestens 75 %,
// und jeder Strich mindestens 60 %.
// Richtung: Jeder offene Strich wird in grober Richtung gefahren (der Fingerstrich beginnt näher am Anfang als am Ende).
// Genauigkeit: Mindestens 75 % der Fingerpunkte liegen nahe der Vorlage, fast alle höchstens 20 Einheiten daneben, und der
// Fingerweg ist höchstens 2,5-mal so lang wie die Vorlage (kein Kritzeln über die ganze Fläche).
// Die Strichreihenfolge wird nur als Hinweis gemeldet, nie als Grund für «nochmal».

const abstand = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function naechster(p, punkte) { let m = Infinity; for (const q of punkte) { const d = abstand(p, q); if (d < m) m = d; } return m; }

export const STANDARD = { toleranz: 10, minAbdeckung: 0.75, minStrich: 0.6, minGenauigkeit: 0.75, maxLaenge: 2.5, maxLuecke: 20, offenAb: 15 };
const laenge = (st) => st.reduce((sum, p, i) => (i ? sum + abstand(p, st[i - 1]) : 0), 0);

// vorlage: [[x, y], …] je Strich (Liste von Strichen); spuren: Fingerstriche im selben Koordinatensystem
export function bewerte(vorlage, spuren, opt = {}) {
  const o = { ...STANDARD, ...opt };
  const alleSpur = spuren.flat();
  if (alleSpur.length < 3) return { ok: false, abdeckung: 0, genauigkeit: 0, richtung: vorlage.map(() => false), grund: 'leer' };
  // Abdeckung je Strich und gesamt
  let gedeckt = 0, gesamt = 0;
  const jeStrich = vorlage.map((strich) => {
    let g = 0;
    for (const p of strich) if (naechster(p, alleSpur) <= o.toleranz) g++;
    gedeckt += g; gesamt += strich.length;
    return g / strich.length;
  });
  const abdeckung = gesamt ? gedeckt / gesamt : 0;
  // Genauigkeit: Anteil der Fingerpunkte nahe der Vorlage
  const alleVorlage = vorlage.flat();
  let nah = 0;
  for (const p of alleSpur) if (naechster(p, alleVorlage) <= o.toleranz) nah++;
  const genauigkeit = nah / alleSpur.length;
  // Lücke: wie weit der Finger höchstens von der Vorlage wegfährt (95. Perzentil, ein Ausrutscher zählt nicht)
  const abstaende = alleSpur.map((p) => naechster(p, alleVorlage)).sort((x, y) => x - y);
  const luecke = abstaende[Math.min(abstaende.length - 1, Math.floor(abstaende.length * 0.95))];
  const laengeVerhaeltnis = spuren.reduce((sum, sp) => sum + laenge(sp), 0) / Math.max(1, vorlage.reduce((sum, st) => sum + laenge(st), 0));
  // Richtung: zu jedem Strich der Fingerstrich, der ihn am meisten abdeckt
  const richtung = vorlage.map((strich) => {
    const a = strich[0], e = strich.at(-1);
    if (abstand(a, e) < o.offenAb) return true;   // geschlossene Form (0, 8): Richtung nicht prüfbar
    let beste = null, besteAnteil = 0;
    for (const sp of spuren) {
      if (sp.length < 2) continue;
      let g = 0; for (const p of strich) if (naechster(p, sp) <= o.toleranz) g++;
      if (g / strich.length > besteAnteil) { besteAnteil = g / strich.length; beste = sp; }
    }
    if (!beste || besteAnteil < 0.3) return false;
    // Beginn des Fingerstrichs: der Punkt des Fingers, der der Vorlage am frühesten nahe kommt
    const start = beste.find((p) => naechster(p, strich) <= o.toleranz) || beste[0];
    const ende = [...beste].reverse().find((p) => naechster(p, strich) <= o.toleranz) || beste.at(-1);
    return abstand(start, a) + abstand(ende, e) <= abstand(start, e) + abstand(ende, a);
  });
  // Reihenfolge (nur Hinweis): Werden die Striche in der Reihenfolge der Vorlage gefahren?
  const wer = vorlage.map((strich) => {
    let beste = -1, besteAnteil = 0;
    spuren.forEach((sp, j) => { let g = 0; for (const p of strich) if (naechster(p, sp) <= o.toleranz) g++; if (g / strich.length > besteAnteil) { besteAnteil = g / strich.length; beste = j; } });
    return beste;
  });
  const reihenfolge = wer.every((j, i) => i === 0 || j === -1 || wer[i - 1] === -1 || j >= wer[i - 1]);
  const abgedeckt = abdeckung >= o.minAbdeckung && jeStrich.every((x) => x >= o.minStrich);
  const genau = genauigkeit >= o.minGenauigkeit && laengeVerhaeltnis <= o.maxLaenge && luecke <= o.maxLuecke;
  const ok = abgedeckt && genau && richtung.every(Boolean);
  const grund = ok ? null : !abgedeckt ? 'abdeckung' : !genau ? 'genauigkeit' : 'richtung';
  return { ok, abdeckung, genauigkeit, laengeVerhaeltnis, luecke, richtung, jeStrich, reihenfolge, grund };
}

// Hilfe für Tests und die Zeigehand: verschiebt Vorlagenpunkte leicht (wie ein ungenauer Finger)
export function zittern(strich, staerke, zufall) {
  return strich.map(([x, y]) => [x + (zufall() - 0.5) * 2 * staerke, y + (zufall() - 0.5) * 2 * staerke]);
}
