"""Gemensamma fixturer: en lokal webbserver för appen och en ny webbläsarsida per test.

Externa tjänster byts ut så att testerna inte beror på nätet: Supabase stängs av via
config.js (eller simuleras i sina egna tester) och Open Food Facts får ett fast svar.
"""
import functools
import http.server
import os
import threading
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="session")
def base_url():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *a: None
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{server.server_port}/"
    server.shutdown()


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        # Lokalt kan en befintlig Chromium användas via CHROMIUM_PATH; i CI installeras den av Playwright
        path = os.environ.get("CHROMIUM_PATH")
        b = p.chromium.launch(
            executable_path=path or None,
            args=["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        )
        yield b
        b.close()


OFF_PRODUCT = {
    "product": {
        "product_name": "Mellanmjölk", "brands": "Testgården",
        "nutriments": {"energy-kcal_100g": 46, "proteins_100g": 3.5}, "serving_quantity": 250,
    }
}


@pytest.fixture
def page(browser, base_url):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, permissions=["camera"], accept_downloads=True)
    ctx.route("**/config.js", lambda r: r.fulfill(body="window.DRIV_CONFIG = {};", content_type="application/javascript"))
    ctx.route("https://world.openfoodfacts.org/**", lambda r: r.fulfill(
        json=OFF_PRODUCT if "7310000000001" in r.request.url else {"status": 0}))
    pg = ctx.new_page()
    pg.set_default_timeout(int(os.environ.get("PW_TIMEOUT", "30000")))
    pg.errors = []
    pg.on("pageerror", lambda e: pg.errors.append(str(e)))
    pg.base_url = base_url
    yield pg
    assert not pg.errors, f"Fel i sidan: {pg.errors}"
    ctx.close()


def open_app(page, init_script=None):
    if init_script:
        page.add_init_script(init_script)
    page.goto(page.base_url)
    return page


def finish_setup(page):
    """Går igenom starten med de val som står: Kom igång, tre steg och Klart."""
    for step in ("1", "2", "3"):
        if page.locator(f'[data-onb="{step}"]').count():
            page.click(f'[data-onb="{step}"]')
    page.click("[data-savesetup]")


def to_step(page, n):
    """Från välkomstsidan till ett steg i starten (1 program, 2 pass och dagar, 3 mål)."""
    for step in range(1, n + 1):
        page.click(f'[data-onb="{step}"]')


def start(page, init_script=None):
    """Öppnar appen och slutför starten med standardvalen (Push/Pull/Legs, 3 pass)."""
    open_app(page, init_script)
    finish_setup(page)
    return page


def go(page, tab):
    # Står man redan i vyn finns ingen knapp till den (Profil saknar profilknapp)
    # Inställningar nås från Hem (profilbilden), Kost och Historik; annars direkt
    page.evaluate(f"tab === '{tab}' && !focus && !editDate || (document.querySelector('[data-tab={tab}]') || {{ click() {{ passDone = null; editDate = null; tab = '{tab}'; render(); }} }}).click()")
