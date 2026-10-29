// Lecteur de dump mysqldump : CREATE TABLE (colonnes) + INSERT INTO … VALUES (…),(…); -> { table: { columns, rows } }.
const ESC = { n: '\n', r: '\r', t: '\t', 0: '\0', b: '\b', Z: '\x1a' };

export function parseDump(sql) {
  const tables = {};
  for (const m of sql.matchAll(/CREATE TABLE `([^`]+)` \(([\s\S]*?)\n\)[^;]*;/g)) {
    const columns = [...m[2].matchAll(/^\s*`([^`]+)`/gm)].map((x) => x[1]);
    tables[m[1]] = { columns, rows: [] };
  }
  const re = /INSERT INTO `([^`]+)`(?:\s*\(([^)]*)\))?\s*VALUES\s*/g;
  let m;
  while ((m = re.exec(sql))) {
    const t = (tables[m[1]] ||= { columns: [], rows: [] });
    if (m[2]) t.columns = m[2].split(',').map((c) => c.trim().replace(/`/g, ''));
    let i = re.lastIndex;
    for (;;) {
      while (/\s/.test(sql[i])) i++;
      if (sql[i] !== '(') break;
      i++;
      const row = [];
      for (;;) {
        while (sql[i] === ' ') i++;
        const c = sql[i];
        if (c === "'") {
          let s = ''; i++;
          for (;;) {
            const ch = sql[i];
            if (ch === '\\') { const n = sql[i + 1]; s += n in ESC ? ESC[n] : n; i += 2; } else if (ch === "'") { if (sql[i + 1] === "'") { s += "'"; i += 2; } else { i++; break; } } else { s += ch; i++; }
          }
          row.push(s);
        } else {
          let j = i; while (sql[j] !== ',' && sql[j] !== ')') j++;
          const tok = sql.slice(i, j).trim(); i = j;
          row.push(/^NULL$/i.test(tok) ? null : /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(tok) ? Number(tok) : tok);
        }
        if (sql[i] === ',') { i++; continue; }
        if (sql[i] === ')') { i++; break; }
      }
      t.rows.push(row);
      while (sql[i] === ' ') i++;
      if (sql[i] === ',') { i++; continue; }
      break;
    }
  }
  const out = {};
  for (const [name, t] of Object.entries(tables)) out[name] = { columns: t.columns, rows: t.rows.map((r) => Object.fromEntries(t.columns.map((c, k) => [c, r[k]]))) };
  return out;
}
