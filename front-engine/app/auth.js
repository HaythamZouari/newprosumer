// Authentification locale (mode hors ligne / sans Supabase) : équivalent du firewall `form_login`
// de security.yaml avec le provider `entity: User, property: username`.
// Le hachage est SHA-256 salé : suffisant pour un stockage purement local, bcrypt n'étant pas
// disponible nativement dans le navigateur. En mode Supabase, c'est Supabase Auth qui prend le relais.

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  return hex(await globalThis.crypto.subtle.digest('SHA-256', data));
}

export function randomToken(length = 30) {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  globalThis.crypto.getRandomValues(bytes);
  return hex(bytes).slice(0, length);
}

export class LocalAuth {
  constructor(repo) { this.repo = repo; }

  async encodePassword(plain) {
    const salt = randomToken(16);
    return `sha256$${salt}$${await sha256(salt + plain)}`;
  }
  async isPasswordValid(user, plain) {
    const [algo, salt, h] = String(user.password || '').split('$');
    return algo === 'sha256' && (await sha256(salt + plain)) === h;
  }

  /** form_login : renvoie { user } ou { error } (messages de sécurité Symfony, locale en). */
  async attempt(username, password) {
    const user = await this.repo.findUserBy('username', username);
    // hide_user_not_found (défaut) : même message pour un utilisateur inconnu et un mauvais mot de passe
    if (!user || !(await this.isPasswordValid(user, password))) return { error: 'Invalid credentials.' };
    if (!user.enabled) return { error: 'Account is disabled.' };
    return { user };
  }
}
