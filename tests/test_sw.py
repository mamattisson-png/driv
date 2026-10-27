"""Service workern: rätt versionsnummer och att appen startar utan nät."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("swv", Path(__file__).resolve().parent.parent / "tools" / "sw-version.py")
swv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(swv)


def test_sw_version_stammer_med_filerna():
    assert swv.current() == swv.version(), "Filerna har ändrats: kör python tools/sw-version.py"


def test_appen_startar_utan_nat(browser, base_url):
    ctx = browser.new_context(service_workers="allow")
    ctx.add_init_script("window.__swTest = true")
    pg = ctx.new_page()
    pg.goto(base_url)
    pg.evaluate("navigator.serviceWorker.ready")
    pg.reload()
    pg.wait_for_function("!!navigator.serviceWorker.controller")
    ctx.set_offline(True)
    pg.reload()
    assert pg.locator('.welcome [data-onb="1"]').count() == 1
    assert pg.evaluate("typeof FOODS !== 'undefined' && typeof EX !== 'undefined'")
    ctx.close()


def test_installationen_hamtar_varje_fil_med_versionen(browser, base_url):
    # Utan versionen kan GitHub Pages cdn svara med en äldre index.html än app.js, och appen sparar en blandning
    ctx = browser.new_context(service_workers="allow")
    ctx.add_init_script("window.__swTest = true")
    seen = []
    ctx.on("request", lambda r: seen.append(r.url))
    pg = ctx.new_page()
    pg.goto(base_url)
    pg.evaluate("navigator.serviceWorker.ready")
    v = swv.current()
    for f in swv.files():
        assert any(u.endswith(f"/{f}?v={v}") for u in seen), f
    ctx.close()
