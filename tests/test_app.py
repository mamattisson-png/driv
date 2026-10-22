"""Webbläsartester för Driv. Kör med: python -m pytest tests"""
from conftest import go, open_app, start

KONTO = '.card:has(h2:text-is("Konto"))'


def seed(page, js):
    """Lägger in historik direkt i appens data och laddar om."""
    page.evaluate(f"() => {{ {js}; save(); }}")
    page.reload()


# ---------- Upplägg ----------

def test_alla_upplagg_har_giltiga_standardovningar(page):
    open_app(page)
    assert page.evaluate("Object.values(DEFAULT_EX).flat().map(x => x.split('@')[0]).filter(id => !EX[id])") == []
    page.click("button.on[data-progtoggle]")
    for prog in page.evaluate("Object.keys(PROGRAMS)"):
        page.click(f'[data-prog="{prog}"]')
        assert page.evaluate(f"counts('{prog}')") == [1, 2, 3, 4, 5, 6, 7]
        for c in range(1, 8):
            page.click(f'[data-count="{c}"]')
            assert page.evaluate("draft.days.length") == c
            assert page.evaluate("draft.days.every(d => d.ex.length || d.type === 'custom')")
        page.click("button.on[data-progtoggle]")


def test_eget_upplagg_med_egna_namn_och_ovningar(page):
    open_app(page)
    page.click("button.on[data-progtoggle]")
    page.click('[data-prog="eget"]')
    page.click('[data-count="2"]')
    page.fill('[data-dayname="0"]', "Bröst & triceps")
    page.press('[data-dayname="0"]', "Tab")
    page.click('[data-openpick="draft:0"]')
    page.fill("#exsearch", "bänk")
    page.click(".pick:not([hidden]) [data-add]")
    page.click('[data-count="3"]')
    assert page.evaluate("draft.days[0].name") == "Bröst & triceps"
    page.click("[data-savesetup]")
    assert "Bröst & triceps" in page.inner_text(".card >> nth=0")


def test_fasta_dagar_kraver_ratt_antal(page):
    open_app(page)
    page.click('[data-count="4"]')
    page.click('[data-mode="fixed"]')
    page.click('[data-wd="0"]')
    assert page.is_disabled("[data-savesetup]")
    page.click('[data-wd="6"]')
    page.click("[data-savesetup]")
    assert page.evaluate("S.plan.weekdays") == [1, 3, 4, 6]


# ---------- Pass och veckojämförelse ----------

def test_vikt_jamfors_med_forra_veckan(page):
    start(page)
    seed(page, "S.log[shift(TODAY,-7)] = {workout:{dayId:S.plan.days[0].id,done:true,sets:{bankpress:[{kg:80,reps:8,ok:true}]}},dailies:{},food:[]}")
    go(page, "pass")
    page.click("[data-pick]")
    page.fill('[data-set=bankpress][data-i="0"][data-f=kg]', "82.5")
    page.press('[data-set=bankpress][data-i="0"][data-f=kg]', "Tab")
    page.fill('[data-set=bankpress][data-i="0"][data-f=reps]', "8")
    page.press('[data-set=bankpress][data-i="0"][data-f=reps]', "Tab")
    page.click('[data-ok=bankpress][data-i="0"]')
    go(page, "vecka")
    row = page.locator("table.wk tr", has_text="Bänkpress").inner_text()
    assert "82,5 kg × 8" in row and "+2,5 kg" in row


def test_kroppsvikt_ovningar_raknas_i_reps_och_sekunder(page):
    open_app(page)
    page.click("button.on[data-progtoggle]")
    page.click('[data-prog="cali"]')
    page.click("[data-savesetup]")
    seed(page, """const d = S.plan.days[0]; S.log[shift(TODAY,-7)] = {workout:{dayId:d.id,done:true,sets:{
        armhavningar:[{reps:12,ok:true}], plankan:[{reps:45,ok:true}]}},dailies:{},food:[]}""")
    go(page, "pass")
    page.click("[data-pick]")
    for ex, val in [("armhavningar", "15"), ("plankan", "60")]:
        sel = f'[data-set={ex}][data-i="0"][data-f=reps]'
        page.fill(sel, val)
        page.press(sel, "Tab")
    go(page, "vecka")
    assert "+3 reps" in page.locator("table.wk tr", has_text="Armhävningar").inner_text()
    assert "+15 s" in page.locator("table.wk tr", has_text="Plankan").inner_text()


