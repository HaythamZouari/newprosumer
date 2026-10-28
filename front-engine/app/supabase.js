// Client Supabase minimal (REST : GoTrue, PostgREST, Storage) — sans dépendance, pour garder le bundle statique.
// La session (jetons) est conservée dans localStorage ; un 401 déclenche un rafraîchissement unique.
export class Supabase {
  constructor({ url, key, fetchImpl = (...a) => globalThis.fetch(...a), store = null }) {
    this.url = url.replace(/\/$/, ''); this.key = key; this.fetch = fetchImpl;
    this.store = store || (() => { try { return globalThis.localStorage; } catch { return null; } })();
    this.session = null;
    try { this.session = JSON.parse(this.store?.getItem('np.supabase.session') || 'null'); } catch { /* absent */ }
  }
  setSession(s) {
    this.session = s;
    try { s ? this.store?.setItem('np.supabase.session', JSON.stringify(s)) : this.store?.removeItem('np.supabase.session'); } catch { /* privé */ }
  }
  get uid() { return this.session?.user?.id ?? null; }

  async raw(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
    const h = { apikey: this.key, ...headers };
    h.authorization = `Bearer ${auth && this.session ? this.session.access_token : this.key}`;
    if (body !== undefined && !(body instanceof Blob) && typeof body !== 'string') { h['content-type'] = 'application/json'; body = JSON.stringify(body); }
    return this.fetch(this.url + path, { method, headers: h, body });
  }
  async request(path, opts = {}) {
    let r = await this.raw(path, opts);
    if (r.status === 401 && this.session?.refresh_token && opts.auth !== false) {
      if (await this.refresh()) r = await this.raw(path, opts);
    }
    return r;
  }
  async refresh() {
    const r = await this.raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: this.session.refresh_token }, auth: false });
    if (!r.ok) { this.setSession(null); return false; }
    this.setSession(await r.json());
    return true;
  }

  // ---- Auth ----
  async signUp(email, password, data) {
    const r = await this.raw('/auth/v1/signup', { method: 'POST', body: { email, password, data }, auth: false });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { user: j.user || j } : { error: j.msg || j.error_description || j.message || `HTTP ${r.status}` };
  }
  async signIn(email, password) {
    const r = await this.raw('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password }, auth: false });
    if (!r.ok) return { error: 'Invalid credentials.' };
    this.setSession(await r.json());
    return { user: this.session.user };
  }
  signOut() { this.setSession(null); }

  // ---- PostgREST ----
  async rpc(fn, args) {
    const r = await this.request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: args, auth: false });
    return r.ok ? r.json() : null;
  }
  async select(table, query = '') {
    const r = await this.request(`/rest/v1/${table}?${query}`);
    if (!r.ok) throw new Error(`select ${table}: HTTP ${r.status}`);
    return r.json();
  }
  async upsert(table, row) {
    const r = await this.request(`/rest/v1/${table}`, { method: 'POST', body: row, headers: { prefer: 'resolution=merge-duplicates' } });
    if (!r.ok) throw new Error(`upsert ${table}: HTTP ${r.status}`);
  }
  async remove(table, query) {
    const r = await this.request(`/rest/v1/${table}?${query}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(`delete ${table}: HTTP ${r.status}`);
  }

  // ---- Storage ----
  async upload(bucket, path, blob, contentType) {
    const r = await this.request(`/storage/v1/object/${bucket}/${path}`, { method: 'POST', body: blob, headers: { 'content-type': contentType || 'application/octet-stream', 'x-upsert': 'true' } });
    if (!r.ok) throw new Error(`upload ${path}: HTTP ${r.status}`);
  }
}
