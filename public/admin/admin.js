(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = m => { const t = $('[data-toast]'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 4000); };

async function api(path, opt = {}) {
  const o = { method: 'GET', ...opt, headers: { 'x-admin': '1', ...(opt.headers || {}) } };
  if (opt.json !== undefined) { o.body = JSON.stringify(opt.json); o.headers['content-type'] = 'application/json'; }
  const r = await fetch('/api/admin/' + path, o);
  const j = await r.json().catch(() => ({ ok: false, error: 'Răspuns invalid de la server.' }));
  if (r.status === 401 && j.auth === false) { showLogin(); throw new Error('Sesiunea a expirat. Intră din nou.'); }
  if (!r.ok || !j.ok) throw new Error(j.error || 'Eroare ' + r.status);
  return j;
}

/* ---------- ce se poate modifica: etichetele câmpurilor ---------- */
const F = (k, label, type = 'text', hint = '') => ({ k, label, type, hint });
const SCHEMA = [
  { k: 'hero', t: 'Sus pe pagină (peste filmare)', f: [F('titlu', 'Titlu mare'), F('text', 'Text de prezentare', 'area'), F('imagine', 'Poza mică de lângă text', 'img', 'Apare doar pe calculator.')] },
  { k: 'varietati', t: 'Cardul „Varietăți de afin”', f: [F('titlu', 'Titlu'), F('text', 'Text')] },
  { k: 'formate', t: 'Formate de ghiveci', f: [F('titlu', 'Titlu secțiune'), F('text', 'Text sub titlu', 'area')],
    list: { k: 'carduri', name: i => ['Ghiveci 1', 'Ghiveci 2', 'Ghiveci 3'][i], f: [F('titlu', 'Mărime'), F('productie', 'Producție estimată'), F('eticheta', 'Text sub producție'), F('palet', 'Plante pe palet'), F('imagine', 'Poză', 'img-opt', 'Fără poză apare desenul cu ghiveciul.')] },
    after: [F('nota', 'Notă sub carduri'), F('livrare', 'Bandă verde – stânga'), F('pret', 'Bandă verde – dreapta')] },
  { k: 'productie', t: 'Cum producem plantele', f: [F('titlu', 'Titlu secțiune'), F('text', 'Text sub titlu', 'area', 'Linkul „De ce in vitro și nu butași? →” se adaugă automat la final.')],
    list: { k: 'pasi', name: i => `Pasul ${i + 1}`, f: [F('titlu', 'Titlu'), F('text', 'Text', 'area'), F('imagine', 'Poză', 'img')] } },
  { k: 'anotimpuri', t: 'Pepiniera, de-a lungul anului', f: [F('titlu', 'Titlu secțiune')],
    list: { k: 'poze', name: i => `Poza ${i + 1}`, f: [F('eticheta', 'Etichetă'), F('imagine', 'Poză', 'img')] } },
  { k: 'articole', t: 'Articole', f: [F('titlu', 'Titlu secțiune')] },
  { k: 'consultanta', t: 'Banda de consultanță (jos)', f: [F('titlu', 'Titlu'), F('text', 'Text', 'area'), F('semnatura', 'Semnătură'), F('imagine', 'Poză', 'img')] },
];

/* ---------- login ---------- */
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#loginForm [name=password]').focus(); }
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, msg = $('#loginMsg'); msg.textContent = '';
  try { await api('login', { method: 'POST', json: { password: f.password.value, code: f.code.value } }); f.reset(); start(); }
  catch (err) { msg.textContent = err.message; }
});
$('#logout').addEventListener('click', async () => { if (dirty && !confirm('Ai modificări nesalvate. Ieși oricum?')) return; await api('logout', { method: 'POST' }).catch(() => {}); location.reload(); });

/* ---------- stare ---------- */
let A = null, ORIG = '', SHA = '', dirty = false; const local = {};
const getP = (o, p) => p.split('.').reduce((x, k) => x == null ? x : x[k], o);
const setP = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };
const src = p => local[p] || (p ? '/' + p : '');
function markDirty() { dirty = JSON.stringify(A) !== ORIG; $('#savebar').hidden = !dirty; if (dirty) $('#deployNote').hidden = true; }
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

