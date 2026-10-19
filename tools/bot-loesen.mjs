// Löst eine Aufgabe im Kinderbereich über echte Klicks (für Browser-Bots). Gibt den erwarteten Wert zurück:
// 1 (richtig), 0.5 (zuerst falsch, dann richtig) oder 'geuebt' (Nachspuren).
const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));


export async function loeseAufgabe(page, a, falschZuerst = false) {
  const haken = () => page.click('.k-haken');
  const k = (sel) => page.locator('.buehne ' + sel);
  switch (a.typ) {
    case 'zahl': {
      const tippe = async (i, n) => {
        await k(`.af[data-i="${i}"]`).click();
        if (a.zahlenfeld === 'ziffern') { for (const d of String(n)) await k(`.taste[aria-label="${d}"]`).click(); }
        else await k(`.taste[aria-label="${n}"]`).click();
      };
      if (falschZuerst && a.loesung.length === 1) {
        const f = a.loesung[0] === 0 ? 1 : a.loesung[0] - 1;
        await tippe(0, f); await haken();
        await page.waitForFunction(() => !document.querySelector('.af.loesung'), null, { timeout: 4000 });
        await warte(150);
        if (a.zahlenfeld === 'ziffern') { await k('.af[data-i="0"]').click(); for (let j = 0; j < 3; j++) await k('.taste.loeschen').click(); }
      }
      for (let i = 0; i < a.loesung.length; i++) {
        const feld = k(`.af[data-i="${i}"]`);
        if (await feld.evaluate((el) => el.classList.contains('ok'))) continue;
        await tippe(i, a.loesung[i]);
      }
      await haken(); return falschZuerst && a.loesung.length === 1 ? 0.5 : 1;
    }
    case 'wahl-bild': case 'wahl-wort': case 'muster': case 'bild-wort': {
      if (falschZuerst) { const f = a.richtig === 0 ? 1 : 0; await k('.wkarte').nth(f).click(); await page.waitForFunction((i) => document.querySelectorAll('.buehne .wkarte')[i].classList.contains('weg'), f, { timeout: 4000 }); }
      await k('.wkarte').nth(a.richtig).click(); return falschZuerst ? 0.5 : 1;
    }
    case 'zaehlen': {
      const n = await k('.zding').count();
      for (let i = 0; i < n; i++) await k('.zding').nth(i).click();
      if (a.antwort === 'wahl') await k('.zahlkarte').nth(a.richtig).click();
      else { await k(`.taste[aria-label="${a.anzahl}"]`).click(); await haken(); }
      return 1;
    }
    case 'reihenfolge': case 'legen': {
      const ziel = a.typ === 'reihenfolge' ? a.teile.map((_, i) => String(i)) : a.loesung.map(String);
      for (const w of ziel) {
        const karte = await page.locator(`.lpool .lkarte[data-wert="${w.replace(/"/g, '\\"')}"]`).first().elementHandle();
        await karte.click();
        if (await karte.evaluate((el) => el.classList.contains('gehoert'))) await karte.click();   // Hörkarte: anhören, dann legen
      }
      await haken(); return 1;
    }
    case 'menge-legen': {
      if (a.feld === 'lautreihe' || a.feld === 'wortreihe') { for (let i = 0; i < a.ziel; i++) await k(`.rplatz[data-i="${i}"]`).click(); await haken(); return 1; }
      if (a.feld === 'muenzen') { let rest = a.ziel; for (const w of [...a.muenzen].sort((x, y) => y - x)) while (rest >= w) { await k(`.vorrat-knopf[data-wert="${w}"]`).click(); rest -= w; } }
      else if (a.feld === 'zehnereiner') { for (let i = 0; i < Math.floor(a.ziel / 10); i++) await k('.ze-quelle:not(.einer)').click(); for (let i = 0; i < a.ziel % 10; i++) await k('.ze-quelle.einer').click(); }
      else {
        const start = a.start || 0;
        if (a.ziel > start) for (let i = start; i < a.ziel; i++) await k(`rect.feld-zelle[data-i="${i}"]`).click({ force: true });
        else for (let i = a.ziel; i < start; i++) await k(`rect.feld-zelle[data-i="${i}"]`).click({ force: true });
      }
      await haken(); return 1;
    }
    case 'antippen': {
      for (const w of a.loesung) await k(`[data-wert="${w}"]`).first().click({ force: true });
      await haken(); return 1;
    }
    case 'hoeren-tippen': {
      if (a.ziehen) { for (const z of a.ziehen) { await k(`.hding[data-id="${z.element}"]`).click(); await k(`.hort[data-ort="${z.ort}"]`).click({ force: true }); } await haken(); return 1; }
      for (const id of a.loesung) await k(`.hding[data-id="${id}"]`).click(); return 1;
    }
    case 'zuordnen': {
      for (let i = 0; i < a.paare.length; i++) { await k(`.zkarte.links[data-i="${i}"]`).click(); await k(`.zkarte.rechts[data-j="${i}"]`).click(); }
      return 1;
    }
    case 'nachspuren': {
      const striche = await page.evaluate(async (zeichen) => {
        const S = await (await fetch('/data/schrift/basisschrift.json')).json();
        const svg = document.querySelector('.ns-flaeche'); const m = svg.getScreenCTM();
        let dx = 0; const aus = [];
        for (const c of zeichen) {   // wie in der Oberfläche: Zeichen mit Abstand 10 nebeneinander
          const z = S.zeichen[c];
          for (const st of z.striche) aus.push(st.punkte.filter((_, i) => i % 2 === 0).map(([x, y]) => { const p = new DOMPoint(x + dx, y).matrixTransform(m); return [p.x, p.y]; }));
          dx += z.breite + 10;
        }
        return aus;
      }, [...(a.wort || a.zeichen)]);
      for (const st of striche) { await page.mouse.move(st[0][0], st[0][1]); await page.mouse.down(); for (const [x, y] of st.slice(1)) await page.mouse.move(x, y); await page.mouse.up(); }
      await haken(); return 'geuebt';
    }
    case 'wahl-hoeren': {
      if (falschZuerst) { const f = a.richtig === 0 ? 1 : 0; await k('.hkarte').nth(f).click(); await haken(); await page.waitForFunction((i) => document.querySelectorAll('.buehne .hkarte')[i].classList.contains('weg'), f, { timeout: 4000 }); }
      await k('.hkarte').nth(a.richtig).click(); await haken(); return falschZuerst ? 0.5 : 1;
    }
    case 'silben': {
      if (a.modus === 'zaehlen') { for (let i = 0; i < a.silben.length; i++) await k('.trommel').click(); }
      else for (let i = 0; i < a.silben.length; i++) await page.locator(`.lpool .lkarte[data-wert="${i}"]`).first().click();
      await haken(); return 1;
    }
    case 'lautplatz': {
      if (falschZuerst) { const f = ['vorne', 'hinten', 'mitte', 'nicht'].find((x) => x !== a.loesung); await k(`.wagen[data-wert="${f}"]`).click(); await page.waitForFunction(() => document.querySelector('.buehne .wagen.weg-leise'), null, { timeout: 4000 }); }
      await k(`.wagen[data-wert="${a.loesung}"]`).click(); return falschZuerst ? 0.5 : 1;
    }
    case 'vorlesen': { await page.click('text=Geklappt'); return 1; }
    default: throw new Error('Bot kennt den Typ nicht: ' + a.typ);
  }
}

