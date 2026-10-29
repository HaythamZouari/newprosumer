// Environnement Twig (Twig.js) : reproduit ce que Symfony fournit aux templates d'origine
// (fonctions path()/asset()/csrf_token()/form_*(), filtre trans, variable globale `app`).
import { urlFor } from './routes.js';

const BASE_LAYOUT = 'base.html.twig';

/** Noms des templates référencés (extends/include) -> pour n'enregistrer que le nécessaire. */
function deps(src) {
  const out = new Set();
  for (const m of src.matchAll(/\{%\s*(?:extends|include|embed)\s+['"]([^'"]+)['"]/g)) out.add(m[1]);
  return [...out];
}

export class TwigEnv {
  /**
   * @param {object} Twig        global Twig (twig.min.js)
   * @param {object} templates   { 'base.html.twig': source, ... } (déjà prétraitées)
   * @param {object} opts        { mode: 'hash'|'clean', formRenderer }
   */
  constructor(Twig, templates, { mode = 'hash', forms = null } = {}) {
    this.Twig = Twig;
    this.templates = templates;
    this.mode = mode;
    this.registered = new Set();
    Twig.cache(true); // le registre par id sert à résoudre extends/include en mémoire
    // Équivalent de Twig.Markup (interne à Twig.js) : chaîne marquée sûre, donc non ré-échappée.
    const safe = (html) => { const o = new String(html); o.twigMarkup = 'html'; return o; };

    Twig.extendFunction('path', (name, params) => urlFor(mode, name, params || {}));
    Twig.extendFunction('url', (name, params) => urlFor(mode, name, params || {}));
    Twig.extendFunction('asset', (p) => (mode === 'clean' ? `/${p}` : p));
    // La protection CSRF n'a pas de sens sans serveur : jeton factice mais présent dans le HTML.
    Twig.extendFunction('csrf_token', (id) => `np-${id}`);
    Twig.extendFilter('trans', (msg) => msg);

    if (forms) {
      Twig.extendFunction('form_start', (f) => safe(forms.start(f)));
      Twig.extendFunction('form_widget', (f) => safe(forms.widget(f)));
      Twig.extendFunction('form_end', (f) => safe(forms.end(f)));
    }
  }

  register(name) {
    if (this.registered.has(name)) return;
    const src = this.templates[name];
    if (src === undefined) throw new Error(`Template introuvable : ${name}`);
    this.registered.add(name);
    for (const d of deps(src)) this.register(d);
    this.Twig.twig({ id: name, data: src, autoescape: true, rethrow: true, allowInlineIncludes: true });
  }

  /** Rend `name` avec `context` ; renvoie une chaîne HTML complète. */
  render(name, context) {
    this.register(name);
    return this.Twig.twig({ ref: name }).render(context);
  }
}

export { BASE_LAYOUT };
