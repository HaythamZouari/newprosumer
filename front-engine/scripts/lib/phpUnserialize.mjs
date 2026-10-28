// unserialize() de PHP (colonnes Doctrine `type="array"`) -> valeurs JS.
// Tableau PHP à clés 0..n-1 -> tableau JS ; sinon objet. Objet PHP (DateTime…) -> objet des propriétés publiques
// (ce que json_encode produisait côté PHP, et donc la forme que l'application porte attend).
export function unserialize(text) {
  const buf = Buffer.from(String(text), 'utf8');
  let i = 0;
  const readUntil = (ch) => { const j = buf.indexOf(ch, i); if (j < 0) throw new Error(`unserialize: '${ch}' attendu à ${i}`); const s = buf.toString('latin1', i, j); i = j + 1; return s; };
  const expect = (ch) => { if (String.fromCharCode(buf[i]) !== ch) throw new Error(`unserialize: '${ch}' attendu à ${i}, trouvé '${String.fromCharCode(buf[i])}'`); i++; };
  function value() {
    const t = String.fromCharCode(buf[i]); i++;
    switch (t) {
      case 'N': expect(';'); return null;
      case 'b': expect(':'); return readUntil(';') === '1';
      case 'i': expect(':'); return Number(readUntil(';'));
      case 'd': { expect(':'); const s = readUntil(';'); return s === 'INF' ? Infinity : s === '-INF' ? -Infinity : s === 'NAN' ? NaN : Number(s); }
      case 's': { expect(':'); const n = Number(readUntil(':')); expect('"'); const s = buf.toString('utf8', i, i + n); i += n; expect('"'); expect(';'); return s; }
      case 'a': {
        expect(':'); const n = Number(readUntil(':')); expect('{');
        const entries = [];
        for (let k = 0; k < n; k++) entries.push([value(), value()]);
        expect('}');
        return entries.every(([key], idx) => key === idx) ? entries.map(([, v]) => v) : Object.fromEntries(entries.map(([k, v]) => [k, v]));
      }
      case 'O': {
        expect(':'); readUntil(':'); expect('"'); readUntil('"'); expect(':');
        const n = Number(readUntil(':')); expect('{');
        const o = {};
        for (let k = 0; k < n; k++) { const key = String(value()).replace(/^\0[^\0]*\0/, ''); o[key] = value(); }
        expect('}');
        return o;
      }
      default: throw new Error(`unserialize: type '${t}' inconnu à ${i - 1}`);
    }
  }
  return value();
}
