"""Räknar ut kontrollsumman av appens filer och skriver in den i sw.js.

Kör efter varje ändring av filerna som service workern sparar:  python tools/sw-version.py
"""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SW = ROOT / "sw.js"


def files():
    return re.search(r"const FILES = \[(.*?)\];", SW.read_text(), re.S).group(1).replace("\n", "").replace(" ", "").replace('"', "").split(",")


def version():
    h = hashlib.sha256()
    for f in files():
        h.update(f.encode())
        h.update((ROOT / f).read_bytes())
    return "driv-" + h.hexdigest()[:8]


def current():
    return re.search(r'const CACHE = "([^"]+)";', SW.read_text()).group(1)


if __name__ == "__main__":
    v = version()
    SW.write_text(re.sub(r'const CACHE = "[^"]+";', f'const CACHE = "{v}";', SW.read_text()))
    print(v)
