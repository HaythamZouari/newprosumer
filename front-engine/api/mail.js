// Fonction serverless Vercel — envoi d'e-mails (remplace Swift_Mailer).
// Anti-relais ouvert : le destinataire n'est JAMAIS pris dans la requête, c'est MAIL_TO (défaut contact@prosumers.tn),
// comme dans l'original où toutes les notifications vont à l'administrateur.
// Variables d'environnement : RESEND_API_KEY (obligatoire), MAIL_FROM (expéditeur vérifié chez Resend), MAIL_TO.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST requis' });
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ error: 'RESEND_API_KEY non configuré' });

  const { subject, body, html, replyTo } = req.body || {};
  if (typeof subject !== 'string' || typeof body !== 'string' || !subject.trim() || !body.trim()) return res.status(400).json({ error: 'subject et body requis' });
  if (subject.length > 200 || body.length > 100000) return res.status(413).json({ error: 'message trop long' });

  const payload = {
    from: process.env.MAIL_FROM || 'Prosumers <onboarding@resend.dev>',
    to: [process.env.MAIL_TO || 'contact@prosumers.tn'],
    subject: subject.replace(/[\r\n]+/g, ' '),
    [html ? 'html' : 'text']: body,
  };
  if (typeof replyTo === 'string' && /^[^\s@]+@[^\s@]+$/.test(replyTo)) payload.reply_to = replyTo;
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) return res.status(502).json({ error: `Resend ${r.status}` });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: 'envoi impossible', detail: String(e) });
  }
}