def test_dagens_mal_fylls_i_och_pers_firas(page):
    start(page)
    seed(page, "S.log[shift(TODAY,-7)] = {workout:{dayId:S.plan.days[0].id,done:true,sets:{bankpress:[{kg:80,reps:8,ok:true}],dips:[{reps:10,ok:true}]}},dailies:{},food:[]}")
    go(page, "pass")
    page.click("[data-pick]")
    assert "82,5 kg × 6" in page.locator(".card.ex", has_text="Bänkpress").first.locator(".goal").inner_text()
    assert "11 reps" in page.locator(".card.ex", has_text="Dips").first.locator(".goal").inner_text()
    page.click('[data-ok=bankpress][data-i="0"]')
    assert page.evaluate("JSON.stringify(day().workout.sets.bankpress[0])") == '{"ok":true,"reps":6,"kg":82.5}'
    assert "Nytt pers" in page.inner_text(".toast")


def test_spara_pass_och_oppna_igen(page):
    start(page)
    go(page, "pass")
    page.click("[data-exok=bankpress]")
    assert "1 av 6 övningar" in page.inner_text("button[data-finish]")
    page.click("button[data-finish]")
    go(page, "pass")
    page.click("[data-pick]")
    assert "passet är sparat" in page.inner_text(".done-card")
    page.click(".done-card [data-finish]")
    assert page.inner_text("button[data-finish]").startswith("✓ Spara passet")


def test_vilotimer(page):
    start(page, "window.__vib = []; navigator.vibrate = p => { window.__vib.push(p); return true; };")
    go(page, "pass")
    page.click('[data-ok=bankpress][data-i="0"]')
    assert page.inner_text(".rest-time") == "1:30"
    page.click('[data-restadd="15"]')
    assert page.inner_text(".rest-time") == "1:45"
    # Med en övning öppen ligger timern under dialogen, inte över den
    page.click('[data-info=militarpress]')
    sheet, timer = page.locator(".sheet").bounding_box(), page.locator(".rest").bounding_box()
    assert sheet["y"] + sheet["height"] <= timer["y"] + 1
    page.click(".sheet [data-close]")
    page.click('[data-ok=sidolyft][data-i="0"]')
    assert page.inner_text(".rest-time") == "1:00"
    page.evaluate("rest.end = Date.now() + 500")
    page.wait_for_function("rest.el && rest.el.classList.contains('ding')")
    assert page.evaluate("window.__vib") == [[200, 100, 200]]
    page.click("[data-restskip]")
    assert page.locator(".rest").count() == 0


# ---------- Dailys, vikt och påminnelser ----------

def test_dailys_flyttas_over_fran_gammalt_format(page):
    open_app(page)
    page.evaluate("""() => { localStorage.setItem('ppl-traning-v2', JSON.stringify({v:2, setupDone:true, meals:[],
      plan:{program:'ppl',count:3,mode:'flex',weekdays:[0,2,4],days:makeDays('ppl',3)},
      dailies:{mage:{on:true,ex:[{id:'plankan',sets:3,reps:'45 s'}]},lop:{on:true},steg:{on:true}},
      log:{'2026-01-05':{workout:null,dailies:{mage:{plankan:true},lop:{km:5,min:30},steg:true},food:[]}}})); }""")
    page.reload()
    assert page.evaluate("S.daily.map(e => e.id)") == ["plankan", "lop", "promenad"]
    assert page.evaluate("S.log['2026-01-05'].dailies") == {"lop": {"km": 5, "min": 30}, "plankan": True, "promenad": True}
    go(page, "dailys")
    page.click("[data-dcheck=plankan]")
    assert page.evaluate("dailyDone(TODAY, 'plankan')")


