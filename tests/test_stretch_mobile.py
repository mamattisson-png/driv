"""390x844 Chromium smoke test for stretch detail; no account or backend writes."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


class MobileStretchSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True, channel="chrome")
        cls.context = cls.browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        cls.page = cls.context.new_page()
        cls.page.goto(f"http://127.0.0.1:{cls.server.server_port}/", wait_until="domcontentloaded")
        cls.page.wait_for_function(
            "typeof stretchPage === 'function' && typeof EX !== 'undefined' && !!EX.brost_dorr",
            timeout=20000,
        )

    @classmethod
    def tearDownClass(cls):
        cls.context.close()
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def assert_mobile_width(self, label):
        dims = self.page.evaluate("""() => ({
            width: window.innerWidth,
            height: window.innerHeight,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
        })""")
        self.assertEqual(dims["width"], 390, f"{label}: wrong mobile viewport: {dims}")
        self.assertEqual(dims["height"], 844, f"{label}: wrong viewport height: {dims}")
        self.assertLessEqual(dims["documentWidth"], 391, f"{label}: horizontal overflow: {dims}")
        self.assertLessEqual(dims["bodyWidth"], 391, f"{label}: body overflow: {dims}")

    def render_stretch(self, exercise_id):
        self.page.evaluate("""id => {
            const main = document.querySelector('main');
            if (!main) throw new Error('main container not found');
            main.innerHTML = stretchPage(id);
        }""", exercise_id)

    def test_mobile_stretch_direct_link(self):
        self.render_stretch("brost_dorr")
        self.assert_mobile_width("Bröststretch i dörr")
        links = self.page.locator('main a[href*="musclewiki.com"]')
        self.assertEqual(links.count(), 1)
        self.assertEqual(links.first.get_attribute("href"),
                         "https://musclewiki.com/exercise/chest-stretch-variation-one")

    def test_mobile_touch_starts_stretch_timer(self):
        self.render_stretch("brost_dorr")
        self.page.locator('[data-dclockstart="brost_dorr"]').tap()
        self.assertEqual(self.page.evaluate("dailyClock && dailyClock.id"), "brost_dorr")
        self.assertIn("Träning pågår", self.page.evaluate("stretchPage('brost_dorr')"))

    def test_mobile_unverified_stretch_has_no_link(self):
        self.render_stretch("strx_floor_angels")
        self.assert_mobile_width("Snöänglar på golvet")
        self.assertEqual(self.page.locator('main a[href*="musclewiki.com"]').count(), 0)


if __name__ == "__main__":
    unittest.main()
