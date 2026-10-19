// Schulkalender: Ferien, Feiertage, Lerntage, Schulwochen (rein, ohne Browser; auch für Simulation und Tests).
import { tagNr, wochentag } from './util.js';

// Liefert eine Kalender-Funktion über die Daten aus ziele.json
export function kalender(Zi) {
  const ferien = (Zi.ferien?.liste || []).map(([von, bis, name]) => ({ von: tagNr(von), bis: tagNr(bis), name }));
  const feiertage = new Map((Zi.feiertage?.liste || []).map(([d, name]) => [tagNr(d), name]));
  const etappen = (Zi.etappen || []).map((e) => ({ ...e, tag: tagNr(e.datum) }));

  // Ferienname oder null (die Liste nennt Montag bis Freitag; das Wochenende danach gehört nicht dazu)
  function ferienAm(t) {
    for (const f of ferien) if (t >= f.von && t <= f.bis) return f.name;
    return null;
  }
  const feiertagAm = (t) => feiertage.get(t) || null;
  const schultag = (t) => wochentag(t) < 5 && !ferienAm(t) && !feiertagAm(t);
  // lernTage: Liste der Wochentage 1 = Montag … 7 = Sonntag
  const lerntag = (t, lernTage) => lernTage.includes(wochentag(t) + 1) && !ferienAm(t) && !feiertagAm(t);
  // Schulwochen zwischen zwei Tagen (Wochen mit mindestens einem Schultag)
  function schulwochen(von, bis) {
    let n = 0;
    const montag = (t) => t - wochentag(t);
    for (let w = montag(von); w <= bis; w += 7) {
      let schul = false;
      for (let d = 0; d < 5; d++) if (w + d >= von && w + d <= bis && schultag(w + d)) { schul = true; break; }
      if (schul) n++;
    }
    return n;
  }
  return { ferienAm, feiertagAm, schultag, lerntag, schulwochen, etappen, ferien };
}
