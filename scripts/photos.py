"""Baixa fotos das receitas via Openverse (licenças livres CC BY / BY-SA / CC0 / domínio público)
e gera src/data/photoCredits.json com autor e licença.
Uso: python3 scripts-photos.py            -> receitas sem foto
     python3 scripts-photos.py id=termo#2 -> refaz uma receita com outro termo / outro resultado"""
import json, re, subprocess, sys, time, urllib.parse, urllib.request, os
UA = 'NutriVidaBuild/1.0 (educational nutrition app; one-off script fetching ~45 freely licensed photos)'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/recipes')
CRED = os.path.join(ROOT, 'src/data/photoCredits.json')
TMP = '/tmp/claude-0/-home-user/36ed5a2e-d8e6-513f-8607-51a2d473e135/scratchpad/'
LIC = {'by': 'CC BY', 'by-sa': 'CC BY-SA', 'cc0': 'CC0', 'pdm': 'Domínio público'}

def get(url, binary=False):
    for i in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40) as r:
                data = r.read(); return data if binary else json.loads(data)
        except Exception as e:
            print('  retry', i, e); time.sleep(10 + i * 20)
    raise RuntimeError('falhou ' + url)

def search(term, skip=0):
    q = urllib.parse.urlencode({'q': term, 'license': 'by,by-sa,cc0,pdm', 'page_size': 20, 'mature': 'false'})
    res = get('https://api.openverse.org/v1/images/?' + q).get('results', [])
    good = [r for r in res if (r.get('width') or 0) >= 500 and (r.get('height') or 1) and r['width'] >= r['height'] * 1.05]
    return good[skip] if len(good) > skip else None

def main():
    src = open(os.path.join(ROOT, 'src/data/recipes.js')).read()
    recipes = dict(re.findall(r"id: '([^']+)', photo: '([^']+)'", src))
    creds = json.load(open(CRED)) if os.path.exists(CRED) else {}
    jobs = {}
    for a in sys.argv[1:]:
        k, _, v = a.partition('='); skip = 0
        if '#' in v: v, skip = v.split('#'); skip = int(skip)
        jobs[k] = (v or recipes[k], skip)
    if not jobs: jobs = {k: (v, 0) for k, v in recipes.items() if k not in creds}
    for rid, (term, skip) in jobs.items():
        print(rid, '->', term, flush=True)
        try:
            hit = search(term, skip)
            if not hit: print('  sem resultado'); continue
            raw = get(hit['thumbnail'], binary=True)
        except Exception as e:
            print('  pulando', e); continue
        open(TMP + rid + '.img', 'wb').write(raw)
        subprocess.run(['convert', TMP + rid + '.img', '-auto-orient', '-resize', '640x420^', '-gravity', 'center', '-extent', '640x420', '-strip', '-quality', '70', f'{OUT}/{rid}.webp'], check=True)
        creds[rid] = {'title': hit['title'][:90], 'artist': (hit.get('creator') or 'Autor desconhecido')[:60],
                      'license': f"{LIC.get(hit['license'], hit['license'].upper())} {hit.get('license_version') or ''}".strip(),
                      'licenseUrl': hit.get('license_url'), 'page': hit.get('foreign_landing_url'), 'source': hit.get('source')}
        json.dump(creds, open(CRED, 'w'), ensure_ascii=False, indent=1)
        time.sleep(3.5)

main()
