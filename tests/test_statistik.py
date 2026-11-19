"""Anonym statistik och felrapporter: vad som skickas, att det går att stänga av, och sidan för admin."""
import json
from conftest import start
from test_app import SB_CONFIG


def setup(page):
    sent = []
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    def rpc(route):
        sent.append((route.request.url.rsplit("/", 1)[-1], json.loads(route.request.post_data or "{}"), dict(route.request.headers)))
        route.fulfill(status=204, body="")
    page.context.route("https://exempel.supabase.co/rest/v1/rpc/**", rpc)
    start(page)
    return sent


def test_aktiv_vecka_och_handelser_utan_id(page):
    sent = setup(page)
    page.wait_for_timeout(300)
    names = [s[0] for s in sent]
    assert names.count("driv_track") == 1 and sent[0][1]["p_event"] == "aktiv_vecka"
    # Bara händelsens namn och telefontyp, inget som pekar ut någon
    assert set(sent[0][1]) == {"p_event", "p_platform"}
    # En gång per vecka: en ny sidladdning räknas inte igen
    page.evaluate("trackWeek()")
    page.wait_for_timeout(100)
    assert [s[0] for s in sent].count("driv_track") == 1
    # Mat loggad räknas, men inte två gånger i rad
    page.evaluate("logFood({ name: 'Banan', kcal: 100, protein: 1 }, 0); logFood({ name: 'Äpple', kcal: 50, protein: 0 }, 0)")
    page.wait_for_timeout(200)
    assert [s[1]["p_event"] for s in sent if s[0] == "driv_track"] == ["aktiv_vecka", "mat_loggad"]


def test_fel_rapporteras_och_statistik_kan_stangas_av(page):
    sent = setup(page)
    page.evaluate("reportError('TypeError: x är odefinierad', 'app.js:12'); reportError('TypeError: x är odefinierad', 'app.js:12')")
    page.wait_for_timeout(200)
    errs = [s[1] for s in sent if s[0] == "driv_report_error"]
    assert len(errs) == 1 and errs[0]["p_source"] == "app.js:12" and errs[0]["p_page"] == "idag"
    # Avstängt i Inställningar: inget skickas
    page.evaluate("tab = 'profil'; render()")
    page.click("[data-nostats]")
    assert page.evaluate("S.noStats") is True
    before = len(sent)
    page.evaluate("track('pass_klart'); reportError('Annat fel', 'kost.js:1')")
    page.wait_for_timeout(200)
    assert len(sent) == before


def test_statistiksidan_bara_for_admin(page):
    setup(page)
    page.evaluate("stats.admin = false; tab = 'profil'; render()")
    assert page.locator('[data-tab="statistik"]').count() == 0
    page.evaluate("""stats.admin = true; stats.data = { weeks: [{ week: shift(weekStart(TODAY), -7), active: 4 }, { week: weekStart(TODAY), active: 6 }],
      events: [{ event: 'pass_klart', d7: 9, d30: 31 }], platforms: [{ platform: 'android-app', n: 5 }], errors7: 1,
      errors: [{ message: 'TypeError: x', source: 'app.js:12', page: 'kost', n: 2, last: TODAY + 'T10:00:00Z', platforms: 'android-app' }] };
      loadStats = () => {}; tab = 'profil'; render()""")
    assert page.locator('[data-tab="statistik"]').count() == 1
    page.evaluate("tab = 'statistik'; render()")
    txt = page.inner_text("#app")
    assert "6" in page.inner_text(".stbig") and "förra veckan 4" in txt
    assert "Pass klara" in txt and "Android, installerad" in txt and "TypeError: x" in txt
