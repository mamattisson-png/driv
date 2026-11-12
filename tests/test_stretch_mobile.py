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


    def test_all_audited_stretch_pages_respect_links_and_mobile_width(self):
        """Exercise every audited stretch detail at 390x844, not only two samples."""
        audit = (ROOT / "docs" / "stretch-musclewiki-review-queue.md").read_text(encoding="utf-8")
        rows = []
        for line in audit.splitlines():
            if not line.startswith("| "):
                continue
            cells = [cell.strip() for cell in line.split("|")]
            if len(cells) > 6 and cells[5] in ("verified", "no_exact_match"):
                rows.append((cells[1], cells[4], cells[5]))
        self.assertEqual(len(rows), 125, "Every stretch must be covered by the mobile test")

        for exercise_id, expected_url, status in rows:
            with self.subTest(exercise=exercise_id):
                self.render_stretch(exercise_id)
                self.assert_mobile_width(exercise_id)
                links = self.page.locator('main a[href*="musclewiki.com"]')
                hrefs = links.evaluate_all("(nodes) => nodes.map(a => a.href)")
                if status == "verified":
                    self.assertEqual(hrefs, [expected_url], exercise_id)
                else:
                    self.assertEqual(expected_url, "—", exercise_id)
                    self.assertEqual(hrefs, [], exercise_id)


    def test_real_library_navigation_and_link_visibility(self):
        """Tap through the actual library/detail/back handlers, without HTML injection."""
        page = self.context.new_page()
        try:
            page.goto(f"http://127.0.0.1:{self.server.server_port}/",
                      wait_until="domcontentloaded")
            page.wait_for_function(
                "typeof render === 'function' && typeof muscleView === 'function' && !!EX.brost_dorr",
                timeout=20000,
            )
            # Skip account setup only; the list, details and navigation use real app events.
            page.evaluate("""() => {
                tab = 'stretchguide';
                msk = {...msk, mode: 'st', sel: null, q: 'Bröststretch i dörr',
                       gear: 'alla', limit: 30};
                mskDetail = null;
                render();
            }""")
            page.locator('main [data-mskdetail="brost_dorr"]').tap()
            self.assertEqual(page.locator("main h1.msk-h").inner_text(),
                             "Bröststretch i dörr")
            self.assertEqual(
                page.locator('main a[href*="musclewiki.com"]').first.get_attribute("href"),
                "https://musclewiki.com/exercise/chest-stretch-variation-one",
            )
            page.locator('main [data-mskdetail=""]').tap()
            self.assertTrue(page.locator('main [data-mskdetail="brost_dorr"]').is_visible())

            page.evaluate("() => { msk.q = 'Snöänglar'; render(); }")
            page.locator('main [data-mskdetail="strx_floor_angels"]').tap()
            self.assertEqual(page.locator("main h1.msk-h").inner_text(),
                             "Snöänglar på golvet")
            self.assertEqual(page.locator('main a[href*="musclewiki.com"]').count(), 0)
            dims = page.evaluate("""() => ({
                width: innerWidth,
                scrollWidth: document.documentElement.scrollWidth
            })""")
            self.assertEqual(dims["width"], 390)
            self.assertLessEqual(dims["scrollWidth"], 391)
        finally:
            page.close()


    def test_real_stretch_add_to_dailys_with_touch(self):
        """Tap from the real stretch list through the add sheet and start timer."""
        page = self.context.new_page()
        try:
            page.goto(f"http://127.0.0.1:{self.server.server_port}/",
                      wait_until="domcontentloaded")
            page.wait_for_function(
                "typeof render === 'function' && typeof stretchPage === 'function' && !!EX.strx_floor_angels",
                timeout=20000,
            )
            # Isolate the account setup; exercise list, add sheet, storage and
            # timer still use the application's real click handlers.
            page.evaluate("""() => {
                tab = 'stretchguide';
                msk = {...msk, mode: 'st', sel: null, q: 'Snöänglar',
                       gear: 'alla', limit: 30};
                mskDetail = null;
                render();
            }""")
            page.locator('main [data-mskdetail="strx_floor_angels"]').tap()
            self.assert_mobile_width_for_page(page, "Stretch detail before adding")
            page.locator('main [data-sgadd="strx_floor_angels"]').tap()
            self.assertTrue(page.get_by_role("dialog", name="Lägg till Snöänglar på golvet").is_visible())
            page.locator('[data-sgto="daily"]').tap()
            self.assertTrue(page.evaluate(
                "() => S.daily.some(e => e.id === 'strx_floor_angels')"
            ), "Adding from the stretch detail should update Dailys")
            self.assertIsNone(page.evaluate("() => sgAdd"), "Add sheet should close")
            self.assert_mobile_width_for_page(page, "Stretch detail after adding")
            page.locator('main [data-dclockstart="strx_floor_angels"]').tap()
            self.assertEqual(page.evaluate("() => dailyClock && dailyClock.id"),
                             "strx_floor_angels")
        finally:
            page.close()

    def assert_mobile_width_for_page(self, page, label):
        dims = page.evaluate("""() => ({
            width: innerWidth,
            height: innerHeight,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
        })""")
        self.assertEqual((dims["width"], dims["height"]), (390, 844), label)
        self.assertLessEqual(dims["documentWidth"], 391, f"{label}: {dims}")
        self.assertLessEqual(dims["bodyWidth"], 391, f"{label}: {dims}")


if __name__ == "__main__":
    unittest.main()
