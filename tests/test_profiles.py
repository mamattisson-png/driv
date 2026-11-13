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
    page.click("[data-profile='me']")
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
    assert page.locator(".pfhead img").count() == 1


def test_friend_profile_shows_stats(page):
    start(page)
    page.evaluate(STUB)
    page.evaluate("friendsPage = 'lista'; render()")
    page.click("[data-profile='u2']")
    page.wait_for_function("document.querySelector('.pfgrid') && document.querySelector('.pfgrid').innerText.includes('52')")
    text = page.inner_text(".pfpage")
    assert "Sara" in text and "Löpning" in text and "Tränat 3 gånger" in text
    assert page.locator(".pfpage [data-kudos='7']").count() == 1
