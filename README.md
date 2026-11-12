# nobilfruct.ro — site static pe Cloudflare Pages

## Structură
- `public/` — paginile (varietăți, tehnologia de cultură, calculator, contact, blog), pozele și videourile (`assets/`), panoul (`admin/`).
- `templates/index.html` + `data/acasa.json` — prima pagină. Textele și pozele ei stau în `data/acasa.json` și se modifică din panou.
- `build/build.py` — copiază `public/` în `dist/` și generează prima pagină.
- `functions/api/admin/` — panoul: autentificare, citire și salvare a conținutului, încărcare poze.

## Generare
```
pip install jinja2
python3 build/build.py        # -> dist/
```

## Panoul de administrare (/admin/)
- Autentificare: parolă + cod din aplicația de autentificare (2FA), sesiune 12 h.
- Salvarea scrie în depozitul GitHub (`data/acasa.json`, pozele în `public/assets/up/`), iar Cloudflare Pages reconstruiește site-ul automat în 1–2 minute. Fiecare salvare e un commit, deci orice modificare se poate anula.

Configurare acces: `python3 tools/setup_admin.py` → afișează `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `SESSION_SECRET` și salvează codul QR de scanat în aplicația de autentificare.

## Publicare (o singură dată)
1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → depozitul `nobilfruct`.
   Build command: `pip install jinja2 && python3 build/build.py`, output: `dist`.
2. Token GitHub „fine-grained”, doar pentru acest depozit, permisiunea Contents: Read and write → secretul `GITHUB_TOKEN`.
3. Secrete: `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `SESSION_SECRET`, `GITHUB_TOKEN`. (`GITHUB_REPO` și `GITHUB_BRANCH` sunt în `wrangler.toml`.)
4. Custom domain: nobilfruct.ro și www.
