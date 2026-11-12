import { json } from '../../_lib/auth.js';
import { ghGet, ghPut } from '../../_lib/gh.js';
// Salvează textele și pozele primei pagini. Structura rămâne cea din depozit:
// se acceptă doar câmpurile care există deja, ca text simplu, iar pozele doar din folderul assets/.
const IMG = /^assets\/[a-z0-9][a-z0-9._\/-]{0,120}\.(jpg|jpeg|png|webp)$/i;
export function clean(cur, inc, path) {
  if (Array.isArray(cur)) {
    if (!Array.isArray(inc) || inc.length !== cur.length) throw new Error(`Structură greșită la ${path}.`);
    return cur.map((c, i) => clean(c, inc[i], `${path}[${i}]`));
  }
  if (cur && typeof cur === 'object') {
    if (!inc || typeof inc !== 'object') throw new Error(`Structură greșită la ${path}.`);
    const out = {}; for (const k of Object.keys(cur)) out[k] = clean(cur[k], inc[k], path ? `${path}.${k}` : k); return out;
  }
  let v = String(inc ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (/(^|\.)imagine$/.test(path)) {
    if (v === '' && (cur === '' || /^formate\.carduri\[\d+\]\.imagine$/.test(path))) return ''; // pozele de la ghivece sunt opționale
    if (!IMG.test(v) || v.includes('..')) throw new Error(`Poză invalidă la ${path}.`);
    return v;
  }
  if (v.length > 600) throw new Error(`Textul de la ${path} e prea lung (max. 600 de caractere).`);
  return v;
}
export async function onRequestPut({ request, env }) {
  const b = await request.json();
  const cur = await ghGet(env, 'data/acasa.json');
  const acasa = clean(JSON.parse(cur.text), b.acasa, '');
  const sha = await ghPut(env, 'data/acasa.json', JSON.stringify(acasa, null, 2) + '\n', 'Panou: ' + String(b.message || 'prima pagină').slice(0, 100), b.sha);
  return json({ ok: true, sha });
}