def test_kroppsvikt_och_kalorimal(page):
    open_app(page)
    page.select_option("[data-prof=goal]", "cut")
    page.click("[data-savesetup]")
    seed(page, "S.weights[shift(TODAY,-7)] = 82; S.weights[shift(TODAY,-6)] = 81.8")
    page.fill("#wkg", "70")
    page.click("[data-wsave]")
    assert page.evaluate("S.profile.weight") == 70
    assert page.evaluate("kcalGoal()") < 2360
    assert "mot förra veckan" in page.locator('.card:has(h2:text-is("Vikt"))').inner_text()
    # Vikten kan döljas och visas igen
    page.click("[data-hideweight]")
    assert page.locator("#wkg").count() == 0
    go(page, "vecka")
    assert page.locator('.card:has(h2:text-is("Vikt"))').count() == 0
    go(page, "profil")
    page.click("[data-showweight]")
    go(page, "idag")
    assert page.locator("#wkg").count() == 1


def test_paminnelse_i_kalendern(page):
    start(page)
    go(page, "dailys")
    page.fill("#remtime", "06:30")
    page.press("#remtime", "Tab")
    with page.expect_download() as dl:
        page.click("[data-remcal]")
    ics = open(dl.value.path(), newline="").read()
    assert "RRULE:FREQ=DAILY" in ics and "T063000" in ics and "\r\n" in ics


# ---------- Kost ----------

def test_fritext_forslag_och_felstavning(page):
    start(page)
    go(page, "kost")
    assert page.evaluate("parseFood('2 dl mjölk och 2 ägg').kcal") == 246
    assert page.evaluate("parseFood('ryggbif').items[0].corrected") == "Ryggbiff"
    page.type("#fname", "150 g ryggb")
    page.click('#fsugg [data-sugg="0"]')
    assert page.input_value("#fname") == "150 g ryggbiff"
    assert page.input_value("#fkcal") == "195"
    page.type("#fname", " och kottbu")
    assert "Köttbull" in page.inner_text("#fsugg")
    page.click("h1")
    page.click("[data-addfood]")
    assert page.evaluate("day().food.length") == 1


def test_streckkod_fran_open_food_facts(page):
    start(page, "window.BarcodeDetector = class { async detect() { return window.__code ? [{ rawValue: window.__code }] : []; } };")
    go(page, "kost")
    page.click("[data-scan]")
    page.wait_for_function("scanner.stream !== null")
    page.evaluate("window.__code = '7310000000001'")
    page.wait_for_selector(".scan-product")
    page.fill("#scangrams", "200")
    assert "92 kcal" in page.inner_text("#scancalc")
    page.click("[data-scanlog]")
    assert page.evaluate("day().food[0].kcal") == 92
    page.click("[data-scan]")
    page.fill("#scancode", "0000000000017")
    page.click("[data-scanlookup]")
    page.wait_for_function("document.querySelector('#scanstatus').textContent.includes('finns inte')")


# ---------- Lagring ----------

FROZEN_CLOUD = r"""
(() => {
  const deepFreeze = o => { if (o && typeof o === 'object') { Object.values(o).forEach(deepFreeze); Object.freeze(o); } return o; };
  const store = JSON.parse(sessionStorage.getItem('mockstore') || '{}');
  const col = {
    get: async () => { const docs = Object.entries(store).map(([id, d]) => ({ id, data: () => deepFreeze(JSON.parse(JSON.stringify(d))) })); return { empty: !docs.length, docs }; },
    doc: id => ({ set: async d => { store[id] = d; sessionStorage.setItem('mockstore', JSON.stringify(store)); }, delete: async () => { delete store[id]; sessionStorage.setItem('mockstore', JSON.stringify(store)); } }),
  };
  window.claude = { use: async n => n === 'db' ? { collection: () => col } : n === 'user' ? { id: async () => 'u1' } : null };
})();
"""


