// Équivalents minimaux de Symfony HttpFoundation : Request, Response, parsing PHP des paramètres.

/**
 * Parse des paires clé/valeur au format PHP : a=1, a[b]=2, a[b][c]=3, a[]=4 -> structure imbriquée.
 * Les groupes sont des objets (clés numériques conservées en chaînes), comme les tableaux PHP.
 */
export function parsePhpParams(pairs) {
  const out = {};
  for (const [rawKey, value] of pairs) {
    const m = String(rawKey).match(/^([^[\]]+)((?:\[[^[\]]*\])*)$/);
    if (!m) { out[rawKey] = value; continue; }
    const path = [m[1], ...[...m[2].matchAll(/\[([^[\]]*)\]/g)].map((x) => x[1])];
    let cur = out;
    for (let i = 0; i < path.length; i++) {
      const last = i === path.length - 1;
      let k = path[i];
      if (k === '') { k = Object.keys(cur).filter((x) => /^\d+$/.test(x)).length; }
      if (last) cur[k] = value;
      else {
        if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
        cur = cur[k];
      }
    }
  }
  return out;
}

export function parseQueryString(qs) {
  const s = String(qs || '').replace(/^\?/, '');
  if (!s) return {};
  return parsePhpParams(s.split('&').filter(Boolean).map((kv) => {
    const i = kv.indexOf('=');
    const dec = (x) => decodeURIComponent(x.replace(/\+/g, ' '));
    return i < 0 ? [dec(kv), ''] : [dec(kv.slice(0, i)), dec(kv.slice(i + 1))];
  }));
}

/** Corps de requête : chaîne urlencodée ou FormData -> { request, files }. */
export function parseBody(body) {
  if (body === null || body === undefined) return { request: {}, files: {} };
  if (typeof body === 'string') return { request: parseQueryString(body), files: {} };
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return { request: parseQueryString(body.toString()), files: {} };
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const pairs = []; const files = {};
    for (const [k, v] of body.entries()) {
      if (typeof File !== 'undefined' && v instanceof File) files[k] = v; else pairs.push([k, v]);
    }
    return { request: parsePhpParams(pairs), files };
  }
  return { request: {}, files: {} };
}

export class Request {
  constructor({ method = 'GET', path = '/', query = {}, request = {}, files = {}, headers = {}, params = {} } = {}) {
    this.method = method.toUpperCase();
    this.path = path;
    this.query = query;
    this.request = request;
    this.files = files;
    this.headers = headers;
    this.attributes = params;
    this.user = null;
  }
  /** Symfony Request::get : attributs de route, puis query, puis corps ; null si absent. */
  get(key, dflt = null) {
    for (const bag of [this.attributes, this.query, this.request]) {
      if (bag && Object.prototype.hasOwnProperty.call(bag, key)) return bag[key];
    }
    return dflt;
  }
  isXmlHttpRequest() { return String(this.headers['x-requested-with'] || '').toLowerCase() === 'xmlhttprequest'; }
}

export class Response {
  constructor(body = '', status = 200, headers = {}) { this.body = body; this.status = status; this.headers = headers; }
}
export const html = (body, status = 200) => new Response(body, status, { 'content-type': 'text/html; charset=UTF-8' });
export const json = (data, status = 200) => new Response(JSON.stringify(data), status, { 'content-type': 'application/json' });
export const redirect = (location, status = 302) => new Response('', status, { location });
