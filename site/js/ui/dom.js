// Kleine DOM-Helfer ohne Abhängigkeiten.

// h('div.klasse#id', { onclick, attr }, kinder...)
export function h(tag, props, ...kinder) {
  if (props === null || typeof props !== 'object' || props instanceof Node || Array.isArray(props)) { kinder.unshift(props); props = {}; }
  const m = tag.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement(m[1] || 'div');
  for (const t of (m[2] || '').match(/[.#][\w-]+/g) || []) {
    if (t[0] === '.') el.classList.add(t.slice(1)); else el.id = t.slice(1);
  }
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className += ' ' + v;
    else if (k === 'value') el.value = v; // Textfelder: als Eigenschaft, sonst bleibt eine textarea leer
    else if (k === 'style') { if (typeof v === 'object') Object.assign(el.style, v); else el.style.cssText = v; } // CSSOM: erlaubt mit style-src 'self'
    else if (k in el && typeof v !== 'string' && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  haenge(el, kinder);
  return el;
}

function haenge(el, kinder) {
  for (const k of kinder.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

export function leere(el, ...kinder) { el.replaceChildren(); haenge(el, kinder); return el; }

// Text mit **fett** und Zeilenumbrüchen als sichere DOM-Knoten
export function texte(s) {
  const teile = [];
  String(s ?? '').split('\n').forEach((zeile, i) => {
    if (i) teile.push(document.createElement('br'));
    zeile.split(/(\*\*[^*]+\*\*)/g).forEach((t) => {
      if (/^\*\*[^*]+\*\*$/.test(t)) { const b = document.createElement('strong'); b.textContent = t.slice(2, -2); teile.push(b); }
      else if (t) teile.push(document.createTextNode(t));
    });
  });
  return teile;
}

export const svgNS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}, ...kinder) {
  const el = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) { if (v === undefined || v === null) continue; if (k === 'style') el.style.cssText = v; else el.setAttribute(k, v); }
  for (const k of kinder.flat(Infinity)) if (k !== null && k !== undefined && k !== false) el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return el;
}

export function icon(name, groesse = 22) {
  const P = {
    heute: 'M4 6h16M4 12h10M4 18h7',
    stufen: 'M4 19h5v-5h5v-5h6',
    ziel: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
    karten: 'M5 7h11v12H5zM8 4h11v12',
    schloss: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z',
    zurueck: 'M15 5l-7 7l7 7',
    weiter: 'M9 5l7 7l-7 7',
    zu: 'M6 6l12 12M18 6L6 18',
    ton: 'M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
    fahne: 'M6 21V4M6 4h11l-2 4l2 4H6',
    check: 'M5 12.5l4.5 4.5L19 7',
    uhr: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18',
    plus: 'M12 5v14M5 12h14',
    lampe: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3',
    kalender: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    herunter: 'M12 4v11M7 10l5 5l5-5M5 20h14',
    hoch: 'M12 20V9M7 14l5-5l5 5M5 4h14',
  };
  return s('svg', { viewBox: '0 0 24 24', width: groesse, height: groesse, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: 'ic' },
    s('path', { d: P[name] || P.heute }));
}

export function meldung(text, art = 'info', dauer = 3200) {
  const ansage = document.getElementById('ansage');
  if (ansage) { ansage.textContent = ''; setTimeout(() => { ansage.textContent = text; }, 50); }
  const el = h('div.toast.' + art, { 'aria-hidden': 'true' }, text);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('da'));
  setTimeout(() => { el.classList.remove('da'); setTimeout(() => el.remove(), 300); }, dauer);
}

export function dialog(titel, inhalt, knoepfe = [{ text: 'OK', wert: true, haupt: true }]) {
  return new Promise((ok) => {
    const id = 'dlg-' + Math.random().toString(36).slice(2, 8);
    const d = h('dialog.dlg', { 'aria-labelledby': id }, h('h2', { id }, titel), h('div.dlg-inhalt', inhalt),
      h('div.dlg-knoepfe', knoepfe.map((k) => h('button.btn' + (k.haupt ? '.haupt' : '') + (k.gefahr ? '.gefahr' : ''), { type: 'button', onclick: () => { d.close(); d.remove(); ok(k.wert); } }, k.text))));
    d.addEventListener('cancel', () => { d.remove(); ok(null); });
    document.body.append(d);
    d.showModal();
  });
}

// Datei-Auswahl als normaler Knopf (das Browser-Feld ist je nach Sprache englisch beschriftet)
export function dateiKnopf(text, onchange, klasse = '') {
  const input = h('input.sr-only', { type: 'file', accept: '.json,application/json', onchange: async (e) => { await onchange(e); e.target.value = ''; } });
  return h('label.btn.datei-knopf' + klasse, input, icon('hoch', 18), h('span', text));
}