def test_claude_lagring_med_frysta_snapshots(page):
    start(page, FROZEN_CLOUD)
    page.wait_for_function("Object.keys(JSON.parse(sessionStorage.getItem('mockstore') || '{}')).length > 0")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_function("cloud.status === 'cloud'")
    go(page, "kost")
    page.fill("#fname", "1 dl mjölk")
    page.click("[data-addfood]")
    assert page.evaluate("S.log[TODAY].food.length") == 1


SUPABASE_MOCK = r"""
window.__db = JSON.parse(sessionStorage.getItem('mockdb') || '{}');
const keep = () => sessionStorage.setItem('mockdb', JSON.stringify(window.__db));
window.supabase = { createClient: () => ({
  auth: {
    session: JSON.parse(sessionStorage.getItem('sess') || 'null'),
    async getSession() { return { data: { session: this.session } }; },
    async signInWithOtp({ email }) { window.__mailed = email; return { error: null }; },
    async verifyOtp({ email, token }) { if (token !== '123456') return { error: { message: 'fel' } };
      this.session = { user: { id: 'u1', email } }; sessionStorage.setItem('sess', JSON.stringify(this.session)); return { error: null }; },
    async signOut() { this.session = null; sessionStorage.removeItem('sess'); return { error: null }; },
  },
  from: () => ({
    select: async () => ({ data: Object.entries(window.__db).map(([id, data]) => ({ id, data })), error: null }),
    upsert: async row => { window.__db[row.id] = row.data; keep(); return { error: null }; },
    insert: async row => { if (window.__fbFail) return { error: { message: 'nere' } }; window.__fb = row; return { error: null }; },
    delete: () => ({ eq: async (k, id) => { delete window.__db[id]; keep(); return { error: null }; } }),
  }),
}) };
"""


def test_supabase_inloggning_synk_och_sammanslagning(page):
    page.context.route("**/config.js", lambda r: r.fulfill(
        body='window.DRIV_CONFIG = { supabaseUrl: "https://exempel.supabase.co", supabaseAnonKey: "nyckel" };',
        content_type="application/javascript"))
    start(page, SUPABASE_MOCK)
    page.evaluate("S.log['2026-01-05'] = {workout:null,dailies:{},food:[{name:'Macka',kcal:300,protein:10}]}; save()")
    go(page, "profil")
    page.fill("#acctemail", "test@exempel.se")
    page.click("[data-sendcode]")
    page.wait_for_selector("#acctcode")
    page.fill("#acctcode", "000000")
    page.click("[data-verifycode]")
    page.wait_for_function("account.msg.includes('stämmer inte')")
    page.fill("#acctcode", "123456")
    page.click("[data-verifycode]")
    page.wait_for_function("account.step === 'in' && Object.keys(window.__db).length >= 2")
    assert "test@exempel.se" in page.inner_text(KONTO)
    # Rensad webbläsare: datan kommer tillbaka från kontot
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_function("cloud.status === 'cloud'")
    assert page.evaluate("S.log['2026-01-05'].food[0].name") == "Macka"
    page.click("[data-tab=profil]")
    page.click("[data-signout]")
    assert page.evaluate("cloud.status") == "local"



def test_logga_in_fran_startsidan(page):
    page.context.route("**/config.js", lambda r: r.fulfill(
        body='window.DRIV_CONFIG = { supabaseUrl: "https://exempel.supabase.co", supabaseAnonKey: "nyckel" };',
        content_type="application/javascript"))
    # Ett konto med färdigt upplägg och lite logg
    start(page, SUPABASE_MOCK)
    page.evaluate("S.log['2026-01-05'] = {workout:null,dailies:{},food:[{name:'Macka',kcal:300,protein:10}]}; save()")
    go(page, "profil")
    page.fill("#acctemail", "test@exempel.se")
    page.click("[data-sendcode]")
    page.fill("#acctcode", "123456")
    page.click("[data-verifycode]")
    page.wait_for_function("account.step === 'in' && Object.keys(window.__db).length >= 2")
    # Ny enhet: tom webbläsare och utloggad, startsidan visas
    page.evaluate("localStorage.clear(); sessionStorage.removeItem('sess')")
    page.reload()
    assert page.locator("[data-savesetup]").count() == 1
    page.click("[data-welcomelogin]")
    page.fill("#acctemail", "test@exempel.se")
    page.click("[data-sendcode]")
    page.fill("#acctcode", "123456")
    page.click("[data-verifycode]")
    page.wait_for_function("account.step === 'in' && S.setupDone && tab === 'idag'")
    assert page.evaluate("S.log['2026-01-05'].food[0].name") == "Macka"
    assert page.locator("[data-savesetup]").count() == 0


