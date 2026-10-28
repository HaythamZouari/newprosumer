// Service « producers » du noyau : appels aux proxies serverless (/api/pvgis, /api/ninja) qui
// remplacent les requêtes HttpClient du ProductionController PHP (CORS + jeton ninja côté serveur).
async function getJson(path, params, base) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null)));
  const r = await fetch(`${base}${path}?${qs}`);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `${path} : HTTP ${r.status}`);
  return body;
}

export function createProducers(base = '') {
  return {
    pvgis: (f) => getJson('/api/pvgis', { ...f, raw: 1 }, base),
    ninja: (f) => getJson('/api/ninja', f, base),
  };
}
