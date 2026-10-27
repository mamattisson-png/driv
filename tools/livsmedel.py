"""Hämtar Livsmedelsverkets livsmedelsdatabas och skriver livsmedel.js.

Per livsmedel sparas namn, kcal, protein, fett och fibrer per 100 g.
Källa: Livsmedelsverket, livsmedelsverket.se/livsmedelsdatabasen (öppet API). Licens: CC BY 4.0.

Kör:  python3 tools/livsmedel.py   (tar några minuter; svaren sparas i tools/.lmv-cache så att en
omkörning går fort)
"""
import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

API = "https://dataportal.livsmedelsverket.se/livsmedel/api/v1"
ROOT = Path(__file__).resolve().parent.parent
CACHE = Path(__file__).resolve().parent / ".lmv-cache"
CODES = {"ENERC": "kcal", "PROT": "p", "FAT": "fat", "FIBT": "fib"}


def get(url, tries=5):
    # Enstaka avbrutna anslutningar försöks igen efter en stund
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.load(r)
        except OSError:
            if i == tries - 1:
                raise
            time.sleep(2 ** i)


def foods():
    out, offset = [], 0
    while True:
        page = get(f"{API}/livsmedel?offset={offset}&limit=500&sprak=1")
        out += page["livsmedel"]
        offset += 500
        if offset >= page["_meta"]["totalRecords"]:
            return out


def nutrients(nr):
    f = CACHE / f"{nr}.json"
    if f.exists():
        data = json.loads(f.read_text())
    else:
        data = get(f"{API}/livsmedel/{nr}/naringsvarden?sprak=1")
        f.write_text(json.dumps(data))
    vals = {}
    for n in data:
        key = CODES.get(n.get("euroFIRkod"))
        # Energi finns i både kJ och kcal; bara kcal används
        if key and not (key == "kcal" and n.get("enhet") != "kcal"):
            vals[key] = n.get("varde") or 0
    return vals


def name(x):
    # Fritexten delas på "och", så "Soja- och veteprotein" skrivs "Soja- & veteprotein"
    return re.sub(r"\s+", " ", x["namn"].strip()).replace(" och ", " & ")


def num(v, dec=1):
    v = round(float(v), dec)
    return str(int(v)) if v == int(v) else str(v)


def main():
    CACHE.mkdir(exist_ok=True)
    items = sorted(foods(), key=lambda x: name(x).lower())
    with ThreadPoolExecutor(4) as pool:
        vals = list(pool.map(lambda x: nutrients(x["nummer"]), items))
    rows = [json.dumps([name(x), round(v.get("kcal", 0)), float(num(v.get("p", 0))), float(num(v.get("fat", 0))), float(num(v.get("fib", 0)))],
                       ensure_ascii=False).replace(".0,", ",").replace(".0]", "]")
            for x, v in zip(items, vals)]
    (ROOT / "livsmedel.js").write_text(
        '"use strict";\n'
        "// Livsmedelsverkets livsmedelsdatabas: namn, kcal, protein, fett och fibrer (g) per 100 g.\n"
        "// Källa: Livsmedelsverket, livsmedelsverket.se/livsmedelsdatabasen. Licens: CC BY 4.0.\n"
        "// Skapad av tools/livsmedel.py. Laddas efter appen (async) och läggs då till bland livsmedlen.\n"
        "addLMV([\n" + ",\n".join(rows) + ",\n]);\n")
    print(len(rows), "livsmedel")


if __name__ == "__main__":
    main()
