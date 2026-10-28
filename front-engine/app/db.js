// Persistance locale : équivalent du EntityManager Doctrine + de la session PHP.
// Deux backends interchangeables : IndexedDB (navigateur) et mémoire (tests Node).
//
// Stores : users, projects (agrégat complet), kv (session, auth).
import { dehydrateProject, hydrateProject, hydrateUser, User } from './entities.js';

export class MemoryBackend {
  constructor() { this.s = { users: new Map(), projects: new Map(), kv: new Map() }; this.seq = { users: 0, projects: 0 }; }
  async get(store, key) { const v = this.s[store].get(key); return v === undefined ? undefined : structuredClone(v); }
  async put(store, value, key) {
    if (store === 'kv') { this.s.kv.set(key, structuredClone(value)); return key; }
    const rec = structuredClone(value);
    if (rec.id === null || rec.id === undefined) rec.id = ++this.seq[store];
    this.s[store].set(rec.id, rec);
    return rec.id;
  }
  async delete(store, key) { this.s[store].delete(key); }
  async all(store) { return [...this.s[store].values()].map((v) => structuredClone(v)); }
}

export class IdbBackend {
  constructor(name = 'prosumers') { this.name = name; this.dbp = null; }
  db() {
    if (!this.dbp) {
      this.dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open(this.name, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('kv');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbp;
  }
  async tx(store, mode, fn) {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const out = fn(t.objectStore(store));
      t.oncomplete = () => resolve(out.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  get(store, key) { return this.tx(store, 'readonly', (os) => os.get(key)); }
  put(store, value, key) {
    return this.tx(store, 'readwrite', (os) => {
      const v = (value.id === null || value.id === undefined) && store !== 'kv' ? (({ id, ...rest }) => rest)(value) : value;
      return store === 'kv' ? os.put(v, key) : os.put(v);
    });
  }
  delete(store, key) { return this.tx(store, 'readwrite', (os) => os.delete(key)); }
  all(store) { return this.tx(store, 'readonly', (os) => os.getAll()); }
}

/** Session PHP : lue en mémoire au démarrage, réécrite après chaque requête si modifiée. */
export class Session {
  constructor(data = {}) { this.data = data; this.dirty = false; }
  get(k, d = null) { return k in this.data ? this.data[k] : d; }
  set(k, v) { this.data[k] = v; this.dirty = true; }
  remove(k) { delete this.data[k]; this.dirty = true; }
}

export class Repo {
  constructor(backend) { this.b = backend; this.session = new Session(); }

  async boot() {
    this.session = new Session((await this.b.get('kv', 'session')) || {});
    const auth = await this.b.get('kv', 'auth');
    this.userId = auth ? auth.userId : null;
  }
  async flushSession() {
    if (this.session.dirty) { await this.b.put('kv', this.session.data, 'session'); this.session.dirty = false; }
  }

  // ---- utilisateurs ----
  async currentUser() { return this.userId ? this.findUser(this.userId) : null; }
  async setCurrentUser(user) {
    this.userId = user ? user.id : null;
    await this.b.put('kv', { userId: this.userId }, 'auth');
  }
  async findUser(id) { return hydrateUser(await this.b.get('users', id)); }
  async findUserBy(field, value) {
    return hydrateUser((await this.b.all('users')).find((u) => u[field] === value));
  }
  async saveUser(user) {
    const rec = { ...user };
    delete rec.projects;
    const id = await this.b.put('users', rec);
    user.id = id;
    return user;
  }

  // ---- projets ----
  /** `user` = instance partagée avec `app.user` (le template compare `app.user == project.user`). */
  async findProjectsByUser(user) {
    const uid = user ? user.id : null;
    return (await this.b.all('projects')).filter((r) => r.userId === uid).map((r) => hydrateProject(r, user));
  }
  async findProject(id) {
    const rec = await this.b.get('projects', typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id);
    if (!rec) return null;
    return hydrateProject(rec, rec.userId ? await this.findUser(rec.userId) : null);
  }
  async saveProject(project) {
    const rec = dehydrateProject(project);
    const id = await this.b.put('projects', rec);
    project.id = id;
    return project;
  }
  async removeProject(id) { await this.b.delete('projects', typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id); }
}

export { User };
