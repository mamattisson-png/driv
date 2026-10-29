"""Basic release checks. No production credentials or live user data required."""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ReleaseSafety(unittest.TestCase):
    def test_service_worker_files_exist(self):
        sw = (ROOT / "sw.js").read_text()
        match = re.search(r'const FILES = \[(.*?)\];', sw, re.S)
        self.assertIsNotNone(match)
        files = re.findall(r'"([^"]+)"', match.group(1))
        self.assertIn("docs/kommande.md", files)
        self.assertIn("kommande.js", files)
        for path in files:
            with self.subTest(path=path):
                self.assertTrue((ROOT / path).is_file(), f"Missing cached asset: {path}")

    def test_upcoming_view_uses_shared_source(self):
        js = (ROOT / "kommande.js").read_text()
        self.assertIn('fetch("docs/kommande.md")', js)
        self.assertIn("parseUpcomingMarkdown", js)
        md = (ROOT / "docs/kommande.md").read_text()
        rows = re.findall(r"^\|\s*(\d+)\s*\|", md, re.M)
        self.assertGreaterEqual(len(rows), 15)
        self.assertEqual(len(rows), len(set(rows)))

    def test_rls_is_declared_for_private_documents(self):
        schema = (ROOT / "supabase/schema.sql").read_text().lower()
        self.assertIn("alter table public.driv_docs enable row level security", schema)
        self.assertIn("auth.uid() = user_id", schema)

    def test_sync_has_conflict_handling(self):
        js = (ROOT / "konto.js").read_text()
        self.assertIn('query.eq("data->>_rev", version)', js)
        self.assertIn("mergeDoc(id, next, expected)", js)
        self.assertIn("23505", js)

if __name__ == "__main__":
    unittest.main()
