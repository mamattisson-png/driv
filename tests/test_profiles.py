"""Profiler: egen profil med foto (beskärs och förminskas), väns profil med statistik från Supabase."""
from conftest import start

STUB = """Object.assign(social, {loaded: true, profile: {name: 'Marcus', code: 'ABC123', sharing: true, photo: null, since: '2026-10-02'},
  friends: [{id: 'u2', name: 'Sara', photo: null, last: TODAY, week: 3}],
  feed: [{id: 7, day: TODAY, pass: 'Legs', exercises: 5, name: 'Sara', uid: 'u2', mine: false, kudos: 0, kudoed: false}]});
window.__calls = []; socialRpc = async (n, a) => { __calls.push([n, a]); if (n === 'driv_profile_stats') return {month: 11, total: 52, weeks: 6, top: 'Löpning', since: '2026-09-01',
  recent: [{id: 7, day: TODAY, pass: 'Legs', kudos: 0, kudoed: false}]}; return null; };
S.tourAsked = true; save(); tab = 'vanner'; render();"""


def test_own_profile_photo_is_cropped_and_small(page, tmp_path):
    start(page)
    page.evaluate(STUB)
    page.evaluate("tab = 'minprofil'; render()")
    # En liten testbild: 300 × 200 punkter, rött
    img = tmp_path / "selfie.png"
    img.write_bytes(bytes(page.evaluate("""(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 200;
      const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 300, 200);
      return Array.from(atob(c.toDataURL('image/png').split(',')[1]), ch => ch.charCodeAt(0)); })()""")))
    page.set_input_files("#pfphotoinput", str(img))
    page.wait_for_function("social.profile.photo")
    photo = page.evaluate("social.profile.photo")
    assert photo.startswith("data:image/jpeg;base64,") and len(photo) <= 60000
    assert page.evaluate("new Promise(r => { const i = new Image(); i.onload = () => r([i.width, i.height]); i.src = social.profile.photo; })") == [256, 256]
    assert page.evaluate("__calls.map(c => c[0])") == ["driv_photo_save"]
    # Fotot visas i stället för bokstaven
    assert page.locator(".me2 img").count() == 1


def test_friend_profile_shows_stats(page):
    start(page)
    page.evaluate(STUB)
    page.evaluate("friendsPage = 'lista'; render()")
    page.click("[data-profile='u2']")
    page.wait_for_function("document.querySelector('.pfgrid') && document.querySelector('.pfgrid').innerText.includes('52')")
    text = page.inner_text(".pfpage")
    assert "Sara" in text and "Löpning" in text and "Tränat 3 gånger" in text
    assert page.locator(".pfpage [data-kudos='7']").count() == 1


def test_profile_and_account_page_changes_photo(page, tmp_path):
    start(page)
    page.evaluate(STUB)
    page.evaluate("tab = 'profil'; render()")
    page.click(".pcardbtn")
    assert page.locator(".me2").count() == 1
    img = tmp_path / "me.png"
    img.write_bytes(bytes(page.evaluate("""(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 300;
      c.getContext('2d').fillRect(0, 0, 200, 300); return Array.from(atob(c.toDataURL('image/png').split(',')[1]), ch => ch.charCodeAt(0)); })()""")))
    page.set_input_files("#pfphotoinput", str(img))
    page.wait_for_function("social.profile.photo")
    assert page.locator(".me2 img").count() == 1
    page.click(".mebar .backbtn")
    assert page.locator(".pcard img").count() == 1   # fotot syns även överst i Inställningar


def test_utmaningar_och_manadens_topplista(page):
    from test_app import SB_CONFIG
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page)
    page.evaluate(STUB.replace("S.tourAsked", """account.step = 'in'; Object.assign(social, { month: [{name: 'Sara', n: 9, me: false}, {name: 'Marcus', n: 11, me: true}],
      challenges: [{id: 1, kind: 'forst', goal: 12, start_day: shift(TODAY, -5), end_day: shift(TODAY, 5), mine: true,
        people: [{name: 'Marcus', me: true, n: 12, reached: TODAY}, {name: 'Sara', me: false, n: 7, reached: null}, {name: 'Johan', me: false, n: 9, reached: null}]}] });
      S.tourAsked"""))
    assert "Först till 12 pass" in page.inner_text(".chlist") and "Du var först!" in page.inner_text(".chlist")
    page.click('[data-ftrange="manad"]')
    assert page.locator(".ftop .trow").first.inner_text().startswith("1")
    assert "Du" in page.locator(".ftop .trow.me").inner_text()
    # Ny utmaning skickas med vald vän, typ och period
    assert "3 deltagare" in page.inner_text(".chlist") and page.locator(".chlist .chrow").count() == 3
    page.click('.fsec-h [data-fsheet="utmana"]')
    assert page.locator("[data-chcreate][disabled]").count() == 1   # ingen vald än
    page.click('[data-chfriend="u2"]')
    page.click('[data-chkind="flest"]'); page.click('[data-chper="vecka"]')
    page.click("[data-chcreate]")
    page.wait_for_function("__calls.some(c => c[0] === 'driv_challenge_create')")
    call = page.evaluate("__calls.find(c => c[0] === 'driv_challenge_create')[1]")
    assert call["p_friends"] == ["u2"] and call["p_kind"] == "flest" and call["p_goal"] is None
    assert call["p_start"] == page.evaluate("weekStart(TODAY)")
    # Ta bort kräver två tryck
    page.evaluate("socialRpc = async (n, a) => { __calls.push([n, a]); return null; }; friendsSheet = null; render()")


def test_profil_oppnas_fran_namn_och_visar_veckor(page):
    from test_app import SB_CONFIG
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page)
    page.evaluate(STUB.replace("S.tourAsked", """account.step = 'in';
      socialRpc = async (n, a) => { __calls.push([n, a]); return n === 'driv_profile_stats' ? { month: 4, total: 20, weeks: 3, top: 'Legs', since: '2026-03-01',
        weeks12: Array.from({ length: 12 }, (_, i) => ({ week: shift(weekStart(TODAY), -7 * (11 - i)), n: i % 3 })), recent: [] } : null; };
      S.tourAsked"""))
    # Namnet i flödet öppnar vännens profil, med pass per vecka
    page.click(".fevent .pname")
    assert page.evaluate("profView") == "u2"
    page.wait_for_selector(".pfweeks")
    assert page.locator(".pfweeks .ch-b").count() == 12
    # Raden i topplistan öppnar också profilen
    page.evaluate("profView = null; render()")
    page.click('.ftop .trow[data-profile="u2"]')
    assert page.evaluate("profView") == "u2"
