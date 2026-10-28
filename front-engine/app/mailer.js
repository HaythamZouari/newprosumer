// Envoi d'e-mails (Swift_Mailer dans l'original). Sans serveur SMTP, on passe par la fonction
// serverless /api/mail ; si elle est indisponible (mode local), le message est conservé dans la
// boîte d'envoi locale (kv 'outbox') afin de ne rien perdre.
export class Mailer {
  constructor({ repo, twig, fetchImpl = (...a) => globalThis.fetch(...a) }) {
    this.repo = repo; this.twig = twig; this.fetch = fetchImpl;
  }
  async send(msg) {
    try {
      const r = await this.fetch('/api/mail', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(msg) });
      if (r.ok) return true;
    } catch { /* indisponible */ }
    const outbox = (await this.repo.b.get('kv', 'outbox')) || [];
    outbox.push({ ...msg, at: new Date().toISOString() });
    await this.repo.b.put('kv', outbox, 'outbox');
    return false;
  }
  /** Mailer::sendConfirmationEmail : envoyé à l'administrateur (contact@prosumers.tn), pas à l'utilisateur. */
  async sendConfirmationEmail(user) {
    const body = this.twig.render('email/registration.html.twig', { user });
    return this.send({ subject: 'Bienvenue à Prosumers!', to: 'contact@prosumers.tn', body, html: true });
  }
}
