import { verifyPassword, verifyTotp, makeSession, cookieHeader, json } from '../../_lib/auth.js';
// Autentificare: parolă + cod 2FA. Fără bază de date: întârziere la fiecare încercare greșită
// (codul 2FA se schimbă la 30 s, deci ghicirea prin încercări repetate nu e practică).
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD_HASH || !env.ADMIN_TOTP_SECRET || !env.SESSION_SECRET) return json({ ok: false, error: 'Panoul nu este configurat.' }, 500);
  if (request.headers.get('x-admin') !== '1') return json({ ok: false, error: 'Cerere respinsă.' }, 403);
  let b = {}; try { b = await request.json(); } catch {}
  const ok = (await verifyPassword(b.password, env.ADMIN_PASSWORD_HASH)) & (await verifyTotp(String(b.code || '').trim(), env.ADMIN_TOTP_SECRET));
  if (!ok) { await new Promise(r => setTimeout(r, 1500)); return json({ ok: false, error: 'Parolă sau cod greșit.' }, 401); }
  return json({ ok: true }, 200, { 'set-cookie': cookieHeader(await makeSession(env.SESSION_SECRET), 12 * 3600) });
}
