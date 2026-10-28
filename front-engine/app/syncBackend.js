// Backend « écriture différée » : le navigateur reste la source de lecture rapide (IndexedDB), chaque modification
// d'un projet est répercutée dans Supabase (table np_docs, RLS par utilisateur) et les fichiers importés dans le bucket
// privé `uploads/<uid>/…`. Au login, `pull()` récupère les projets de l'utilisateur (autre appareil, cache vidé…).
//
// Identifiants : en mode Supabase les projets reçoivent un id TEXTE aléatoire (les compteurs locaux 1,2,3… de deux
// appareils se télescoperaient).
const rid = () => 'p' + Array.from(globalThis.crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 12);

export class SyncBackend {
  constructor(inner, sb) { this.inner = inner; this.sb = sb; this.pending = Promise.resolve(); this.errors = []; }

  /** Les écritures distantes sont sérialisées ; une erreur est mémorisée (nouvel essai à la prochaine écriture) sans bloquer l'UI. */
  queue(fn) {
    this.pending = this.pending.then(fn).catch((e) => { this.errors.push(String(e && e.message || e)); });
    return this.pending;
  }
  flush() { return this.pending; }

  get(store, key) { return this.inner.get(store, key); }
  all(store) { return this.inner.all(store); }

  async put(store, value, key) {
    if (store === 'projects' && (value.id === null || value.id === undefined)) value = { ...value, id: rid() };
    const id = await this.inner.put(store, value, key);
    const uid = this.sb.uid;
    if (!uid) return id;
    if (store === 'projects') {
      const doc = { ...value, id, userId: uid };
      this.queue(() => this.sb.upsert('np_docs', { user_id: uid, kind: 'project', id: String(id), value: doc, updated_at: new Date().toISOString() }));
    } else if (store === 'kv' && typeof key === 'string' && key.startsWith('file:') && value && value.buf) {
      const path = `${uid}/${key.slice(5)}`;
      this.queue(() => this.sb.upload('uploads', path, new Blob([value.buf], { type: value.type }), value.type));
    }
    return id;
  }
  async delete(store, key) {
    await this.inner.delete(store, key);
    const uid = this.sb.uid;
    if (uid && store === 'projects') this.queue(() => this.sb.remove('np_docs', `user_id=eq.${uid}&kind=eq.project&id=eq.${encodeURIComponent(String(key))}`));
  }

  /** Récupère les projets distants ABSENTS en local (une copie locale existante est la plus récente : elle est répliquée à chaque écriture). */
  async pull() {
    const uid = this.sb.uid;
    if (!uid) return 0;
    const rows = await this.sb.select('np_docs', `kind=eq.project&select=id,value,updated_at`);
    let n = 0;
    for (const r of rows) {
      const local = await this.inner.get('projects', r.id);
      if (local) continue;
      await this.inner.put('projects', { ...r.value, id: r.id, userId: uid });
      n++;
    }
    return n;
  }
}
