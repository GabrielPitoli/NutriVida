"""Gera src/data/products-br.json a partir do export público do Open Food Facts (licença ODbL).
Mantém só produtos vendidos no Brasil, com código EAN e calorias, ordenados pelos mais escaneados.
Uso: curl -sL <csv.gz> | gunzip | python3 scripts/build-products.py"""
import csv, json, sys, os
csv.field_size_limit(10**8)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
r = csv.reader(sys.stdin, delimiter='\t')
head = next(r); ix = {h: i for i, h in enumerate(head)}
need = ['code', 'product_name', 'brands', 'countries_tags', 'nutriscore_grade', 'energy-kcal_100g', 'energy_100g', 'proteins_100g',
        'carbohydrates_100g', 'fat_100g', 'fiber_100g', 'sugars_100g', 'saturated-fat_100g', 'sodium_100g', 'serving_quantity', 'unique_scans_n', 'nova_group']
missing = [n for n in need if n not in ix]
print('faltando colunas', missing, file=sys.stderr)
def g(row, k):
    i = ix.get(k); return row[i] if i is not None and i < len(row) else ''
def f(v):
    try: x = float(v); return x if x == x and 0 <= x < 5000 else None
    except: return None
out, seen, n = [], set(), 0
for row in r:
    n += 1
    if n % 500000 == 0: print('linhas', n, 'br', len(out), file=sys.stderr, flush=True)
    if 'en:brazil' not in g(row, 'countries_tags'): continue
    code = g(row, 'code').strip()
    if not code.isdigit() or not 8 <= len(code) <= 14 or code in seen: continue
    kcal = f(g(row, 'energy-kcal_100g'))
    if kcal is None:
        kj = f(g(row, 'energy_100g')); kcal = kj / 4.184 if kj else None
    name = g(row, 'product_name').replace('\ufffd', '').strip()
    if kcal is None or not name or kcal > 950: continue
    seen.add(code)
    r1 = lambda k: round(f(g(row, k)) or 0, 1)
    sod = f(g(row, 'sodium_100g'))
    item = [code, name[:70], (g(row, 'brands').split(',')[0].strip())[:30], round(kcal), r1('proteins_100g'), r1('carbohydrates_100g'), r1('fat_100g'),
            r1('fiber_100g'), r1('sugars_100g'), r1('saturated-fat_100g'), round(sod * 1000) if sod is not None else None,
            (g(row, 'nutriscore_grade') or '').strip()[:1] or None, round(f(g(row, 'serving_quantity')) or 0) or None, int(f(g(row, 'unique_scans_n')) or 0)]
    out.append(item)
out.sort(key=lambda x: -x[-1])
out = [x[:-1] for x in out[:25000]]
json.dump({'source': 'Open Food Facts (ODbL) — openfoodfacts.org', 'fields': ['code', 'name', 'brand', 'kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'satfat', 'sodiumMg', 'nutriscore', 'servingG'], 'items': out},
          open(os.path.join(ROOT, 'src/data/products-br.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('total linhas', n, 'produtos BR', len(out), file=sys.stderr)