def test_inloggad_utan_upplagg_far_besked(page):
    page.context.route("**/config.js", lambda r: r.fulfill(
        body='window.DRIV_CONFIG = { supabaseUrl: "https://exempel.supabase.co", supabaseAnonKey: "nyckel" };',
        content_type="application/javascript"))
    open_app(page, SUPABASE_MOCK)
    page.click("[data-welcomelogin]")
    page.fill("#acctemail", "ny@exempel.se")
    page.click("[data-sendcode]")
    page.fill("#acctcode", "123456")
    page.click("[data-verifycode]")
    page.wait_for_function("cloud.status === 'cloud'")
    text = page.inner_text("#app")
    assert "Inloggad som ny@exempel.se" in text and "inget sparat upplägg" in text
    assert page.locator("[data-welcomelogin]").count() == 0
    page.click("[data-savesetup]")
    page.wait_for_function("window.__db.settings && window.__db.settings.setupDone")


def test_startsidan_utan_konto_visar_ingen_inloggning(page):
    open_app(page)
    assert page.locator("[data-welcomelogin]").count() == 0


# ---------- Veckobrev ----------

def test_veckobrev_pa_sondag(page):
    import datetime
    page.clock.set_fixed_time(datetime.datetime(2026, 10, 25, 18, 0))  # söndag
    start(page)
    seed(page, """const d = S.plan.days;
      S.log['2026-10-13'] = {workout:{dayId:d[0].id,done:true,sets:{bankpress:[{kg:80,reps:8,ok:true}]}},dailies:{},food:[]};
      S.log['2026-10-20'] = {workout:{dayId:d[0].id,done:true,sets:{bankpress:[{kg:82.5,reps:8,ok:true}]}},dailies:{},food:[]}""")
    letter = page.inner_text(".letter-card")
    assert "1 av 3" in letter and "Bänkpress 82,5 kg × 8" in letter
    page.click("[data-letterclose]")
    assert page.locator(".letter-card").count() == 0
    page.reload()
    assert page.locator(".letter-card").count() == 0


# ---------- Tyck till ----------

def test_tyck_till_skickar_synpunkt(page):
    page.context.route("**/config.js", lambda r: r.fulfill(
        body='window.DRIV_CONFIG = { supabaseUrl: "https://exempel.supabase.co", supabaseAnonKey: "nyckel" };',
        content_type="application/javascript"))
    start(page, SUPABASE_MOCK)
    go(page, "profil")
    page.click("[data-fbsend]")
    assert "Skriv något" in page.inner_text('.card:has(h2:text-is("Tyck till"))')
    page.evaluate("window.__fbFail = true")
    page.fill("#fbtext", "Vilotimern är toppen")
    page.click("[data-fbsend]")
    page.wait_for_function("feedback.msg.includes('Kunde inte')")
    assert page.input_value("#fbtext") == "Vilotimern är toppen"
    page.evaluate("window.__fbFail = false")
    page.fill("#fbemail", "jag@exempel.se")
    page.click("[data-fbsend]")
    page.wait_for_function("feedback.sent")
    assert page.evaluate("window.__fb") == {"message": "Vilotimern är toppen", "email": "jag@exempel.se", "page": "profil"}
    assert "Tack" in page.inner_text('.card:has(h2:text-is("Tyck till"))')
