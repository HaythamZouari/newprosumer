// Contrôleurs "pages" : Dashboard, Offres, Product, Security, Register, Contact, CRUD Project.
// Chaque fonction correspond à une action des contrôleurs Symfony d'origine (src/Controller/*.php).
import { Form, validate } from '../forms.js';
import { Project, User } from '../entities.js';
import { randomToken } from '../auth.js';

// ---- DashboardController / OffresController / ProductController ----
export const dashboard = (ctx) => ctx.render('base.html.twig');
export const offres = (ctx) => ctx.render('offres/index.html.twig', { controller_name: 'OffresController' });
export const product = (ctx) => ctx.render('product/index.html.twig', { controller_name: 'ProductController' });

// ---- SecurityController ----
export async function security_login(ctx) {
  const { request, session, repo, services } = ctx;
  if (request.method === 'POST' && request.request._username !== undefined) {
    const username = String(request.request._username);
    const res = await services.auth.attempt(username, String(request.request._password ?? ''));
    session.set('_security.last_username', username);
    if (res.error) {
      session.set('_security.last_error', res.error);
      return ctx.redirect('/login');
    }
    await repo.setCurrentUser(res.user);
    session.remove('_security.last_error');
    // form_login : retour à la page demandée avant l'authentification, sinon default_target_path
    const target = request.request._target_path || session.get('_security.main.target_path') || '/project/';
    session.remove('_security.main.target_path');
    return ctx.redirect(target);
  }
  const err = session.get('_security.last_error');
  const lastUsername = session.get('_security.last_username', '');
  session.remove('_security.last_error');
  return ctx.render('security/login.html.twig', {
    last_username: lastUsername,
    error: err ? { messageKey: err, messageData: {} } : null,
  });
}

export async function security_logout(ctx) {
  await ctx.repo.setCurrentUser(null);
  return ctx.redirect('/');
}

export async function security_confirm(ctx) {
  const token = ctx.params.token;
  const user = await ctx.repo.findUserBy('confirmationToken', token);
  if (user) {
    user.enabled = true;
    user.confirmationToken = '';
    await ctx.repo.saveUser(user);
  }
  return ctx.render('security/confirmation.html.twig', { user });
}

// ---- RegisterController ----
export async function user_register(ctx) {
  const { request, repo, services } = ctx;
  const form = new Form('user', {}).handleRequest(request);
  if (form.submitted) {
    const v = form.values;
    const uniques = {
      email: !!(await repo.findUserBy('email', v.email)),
      username: !!(await repo.findUserBy('username', v.username)),
    };
    form.setErrors(validate('user', v, { uniques }));
    if (form.isValid()) {
      const user = new User();
      user.setUsername(v.username).setEmail(v.email).setFullName(v.fullName).setSociete(v.societe);
      user.setPlainPassword(v.plainPassword.first);
      user.setPassword(await services.auth.encodePassword(v.plainPassword.first));
      user.setConfirmationToken(randomToken(30));
      // En mode local il n'y a pas d'administrateur pour approuver : le compte est activé d'emblée.
      // (Avec Supabase, le compte reste désactivé jusqu'à /confirm/{token}, comme dans l'original.)
      if (services.autoEnable) user.enabled = true;
      user.plainPassword = null;
      await repo.saveUser(user);
      if (services.mailer) await services.mailer.sendConfirmationEmail(user).catch(() => {});
      return ctx.redirect('/project/');
    }
  }
  return ctx.render('register/index.html.twig', { form: form.createView() });
}

// ---- ContactController ----
export async function contact(ctx) {
  const { request, services } = ctx;
  const form = new Form('contact', {}).handleRequest(request);
  if (form.submitted) {
    form.setErrors(validate('contact', form.values));
    if (form.isValid()) {
      const d = form.values;
      if (services.mailer) await services.mailer.send({ from: d.email, to: 'contact@prosumers.tn', subject: 'Support Prosumers', body: d.message });
      return ctx.redirect('/contact');
    }
  }
  return ctx.render('contact/index.html.twig', { form: form.createView() });
}

// ---- ProjectController : CRUD ----
export async function project_index(ctx) {
  const projects = await ctx.repo.findProjectsByUser(ctx.user);
  return ctx.render('project/index.html.twig', { projects });
}

export async function project_new(ctx) {
  const { request, repo, user } = ctx;
  const project = new Project();
  const form = new Form('project', {}).handleRequest(request);
  if (form.submitted) {
    form.setErrors(validate('project', form.values));
    if (form.isValid()) {
      project.setName(form.values.name).setAdress(form.values.adress || null).setDescription(form.values.description || null);
      project.setUser(user);
      await repo.saveProject(project);
      return ctx.redirect(`/project/${project.id}`);
    }
  }
  return ctx.render('project/new.html.twig', { project, form: form.createView() });
}

export async function project_edit(ctx) {
  const { request, repo, params } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.html('<h1>404 Not Found</h1>', 404);
  const form = new Form('project', { name: project.name, adress: project.adress, description: project.description }).handleRequest(request);
  if (!form.submitted) form.values = { name: project.name, adress: project.adress, description: project.description };
  if (form.submitted) {
    form.setErrors(validate('project', form.values));
    if (form.isValid()) {
      project.setName(form.values.name).setAdress(form.values.adress || null).setDescription(form.values.description || null);
      await repo.saveProject(project);
      return ctx.redirect('/project/');
    }
  }
  return ctx.render('project/edit.html.twig', { project, form: form.createView() });
}

export async function project_delete(ctx) {
  const { request, repo, params } = ctx;
  if (request.request._token === `np-delete${params.id}`) await repo.removeProject(params.id);
  return ctx.redirect('/project/');
}

// project_show GET : page du wizard ; le POST (consommation) est porté dans controllers/project.js
export async function project_show_page(ctx) {
  const project = await ctx.repo.findProject(ctx.params.id);
  if (!project) return ctx.html('<h1>404 Not Found</h1>', 404);
  return ctx.render('project/show.html.twig', { project });
}
