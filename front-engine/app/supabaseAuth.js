// Authentification Supabase : même interface que LocalAuth (attempt / encodePassword) + register / approve.
// Le nom d'utilisateur reste l'identifiant de connexion (comme l'original) : l'e-mail est retrouvé via la fonction SQL
// email_for_username. Un compte reste DÉSACTIVÉ tant que l'administrateur n'a pas ouvert le lien /confirm/{token}.
import { User } from './entities.js';

export class SupabaseAuth {
  constructor({ repo, sb, sync, fetchImpl = (...a) => globalThis.fetch(...a) }) { this.repo = repo; this.sb = sb; this.sync = sync; this.fetch = fetchImpl; }

  async encodePassword() { return ''; } // le mot de passe n'est jamais stocké côté application

  async attempt(username, password) {
    const email = await this.sb.rpc('email_for_username', { u: username });
    if (!email) return { error: 'Invalid credentials.' }; // même message que pour un mauvais mot de passe (hide_user_not_found)
    const res = await this.sb.signIn(email, password);
    if (res.error) return { error: res.error };
    const uid = res.user.id;
    const [profile] = await this.sb.select('profiles', `id=eq.${uid}&select=username,full_name,societe,img_url,roles,enabled`).catch(() => []);
    if (!profile || !profile.enabled) { this.sb.signOut(); return { error: 'Account is disabled.' }; }
    let user = await this.repo.findUser(uid);
    if (!user) user = new User();
    user.id = uid;
    user.setUsername(profile.username).setEmail(email).setFullName(profile.full_name).setSociete(profile.societe);
    user.roles = profile.roles || ['ROLE_USER'];
    user.enabled = true; user.password = ''; user.plainPassword = null;
    await this.repo.saveUser(user);
    if (this.sync) await this.sync.pull().catch(() => {});
    return { user };
  }

  /** Inscription : crée le compte Supabase (profil désactivé par déclencheur SQL). */
  async register(user, plain) {
    const r = await this.sb.signUp(user.getEmail(), plain, {
      username: user.getUsername(), full_name: user.getFullName(), societe: user.getSociete(), confirmation_token: user.getConfirmationToken(),
    });
    return r.error ? { error: r.error } : { ok: true };
  }

  /** Lien /confirm/{token} : active le compte via la fonction serverless (clé service côté serveur). */
  async approve(token) {
    const r = await this.fetch('/api/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
    return r.ok;
  }
  logout() { this.sb.signOut(); }

  /** Service d'administration des comptes (api/admin-users.js) : la vérification ROLE_ADMIN est faite côté serveur. */
  get remoteUsers() {
    const call = async (qs, init = {}) => {
      const r = await this.fetch(`/api/admin-users${qs}`, { ...init, headers: { 'content-type': 'application/json', authorization: `Bearer ${this.sb.session?.access_token}` } });
      if (!r.ok) throw new Error(`admin-users: HTTP ${r.status}`);
      return r.json();
    };
    return {
      list: async () => (await call('')).map((p) => ({ id: p.id, username: p.username, fullName: p.full_name, societe: p.societe, enabled: p.enabled, roles: p.roles, abon1: p.abon1, abon2: p.abon2 })),
      update: (id, u) => call(`?id=${id}`, { method: 'PATCH', body: JSON.stringify({ username: u.username, full_name: u.fullName, societe: u.societe, enabled: u.enabled, roles: u.roles, abon1: u.abon1, abon2: u.abon2 }) }),
      remove: (id) => call(`?id=${id}`, { method: 'DELETE' }),
    };
  }
}
