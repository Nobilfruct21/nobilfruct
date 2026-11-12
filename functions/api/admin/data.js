import { json } from '../../_lib/auth.js';
import { ghGet, ghReady } from '../../_lib/gh.js';
// Conținutul curent al primei pagini, citit din depozit (sursa adevărului pentru panou).
export async function onRequestGet({ env }) {
  if (!ghReady(env)) return json({ ok: false, error: 'Legătura cu GitHub nu este configurată (GITHUB_TOKEN, GITHUB_REPO).' }, 500);
  const a = await ghGet(env, 'data/acasa.json');
  if (!a) return json({ ok: false, error: 'Lipsește data/acasa.json din depozit.' }, 500);
  return json({ ok: true, acasa: JSON.parse(a.text), sha: a.sha });
}
