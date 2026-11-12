"""Construiește site-ul în dist/: copiază public/ și generează prima pagină din templates/index.html + data/acasa.json.
Rulare: pip install jinja2 && python3 build/build.py"""
import json, shutil, pathlib
from jinja2 import Environment, FileSystemLoader, select_autoescape, StrictUndefined

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
if DIST.exists():
    shutil.rmtree(DIST)
shutil.copytree(ROOT / 'public', DIST)

data = json.loads((ROOT / 'data' / 'acasa.json').read_text(encoding='utf-8'))
env = Environment(loader=FileSystemLoader(ROOT / 'templates'), autoescape=select_autoescape(['html']),
                  undefined=StrictUndefined, keep_trailing_newline=True)
(DIST / 'index.html').write_text(env.get_template('index.html').render(**data), encoding='utf-8')
print('Gata: dist/ generat.')
