// Noyau : reproduit le cycle de vie d'une requête Symfony (firewall -> routeur -> contrôleur -> réponse).
import { match } from './routes.js';
import { Request, html, json, redirect } from './http.js';

export class Kernel {
  /**
   * @param {object} deps { repo, twig, cfg, controllers, services }
   *   services : { auth, mailer, fetch } — injectés (remplaçables dans les tests)
   */
  constructor({ repo, twig, cfg = {}, controllers = {}, services = {} }) {
    this.repo = repo;
    this.twig = twig;
    this.cfg = cfg;
    this.controllers = controllers;
    this.services = services;
  }

  /** Rendu d'un template avec les variables globales de Symfony (`app`). */
  render(request, template, params = {}) {
    const app = {
      user: request.user,
      request: { get: (k) => request.get(k) },
      session: this.repo.session,
    };
    return html(this.twig.render(template, { app, ...params }));
  }

  async handle(request) {
    const { repo } = this;
    request.user = await repo.currentUser();

    // http_method_override : un POST avec _method=DELETE devient DELETE
    let method = request.method;
    if (method === 'POST' && request.request && request.request._method) method = String(request.request._method).toUpperCase();

    const hit = match(method, request.path);
    if (!hit) return html('<h1>404 Not Found</h1>', 404);

    // security.yaml -> access_control : ^/project exige ROLE_USER, ^/admin exige ROLE_ADMIN
    if (/^\/project/.test(request.path) && !request.user) {
      repo.session.set('_security.main.target_path', request.path);
      await repo.flushSession();
      return redirect('/login');
    }

    if (/^\/admin/.test(request.path)) {
      if (!request.user) { repo.session.set('_security.main.target_path', request.path); await repo.flushSession(); return redirect('/login'); }
      if (!(request.user.roles || []).includes('ROLE_ADMIN')) return html('<h1>Access Denied.</h1>', 403);
    }

    request.attributes = hit.params;
    const controller = this.controllers[hit.route.name];
    if (!controller) return json({ error: `Contrôleur non implémenté : ${hit.route.name}` }, 501);

    const ctx = {
      request,
      repo,
      session: repo.session,
      user: request.user,
      cfg: this.cfg,
      services: this.services,
      params: hit.params,
      render: (tpl, p) => this.render(request, tpl, p),
      json, redirect, html,
    };
    try {
      return await controller(ctx);
    } finally {
      await repo.flushSession();
    }
  }
}

export { Request };
