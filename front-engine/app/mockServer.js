// "Serveur" dans le navigateur : intercepte XMLHttpRequest pour les URL qui correspondent à une route
// de l'application et répond avec ce que renvoyait le contrôleur PHP. jQuery ($.ajax) et Dropzone,
// qui utilisent XHR, continuent donc de fonctionner SANS modification.
//
// Les requêtes vers d'autres origines ou vers des fichiers statiques passent au vrai XHR.
import { match } from './routes.js';
import { Request, parseBody, parseQueryString } from './http.js';

const STATUS_TEXT = { 200: 'OK', 302: 'Found', 404: 'Not Found', 500: 'Internal Server Error', 501: 'Not Implemented' };

export function installMockServer({ kernel, currentPagePath, mode }) {
  const proto = XMLHttpRequest.prototype;
  const orig = {
    open: proto.open, send: proto.send, setRequestHeader: proto.setRequestHeader,
    getResponseHeader: proto.getResponseHeader, getAllResponseHeaders: proto.getAllResponseHeaders, abort: proto.abort,
  };

  /** -> chemin applicatif si l'URL doit être servie par le noyau, sinon null */
  function route(method, rawUrl) {
    let u;
    try { u = new URL(rawUrl, document.baseURI); } catch { return null; }
    if (u.origin !== location.origin) return null;
    let path = u.pathname;
    // mode hash : un POST vers la page elle-même (action="./#project-7", ancre retirée par jQuery)
    if (mode === 'hash' && method === 'POST' && path === location.pathname) path = currentPagePath();
    return match(method, path) ? { path, search: u.search } : null;
  }

  proto.open = function (method, url, ...rest) {
    const m = String(method).toUpperCase();
    const hit = route(m, url);
    if (hit) { this.__np = { method: m, url: String(url), hit, headers: {}, aborted: false }; return undefined; }
    this.__np = null;
    return orig.open.call(this, method, url, ...rest);
  };
  proto.setRequestHeader = function (k, v) {
    if (this.__np) { this.__np.headers[String(k).toLowerCase()] = v; return undefined; }
    return orig.setRequestHeader.call(this, k, v);
  };
  proto.getResponseHeader = function (k) {
    if (this.__np) return this.__np.respHeaders ? (this.__np.respHeaders[String(k).toLowerCase()] ?? null) : null;
    return orig.getResponseHeader.call(this, k);
  };
  proto.getAllResponseHeaders = function () {
    if (this.__np) return Object.entries(this.__np.respHeaders || {}).map(([k, v]) => `${k}: ${v}`).join('\r\n');
    return orig.getAllResponseHeaders.call(this);
  };
  proto.abort = function () {
    if (this.__np) { this.__np.aborted = true; return undefined; }
    return orig.abort.call(this);
  };

  proto.send = function (body) {
    const np = this.__np;
    if (!np) return orig.send.call(this, body);

    const xhr = this;
    const { request: reqBody, files } = parseBody(body);
    const query = parseQueryString(np.hit.search);
    const request = new Request({
      method: np.method, path: np.hit.path, query, request: reqBody, files,
      headers: { 'x-requested-with': np.headers['x-requested-with'] || '', ...np.headers },
    });

    const finish = (res) => {
      if (np.aborted) return;
      const text = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
      np.respHeaders = Object.fromEntries(Object.entries(res.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
      const rt = xhr.responseType;
      let response = text;
      if (rt === 'json') { try { response = JSON.parse(text); } catch { response = null; } }
      Object.defineProperties(xhr, {
        readyState: { value: 4, configurable: true },
        status: { value: res.status, configurable: true },
        statusText: { value: STATUS_TEXT[res.status] || '', configurable: true },
        responseText: { value: rt === '' || rt === 'text' ? text : '', configurable: true },
        response: { value: response, configurable: true },
        responseURL: { value: np.url, configurable: true },
      });
      xhr.dispatchEvent(new Event('readystatechange'));
      xhr.dispatchEvent(new ProgressEvent('load'));
      xhr.dispatchEvent(new ProgressEvent('loadend'));
    };
    const fail = (err) => {
      console.error('[mock server]', err);
      finish({ status: 500, headers: { 'content-type': 'application/json' }, body: { error: String(err && err.message || err) } });
    };

    // Réponse asynchrone, comme un vrai appel réseau.
    setTimeout(() => { kernel.handle(request).then(finish, fail); }, 0);
    return undefined;
  };

  return () => { Object.assign(proto, orig); };
}
