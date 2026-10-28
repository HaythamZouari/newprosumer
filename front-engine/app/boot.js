// Démarrage d'une page : reconstitue la requête Symfony à partir de l'URL, l'exécute dans le
// noyau local, puis écrit le HTML obtenu dans le document (les scripts d'origine s'exécutent
// alors exactement comme sur une page servie par PHP).
import { IdbBackend, Repo } from './db.js';
import { TwigEnv } from './twigEnv.js';
import { Kernel } from './kernel.js';
import { Request, parseBody, parseQueryString } from './http.js';
import { installMockServer } from './mockServer.js';
import { hashKeyToPath, pathToHashKey, match } from './routes.js';
import { Form, formRenderer } from './forms.js';
import { LocalAuth } from './auth.js';
import { Mailer } from './mailer.js';
import { CONTROLLERS } from './controllers/index.js';

const cfg = window.NP_CONFIG || { mode: 'hash' };
const RENDER_ONCE = 'np_render_once';

function currentPath() {
  if (cfg.mode === 'hash') return hashKeyToPath(location.hash.slice(1)) || '/';
  return location.pathname.replace(/\/index\.html$/, '/') || '/';
}

/** Chemin applicatif -> URL de navigation du mode courant. */
function toLocation(path) {
  if (cfg.mode === 'clean') return path;
  const key = pathToHashKey(path.split('?')[0]);
  return key ? `${location.pathname}#${key}` : path;
}

function navigate(path) {
  const target = toLocation(path);
  if (cfg.mode === 'hash') {
    // On fixe l'ancre puis on recharge explicitement : pendant le démarrage, aucun écouteur
    // `hashchange` n'est encore installé.
    location.hash = target.split('#')[1] || '';
    location.reload();
  } else if (target === location.pathname + location.search) {
    location.reload();
  } else {
    location.assign(target);
  }
}

function writeDocument(htmlText) {
  const hook = '<script>window.NP && window.NP.afterWrite && window.NP.afterWrite();</script>';
  const out = htmlText.includes('</body>') ? htmlText.replace('</body>', `${hook}</body>`) : htmlText + hook;
  document.open();
  document.write(out);
  document.close();
}

async function respond(res) {
  if (res.headers && res.headers.location) { navigate(res.headers.location); return; }
  writeDocument(res.body);
}

async function boot() {
  const backend = new IdbBackend();
  const repo = new Repo(backend);
  await repo.boot();

  const auth = new LocalAuth(repo);
  const twig = new TwigEnv(window.Twig, window.__NP_TEMPLATES__, { mode: cfg.mode, forms: formRenderer });
  const mailer = new Mailer({ repo, twig });
  const kernel = new Kernel({ repo, twig, cfg, controllers: CONTROLLERS, services: { auth, mailer, autoEnable: true } });

  installMockServer({ kernel, currentPagePath: currentPath, mode: cfg.mode });

  // En aperçu (mode hash) les boîtes de dialogue natives sont bloquées (confirm() renvoie false).
  if (cfg.mode === 'hash') window.confirm = () => true;

  // Soumission des formulaires "classiques" (login, inscription, contact, projet, suppression)
  function onSubmit(e) {
    const form = e.target;
    if (e.defaultPrevented || !(form instanceof HTMLFormElement)) return;
    const method = (form.getAttribute('method') || 'get').toUpperCase();
    if (method !== 'POST') return;
    e.preventDefault();
    const action = form.getAttribute('action') || '';
    let path;
    if (!action) path = currentPath();
    else if (action.includes('#')) path = hashKeyToPath(action.split('#')[1]) || currentPath();
    else path = new URL(action, document.baseURI).pathname;
    const fd = e.submitter ? new FormData(form, e.submitter) : new FormData(form);
    const { request, files } = parseBody(fd);
    kernel.handle(new Request({ method: 'POST', path, request, files })).then(async (res) => {
      if (res.headers && res.headers.location) { navigate(res.headers.location); return; }
      sessionStorage.setItem(RENDER_ONCE, res.body); // réaffiché après rechargement (nouveau contexte JS)
      location.reload();
    });
  }

  window.NP = {
    cfg, kernel, repo, navigate, currentPath, twig,
    afterWrite() {
      document.addEventListener('submit', onSubmit);
      if (cfg.mode === 'hash') window.addEventListener('hashchange', () => location.reload());
    },
  };

  const once = sessionStorage.getItem(RENDER_ONCE);
  if (once) { sessionStorage.removeItem(RENDER_ONCE); writeDocument(once); return; }

  const path = currentPath();
  const request = new Request({ method: 'GET', path, query: parseQueryString(location.search) });
  const res = await kernel.handle(request);
  await respond(res);
}

boot().catch((e) => {
  console.error(e);
  document.body.innerHTML = `<pre style="padding:16px;color:#b00">Erreur de démarrage : ${String(e && e.stack || e)}</pre>`;
});
