"""Bygg en separat ODbL-katalog med märkesvaror från Open Food Facts.

Kör med sparade söksvar/JSONL/TSV-export: python tools/produkter.py --input FIL [FIL ...]
Eller hämta starturvalet: python tools/produkter.py --refresh
Stora urval ska hämtas som export, inte genom att sida igenom produkt-API:t.
"""
import argparse
import csv
import datetime
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIELDS = 'code,product_name,product_name_sv,brands,quantity,product_quantity,product_quantity_unit,serving_quantity,serving_quantity_unit,nutriments,last_modified_t,categories_tags,lang,obsolete,data_quality_errors_tags'
QUERIES = [('countries_tags:"en:sweden" AND lang:sv', 200), ('countries_tags:"en:sweden" AND brands_tags:felix', 100)]
KEEP = FIELDS.split(',')


def read_records(path):
    if path.suffix.lower() in ('.tsv', '.csv'):
        with path.open(encoding='utf-8-sig', newline='') as stream:
            for row in csv.DictReader(stream, delimiter='\t'):
                row['nutriments'] = {k: row[k] for k in row if k.endswith('_100g') and row[k] != ''}
                yield row
    else:
        text = path.read_text(encoding='utf-8')
        if path.suffix == '.jsonl':
            yield from (json.loads(line) for line in text.splitlines() if line.strip())
        else:
            data = json.loads(text)
            yield from data if isinstance(data, list) else data.get('hits', data.get('products', []))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', nargs='+', type=Path)
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    if not args.input and not args.refresh:
        parser.error('Ange --input eller --refresh.')
    records = []
    if args.refresh:
        for query, count in QUERIES:
            url = 'https://search.openfoodfacts.org/search?' + urllib.parse.urlencode(
                dict(q=query, langs='sv,en', fields=FIELDS, page_size=count, sort_by='-popularity_key'))
            req = urllib.request.Request(url, headers={'User-Agent': 'Driv/1.0 (https://driv.driveify.se)'})
            with urllib.request.urlopen(req, timeout=45) as response:
                data = json.load(response)
            if 'hits' not in data:
                raise ValueError('Ogiltigt söksvar; befintlig katalog lämnas orörd.')
            records.extend(data['hits'])
    for path in args.input or []:
        records.extend(read_records(path))
    by_code = {}
    for record in records:
        if not re.fullmatch(r'\d{8,14}', str(record.get('code', ''))):
            continue
        if not (record.get('product_name_sv') or record.get('product_name')) or not record.get('brands'):
            continue
        nutrients = record.get('nutriments') or {}
        if nutrients.get('proteins_100g') in (None, '') or not any(nutrients.get(k) not in (None, '') for k in ('energy-kcal_100g', 'energy-kj_100g')):
            continue
        code = record['code']
        if code not in by_code or int(record.get('last_modified_t') or 0) >= int(by_code[code].get('last_modified_t') or 0):
            by_code[code] = {k: record[k] for k in KEEP if k in record}
    if not by_code:
        raise ValueError('Tom katalog; befintlig fil lämnas orörd.')
    output = {
        'source': 'Open Food Facts', 'source_url': 'https://world.openfoodfacts.org/',
        'license': 'ODbL-1.0', 'license_url': 'https://opendatacommons.org/licenses/odbl/1-0/',
        'generated_at': datetime.date.today().isoformat(),
        'selection': 'Svenskspråkiga produkter som säljs i Sverige, samt Felix. Ett starturval, inte hela sortimentet.',
        'products': sorted(by_code.values(), key=lambda p: p['code']),
    }
    target = ROOT / 'produkter.json'
    temp = target.with_suffix('.json.tmp')
    temp.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    temp.replace(target)
    print(len(by_code), 'källposter sparade i produkter.json. Appen filtrerar även ogiltiga näringsvärden.')


if __name__ == '__main__':
    main()
