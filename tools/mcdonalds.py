"""Hämta publicerade svenska McDonald's-produkter och näring per standardportion.

Kör: python tools/mcdonalds.py
Endast produktnamn, produktlänk, käll-id och näringsfakta sparas. Inga ingredienser eller bilder.
"""
import datetime
import html
import json
import math
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CALCULATOR = 'https://www.mcdonalds.com/se/sv-se/naringskalkylatorn.html'


def number(value):
    if not isinstance(value, (str, int, float)) or isinstance(value, bool):
        return None
    try:
        n = float(re.sub(r'\s', '', str(value)).replace(',', '.'))
        return n if math.isfinite(n) and n >= 0 else None
    except ValueError:
        return None


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Driv/1.0 (https://driv.driveify.se)'})
    with urllib.request.urlopen(req, timeout=35) as response:
        return response.read().decode('utf-8')


def menu_products(text):
    match = re.search(r"data-product-data='([^']+)'", text)
    if not match:
        raise ValueError('Menydatan saknas; befintlig katalog lämnas orörd.')
    menu = json.loads(html.unescape(match.group(1)))
    products = {str(k): dict(v) for k, v in menu['products'].items()}
    for product in list(products.values()):
        for size in product.get('sizes', []):
            if not isinstance(size, dict) or not str(size.get('itemId', '')).isdigit():
                continue
            pid = str(size['itemId'])
            if pid not in products:
                products[pid] = {'title': product.get('title'), 'itemPath': size.get('itemPath')}
            if size.get('itemPath'):
                products[pid]['itemPath'] = size['itemPath']
    return products


def records(items, menu, checked):
    result = []
    keys = {'energy_kcal': 'kcal', 'protein': 'protein', 'fat': 'fat', 'fibre': 'fiber'}
    for item in items:
        pid = str(item.get('id', ''))
        if pid not in menu:
            continue
        name = item.get('item_marketing_name') or item.get('item_name') or menu[pid].get('title')
        if not isinstance(name, str) or not name.strip() or re.search(r'\b(meny|happy meal)\b', name, re.I):
            continue
        facts = {}
        for nutrient in item.get('nutrient_facts', {}).get('nutrient', []):
            key = keys.get(nutrient.get('nutrient_name_id'))
            if key:
                n = number(nutrient.get('value'))  # Det visade portionsvärdet, inte per 100 g/raw_value.
                if n is not None:
                    facts[key] = n
        if facts.get('kcal') is None or facts.get('protein') is None:
            continue
        path = menu[pid].get('itemPath')
        slug = item.get('short_name')
        if isinstance(path, str) and path.startswith('/content/mcdonalds/se/sv-se/product/'):
            url = 'https://www.mcdonalds.com' + path.removeprefix('/content/mcdonalds') + '.html'
        elif isinstance(slug, str) and re.fullmatch(r'[\w-]+', slug):
            url = 'https://www.mcdonalds.com/se/sv-se/product/' + slug + '.html'
        else:
            url = CALCULATOR
        result.append({'id': 'mcd-se-' + pid, 'chain': "McDonald's", 'name': name.strip(),
                       'per_portion': facts, 'source_url': url, 'checked_at': checked})
    return result


def main():
    menu = menu_products(get(CALCULATOR))
    ids = sorted(menu)
    def batch(chunk):
        query = urllib.parse.urlencode(dict(country='SE', language='sv', showLiveData='true', nutrient_req='Y', item=''.join(pid + '()-' for pid in chunk)))
        data = json.loads(get('https://www.mcdonalds.com/dnaapp/itemList?' + query))
        items = data['items']['item']
        return items if isinstance(items, list) else [items]
    chunks = [ids[i:i+30] for i in range(0, len(ids), 30)]
    with ThreadPoolExecutor(max_workers=2) as pool:
        items = [item for group in pool.map(batch, chunks) for item in group]
    checked = datetime.date.today().isoformat()
    rows = records(items, menu, checked)
    if len(rows) < 20:
        raise ValueError('Oväntat få produkter; befintlig katalog lämnas orörd.')
    data = {'source': "McDonald's Sverige", 'source_url': CALCULATOR, 'checked_at': checked,
            'basis': 'Näringsvärden per standardportion. Separata produkter och storlekar, inte menyer.', 'restaurants': rows}
    target = ROOT / 'restauranger.json'
    temp = target.with_suffix('.json.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    temp.replace(target)
    print(len(rows), "svenska McDonald's-produkter sparade.", flush=True)


if __name__ == '__main__':
    main()