function fieldHtml(path, f) {
  const v = getP(A, path) ?? '';
  const hint = f.hint ? `<small>${esc(f.hint)}</small>` : '';
  if (f.type === 'img' || f.type === 'img-opt') {
    const th = v ? `<img src="${esc(src(v))}" alt="">` : 'Fără poză';
    return `<div class="fl" data-wrap="${path}">${esc(f.label)} ${hint}<div class="img"><div class="thumb">${th}</div><div class="acts">
      <label class="pick">Schimbă poza<input type="file" accept="image/*" hidden data-img="${path}"></label>
      ${f.type === 'img-opt' && v ? `<button class="link" type="button" data-rm="${path}">Scoate poza</button>` : ''}</div></div></div>`;
  }
  const inp = f.type === 'area' ? `<textarea class="field" data-p="${path}">${esc(v)}</textarea>` : `<input class="field" data-p="${path}" value="${esc(v)}">`;
  return `<label class="fl" data-wrap="${path}">${esc(f.label)} ${hint}${inp}</label>`;
}
function render() {
  $('#form').innerHTML = SCHEMA.map(s => {
    let h = `<section class="sec"><h2>${esc(s.t)}</h2>` + s.f.map(f => fieldHtml(`${s.k}.${f.k}`, f)).join('');
    if (s.list) h += `<div class="subs">` + getP(A, `${s.k}.${s.list.k}`).map((_, i) =>
      `<div class="sub"><h3>${esc(s.list.name(i))}</h3>` + s.list.f.map(f => fieldHtml(`${s.k}.${s.list.k}.${i}.${f.k}`, f)).join('') + `</div>`).join('') + `</div>`;
    if (s.after) h += s.after.map(f => fieldHtml(`${s.k}.${f.k}`, f)).join('');
    return h + `</section>`;
  }).join('');
  const o = JSON.parse(ORIG);
  $$('[data-wrap]').forEach(w => w.classList.toggle('changed', getP(o, w.dataset.wrap) !== getP(A, w.dataset.wrap)));
}
$('#form').addEventListener('input', e => {
  const p = e.target.dataset.p; if (!p) return;
  setP(A, p, e.target.value); markDirty();
  e.target.closest('[data-wrap]').classList.toggle('changed', getP(JSON.parse(ORIG), p) !== e.target.value);
});
$('#form').addEventListener('click', e => {
  const p = e.target.dataset.rm; if (!p) return;
  setP(A, p, ''); markDirty(); render();
});
$('#form').addEventListener('change', async e => {
  const p = e.target.dataset.img; if (!p || !e.target.files[0]) return;
  const wrap = e.target.closest('[data-wrap]'); wrap.classList.add('busy');
  try {
    const { path, url } = await uploadImage(e.target.files[0], p.split('.').filter(x => isNaN(x)).slice(0, 2).join('-'));
    local[path] = url; setP(A, p, path); markDirty(); render();
  } catch (err) { toast(err.message); wrap.classList.remove('busy'); }
});

async function uploadImage(file, base) {
  const img = await createImageBitmap(file).catch(() => { throw new Error('Fișierul nu pare să fie o poză.'); });
  const k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .85));
  const fd = new FormData(); fd.append('file', blob, 'poza.jpg'); fd.append('name', base);
  const j = await api('upload', { method: 'POST', body: fd });
  return { path: j.path, url: URL.createObjectURL(blob) };
}

async function start() {
  $('#login').hidden = true; $('#app').hidden = false;
  try { const d = await api('data'); A = d.acasa; SHA = d.sha; ORIG = JSON.stringify(A); dirty = false; $('#savebar').hidden = true; render(); }
  catch (e) { toast(e.message); }
}
$('#discard').addEventListener('click', () => { if (!confirm('Renunți la modificările nesalvate?')) return; A = JSON.parse(ORIG); markDirty(); render(); });
$('#save').addEventListener('click', async () => {
  const b = $('#save'); b.disabled = true; b.textContent = 'Se salvează…';
  try {
    const r = await api('acasa', { method: 'PUT', json: { acasa: A, sha: SHA, message: 'prima pagină' } });
    SHA = r.sha; ORIG = JSON.stringify(A); markDirty(); render(); $('#deployNote').hidden = false; scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) { toast(e.message); }
  b.disabled = false; b.textContent = 'Salvează pe site';
});

fetch('/api/admin/data', { headers: { 'x-admin': '1' } }).then(r => r.status === 401 ? showLogin() : start()).catch(showLogin);
})();
