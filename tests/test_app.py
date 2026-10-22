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
    go(page, "historik")
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
    go(page, "historik")
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
    assert page.evaluate("JSON.stringify(day().workouts[0].sets.bankpress[0])") == '{"ok":true,"reps":6,"kg":82.5}'
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


WAKELOCK_MOCK = """window.__wake = []; Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => {
  window.__wake.push('på'); const l = new EventTarget(); l.release = async () => { window.__wake.push('av'); }; return l; } } });"""


def test_fokuslage_en_ovning_i_taget(page):
    start(page, WAKELOCK_MOCK)
    seed(page, "S.log[shift(TODAY,-7)] = {workouts:[{dayId:S.plan.days[0].id,done:true,sets:{bankpress:[{kg:80,reps:8,ok:true},{kg:80,reps:7,ok:true}]}}],dailies:{},food:[]}")
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    page.click("[data-focusstart]")
    assert page.evaluate("tab") == "pass" and page.locator(".focus").count() == 1
    assert "Bänkpress" in page.inner_text(".focus h2")
    assert "förra: 80 kg × 8" in page.inner_text(".fset >> nth=0")
    page.wait_for_function("window.__wake.includes('på')")
    # Stegen utgår från dagens mål (82,5 × 6) som syns i de tomma fälten
    page.click('[data-step=kg][data-i="0"][data-dir="1"]')
    assert page.evaluate("workoutsOn(TODAY)[0].sets.bankpress[0].kg") == 85
    page.click('[data-step=kg][data-i="0"][data-dir="1"]')
    page.click('[data-step=reps][data-i="0"][data-dir="-1"]')
    assert page.evaluate("JSON.stringify(workoutsOn(TODAY)[0].sets.bankpress[0])") == '{"kg":87.5,"reps":5}'
    # Alla set avbockade: fokus går vidare till nästa övning
    for i in range(4):
        page.click(f'[data-ok=bankpress][data-i="{i}"]')
    assert page.evaluate("focus.idx") == 1
    assert "Lutande hantelpress" in page.inner_text(".focus h2")
    # Till sista övningen och spara passet
    page.click(f'[data-focusgo="{page.evaluate("S.plan.days[0].ex.length - 1")}"]')
    page.click("[data-focusend]")
    assert page.evaluate("focus") is None and page.evaluate("tab") == "historik"
    assert page.evaluate("workoutsOn(TODAY)[0].done") is True
    assert page.evaluate("window.__wake") == ["på", "av"]


def test_vikten_foljer_med_och_orimliga_tal_begransas(page):
    start(page)
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    page.click("[data-focusstart]")
    page.click('[data-focusgo="1"]')   # Lutande hantelpress, första gången
    kg = lambda i: page.locator(f'[data-set=lutande_hantelpress][data-f=kg][data-i="{i}"]')
    kg(0).fill("1000000")
    kg(0).press("Enter")
    assert kg(0).input_value() == "500"
    assert "Högst 500 kg" in page.inner_text(".toast")
    kg(0).fill("24")
    kg(0).press("Enter")
    assert kg(1).get_attribute("placeholder") == "24" and kg(2).get_attribute("placeholder") == "24"
    page.click('[data-ok=lutande_hantelpress][data-i="0"]')
    page.click('[data-ok=lutande_hantelpress][data-i="1"]')
    assert page.evaluate("workoutsOn(TODAY)[0].sets.lutande_hantelpress[1].kg") == 24
    # Stegen utgår också från vikten i setet före
    page.click('[data-step=kg][data-i="2"][data-dir="1"]')
    assert page.evaluate("workoutsOn(TODAY)[0].sets.lutande_hantelpress[2].kg") == 26


def test_bilder_ar_stilla_i_listor_men_animeras_ensamma(page):
    start(page)
    assert page.locator(".thumb animate").count() == 0
    page.click(".thumbs .thumb >> nth=0")
    assert page.locator(".sheet .fig animate").count() > 0


def test_vilotimer(page):
    start(page, "window.__vib = []; navigator.vibrate = p => { window.__vib.push(p); return true; };")
    go(page, "pass")
    page.click('[data-ok=bankpress][data-i="0"]')
    assert page.inner_text(".rest-time") == "1:30"
    page.click('[data-restadd="15"]')
    assert page.inner_text(".rest-time") == "1:45"
    # Med en övning öppen ligger timern under dialogen, inte över den, även med stor text
    page.add_style_tag(content=".rest-row { font-size: 22px; padding: 14px 0; }")
    page.click('[data-info=militarpress]')
    page.wait_for_timeout(100)
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
    go(page, "idag")
    page.click("[data-dcheck=plankan]")
    assert page.evaluate("dailyDone(TODAY, 'plankan')")
    # Löpningen får samma bock när km är ifyllt
    run_ok = "document.querySelector('[data-runcheck=lop]').classList.contains('on')"
    assert page.evaluate(run_ok) is False
    page.click("[data-runcheck=lop]")
    assert page.evaluate("document.activeElement.dataset.f") == "km"
    page.fill("[data-run=lop][data-f=km]", "5")
    page.press("[data-run=lop][data-f=km]", "Tab")
    assert page.evaluate(run_ok) is True


def test_kroppsvikt_en_gang_i_veckan_och_kalorimal(page):
    import datetime
    page.clock.install(time=datetime.datetime(2026, 10, 22, 8, 0))   # torsdag
    open_app(page)
    page.select_option("[data-prof=goal]", "cut")
    page.click("[data-savesetup]")
    seed(page, "S.weights['2026-10-15'] = 82; S.weights['2026-10-16'] = 81.8")
    # Ingen vägning den här veckan: rutan ber om en
    assert "Veckans vägning" in page.inner_text("#app")
    page.fill("#wkg", "70")
    page.click("[data-wsave]")
    assert page.evaluate("S.weights['2026-10-22']") == 70 and page.evaluate("S.profile.weight") == 70
    assert page.evaluate("kcalGoal()") < 2360
    # Därefter bara veckans vikt; Ändra skriver över samma vägning
    card = page.locator('.card:has(h2:text-is("Veckans vikt"))')
    assert page.locator("#wkg").count() == 0 and "mot förra veckan" in card.inner_text()
    page.click("[data-wedit]")
    page.fill("#wkg", "71")
    page.click("[data-wsave]")
    assert page.evaluate("Object.keys(S.weights).filter(d => d >= '2026-10-19')") == ["2026-10-22"]
    # Före vägningsdagen syns ingen ruta
    go(page, "profil")
    page.select_option("[data-weighday]", "4")
    page.evaluate("delete S.weights['2026-10-22']; save()")
    go(page, "idag")
    assert "Veckans" not in page.inner_text("#app")
    # Vikten kan döljas och visas igen
    go(page, "profil")
    page.select_option("[data-weighday]", "0")
    go(page, "idag")
    page.click("[data-hideweight]")
    assert page.locator("#wkg").count() == 0
    go(page, "historik")
    assert page.locator('.card:has(h2:text-is("Vikt"))').count() == 0
    go(page, "profil")
    page.click("[data-showweight]")
    go(page, "idag")
    assert page.locator("#wkg").count() == 1


def test_paminnelse_i_kalendern(page):
    start(page)
    go(page, "profil")
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
    page.click('[data-addto="1"]')
    assert page.evaluate("parseFood('2 dl mjölk och 2 ägg').kcal") == 246
    assert page.evaluate("parseFood('ryggbif').items[0].corrected") == "Ryggbiff"
    page.type("#fname", "150 g ryggb")
    page.click('#fsugg [data-sugg="0"]')
    assert page.input_value("#fname") == "150 g ryggbiff"
    assert page.input_value("#fkcal") == "195"
    page.type("#fname", " och kottbu")
    assert "Köttbull" in page.inner_text("#fsugg")
    page.click(".sheet h2")
    page.click("[data-addfood]")
    assert page.evaluate("day().food.length") == 1


def test_kost_maltider_snabbval_antal_och_upprepa(page):
    start(page)
    seed(page, """S.log[shift(TODAY, -1)] = {workouts:[], dailies:{}, food:[
      {name:'Gröt', kcal:300, protein:10, meal:0}, {name:'Ägg', kcal:154, protein:13, meal:0, qty:2, per:{kcal:77, protein:6.5}},
      {name:'Pasta', kcal:700, protein:25, meal:1}]}""")
    go(page, "kost")
    # Sidan visar bara måltiderna; att lägga till sker i ett eget fönster per måltid
    assert page.locator("#fname").count() == 0
    page.click('[data-repeat="0"]')
    assert page.evaluate("day().food.filter(f => f.meal === 0).map(f => [f.name, f.kcal, f.qty || 1])") == [["Gröt", 300, 1], ["Ägg", 154, 2]]
    # Fritext i lunch
    page.click('[data-addto="1"]')
    page.fill("#fname", "1 banan")
    page.click("[data-addfood]")
    assert page.evaluate("day().food.at(-1).meal") == 1
    # Samma snabbval två gånger blir två stycken, och − tar bort ett
    page.click('.qrow:has-text("Ägg") [data-quick]')
    page.click('.qrow:has-text("Ägg") [data-quick]')
    page.click('.qrow:has-text("Ägg") [data-quick]')
    page.click('.qrow:has-text("Ägg") [data-qminus]')
    assert page.evaluate("day().food.filter(f => f.meal === 1 && f.name === 'Ägg').map(f => [f.qty, f.kcal])") == [[2, 154]]
    # + bredvid antalet ökar, och Klar syns även i ett lågt fönster
    page.click('.qrow:has-text("Ägg") [aria-label="Mer Ägg"]')
    assert page.evaluate("day().food.find(f => f.meal === 1 && f.name === 'Ägg').qty") == 3
    page.click('.qrow:has-text("Ägg") [data-qminus]')
    page.set_viewport_size({"width": 1200, "height": 500})
    klar = page.locator(".sheet [data-fsclose].wide").bounding_box()
    assert klar["y"] + klar["height"] <= 500
    page.set_viewport_size({"width": 390, "height": 844})
    page.click('.sheet [data-fsclose].wide')
    assert page.locator(".sheet").count() == 0
    assert "Ägg × 2" in page.inner_text(".mcard >> nth=1")
    # Tryck på en loggad sak: ändra antal, gör till favorit, ta bort
    i = page.evaluate("day().food.findIndex(f => f.meal === 1 && f.name === 'Ägg')")
    page.click(f'[data-fooditem="{i}"]')
    page.click('[data-qty="1"]')
    assert page.evaluate(f"day().food[{i}].kcal") == 231
    page.click("[data-itemfav]")
    assert page.evaluate("S.favs.map(f => [f.name, f.kcal])") == [["Ägg", 77]]
    page.click(".sheet [data-delfood]")
    assert page.locator(".sheet").count() == 0
    assert page.evaluate("day().food.some(f => f.meal === 1 && f.name === 'Ägg')") is False
    # Frukosten sparad som måltid och loggad i middag del för del
    page.click('[data-addto="0"]')
    page.click('[data-savegroup="0"]')
    page.click('.sheet [data-fsclose].wide')
    page.click('[data-addto="3"]')
    page.click('.qrow:has-text("Frukost:") [data-quick]')
    assert page.evaluate("day().food.filter(f => f.meal === 3).map(f => [f.name, f.qty || 1])") == [["Gröt", 1], ["Ägg", 2]]
    # Ungefärlig måltid i en tom måltid
    page.click('.sheet [data-fsclose].wide')
    page.click('[data-addto="2"]')
    page.fill("#qm-2", "300")
    page.click('[data-qmeal="2"]')
    assert page.evaluate("day().food.at(-1).name") == "Mellanmål (ca 300 kcal)"


def test_mangd_styr_kalorierna(page):
    start(page)
    go(page, "kost")
    page.click('[data-addto="1"]')
    page.fill("#fname", "bolognese")
    page.click(".sheet h2")
    row = page.locator("[data-drow]").first
    assert "Spaghetti bolognese" in row.inner_text() and "675 kcal" in row.inner_text()
    assert row.locator(".amt-u").input_value() == "portion"
    # Byt till gram och skriv 100 g; kcal räknas om
    row.locator(".amt-u").select_option("g")
    assert row.locator(".amt-n").input_value() == "450"
    row.locator(".amt-n").fill("100")
    assert "150 kcal" in row.inner_text()
    page.click("[data-addfood]")
    f = page.evaluate("day().food[0]")
    assert [f["name"], f["kcal"], f["protein"], f["amt"]["n"], f["amt"]["unit"]] == ["Spaghetti bolognese", 150, 7, 100, "g"]
    # Ändra mängden i efterhand på det loggade
    page.click('.sheet [data-fsclose].wide')
    page.click('[data-fooditem="0"]')
    page.locator('[data-iamt="n"]').fill("300")
    page.locator('[data-iamt="n"]').press("Enter")
    page.wait_for_function("day().food[0].kcal === 450")
    page.locator('[data-iamt="u"]').select_option("portion")
    page.wait_for_function("day().food[0].amt.unit === 'portion'")
    assert page.evaluate("[day().food[0].amt.n, day().food[0].kcal]") == [0.5, 338]
    # Två ägg: flera rader i en text blir var sin rad med sin mängd
    page.click("[data-itemclose].primary")
    page.click('[data-addto="0"]')
    page.fill("#fname", "2 ägg och 1 dl mjölk")
    page.click(".sheet h2")
    page.click("[data-addfood]")
    assert page.evaluate("day().food.filter(f => f.meal === 0).map(f => [f.name, f.amt.n, f.amt.unit, f.kcal])") == [["Ägg", 2, "st", 154], ["Mjölk", 1, "dl", 46]]


def test_streckkod_fran_open_food_facts(page):
    start(page, "window.BarcodeDetector = class { async detect() { return window.__code ? [{ rawValue: window.__code }] : []; } };")
    go(page, "kost")
    page.click('[data-addto="0"]')
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
    page.click('[data-addto="0"]')
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
    select: () => {
      const all = Object.entries(window.__db).map(([id, data]) => ({ id, data: JSON.parse(JSON.stringify(data)) }));
      const res = Promise.resolve({ data: all, error: null });
      res.in = async (k, ids) => ({ data: all.filter(r => ids.includes(r.id)), error: null });
      return res;
    },
    upsert: async row => { window.__db[row.id] = JSON.parse(JSON.stringify(row.data)); keep(); return { error: null }; },
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



SB_CONFIG = 'window.DRIV_CONFIG = { supabaseUrl: "https://exempel.supabase.co", supabaseAnonKey: "nyckel" };'


def login(page, email="test@exempel.se"):
    go(page, "profil")
    page.fill("#acctemail", email)
    page.click("[data-sendcode]")
    page.fill("#acctcode", "123456")
    page.click("[data-verifycode]")
    page.wait_for_function("account.step === 'in' && cloud.status === 'cloud' && !cloud.pushing && window.__db.settings")


def month_doc(page):
    return page.evaluate("window.__db['m-' + TODAY.slice(0, 7)]")


def test_synk_tappar_inte_pass_som_loggats_offline(page):
    """Mat loggad på datorn och ett pass loggat på mobilen samma dag finns båda kvar."""
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page, SUPABASE_MOCK)
    page.evaluate("day().food.push({name:'Gröt',kcal:300,protein:10}); save()")
    login(page)
    page.wait_for_function("(() => { const m = window.__db['m-' + TODAY.slice(0, 7)]; return m && m.days[TODAY]; })()")
    # Datorn loggar middag efter att mobilen senast synkade
    page.evaluate("""() => { const m = window.__db['m-' + TODAY.slice(0, 7)], L = m.days[TODAY];
      L.food.push({name:'Lax', kcal:500, protein:40}); L._t.food = Date.now() + 1000; }""")
    # Mobilen loggar ett set utan att ha sett middagen
    go(page, "pass")
    page.click('[data-ok=bankpress][data-i="0"]')
    page.wait_for_function("""(() => { const L = window.__db['m-' + TODAY.slice(0, 7)].days[TODAY];
      return L.workouts && L.workouts.length && L.food.length === 2; })()""")
    L = month_doc(page)["days"][page.evaluate("TODAY")]
    assert [f["name"] for f in L["food"]] == ["Gröt", "Lax"]
    assert L["workouts"][0]["sets"]["bankpress"][0]["ok"] is True
    # Och mobilen visar middagen också
    assert page.evaluate("S.log[TODAY].food.length") == 2


def test_tom_dag_skriver_inte_over_annan_enhets_loggning(page):
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page, SUPABASE_MOCK)
    login(page)
    # En annan enhet har loggat mat en dag som den här enheten bara har en tom post för
    page.evaluate("""() => { window.__D = TODAY.slice(0, 8) + (TODAY.endsWith('-01') ? '02' : '01');
      const m = window.__db['m-' + TODAY.slice(0, 7)];
      m.days[__D] = { workouts: [], dailies: {}, food: [{ name: 'Lax', kcal: 500, protein: 40 }], _t: { food: 1 } }; }""")
    page.evaluate("day(__D); S.letterSeen = 'x'; save()")
    page.wait_for_function("S.log[__D].food.length === 1 && !cloud.pushing")
    page.wait_for_function("window.__db['m-' + TODAY.slice(0, 7)].days[__D].food.length === 1")


def test_synk_vid_ateranslutning_valjer_nyaste_delen(page):
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page, SUPABASE_MOCK)
    login(page)
    # Mobilen tappar kontakten och loggar ett pass medan datorn ändrar kalorimålet
    page.evaluate("cloud.col = null")
    go(page, "pass")
    page.click('[data-ok=bankpress][data-i="0"]')
    page.evaluate("""() => { const st = window.__db.settings; st.kcalOverride = 2500; st._t = Object.assign({}, st._t, { kcalOverride: Date.now() + 1000 }); }""")
    page.evaluate("connectSupabase()")
    page.wait_for_function("S.kcalOverride === 2500 && !cloud.pushing")
    page.wait_for_function("""(() => { const m = window.__db['m-' + TODAY.slice(0, 7)];
      return m && m.days[TODAY] && m.days[TODAY].workouts.length === 1; })()""")
    assert page.evaluate("workoutsOn(TODAY)[0].sets.bankpress[0].ok") is True


def test_sammanslagning_del_for_del(page):
    open_app(page)
    r = page.evaluate("""() => {
      const a = { food: [1], dailies: { x: true }, _t: { food: 5, dailies: 1 } };
      const b = { food: [2], dailies: {}, workouts: [9], _t: { food: 3, dailies: 2 } };
      const lika = mergeParts({ food: [1] }, { food: [2] });
      const bortTagen = mergeParts({ _t: { note: 9 } }, { note: 'gammal', _t: { note: 1 } });
      return { m: mergeParts(a, b), lika, bortTagen };
    }""")
    assert r["m"]["food"] == [1] and r["m"]["dailies"] == {} and r["m"]["workouts"] == [9]
    assert r["lika"]["food"] == [2]          # lika gammalt: kontots version
    assert "note" not in r["bortTagen"]      # det som tagits bort senast förblir borttaget


def test_tva_pass_samma_dag_och_gammalt_format(page):
    start(page)
    seed(page, "S.log['2026-01-05'] = {workout:{dayId:S.plan.days[0].id,done:true,sets:{bankpress:[{kg:80,reps:8,ok:true}]}},dailies:{},food:[]}")
    assert page.evaluate("S.log['2026-01-05'].workouts.length") == 1
    assert page.evaluate("'workout' in S.log['2026-01-05']") is False
    go(page, "pass")
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    page.click('[data-ok=bankpress][data-i="0"]')
    page.click(f'[data-pick="{page.evaluate("S.plan.days[1].id")}"]')
    page.click('[data-ok=marklyft][data-i="0"]')
    assert page.evaluate("workoutsOn(TODAY).map(w => Object.keys(w.sets)[0])") == ["bankpress", "marklyft"]
    for d in page.evaluate("S.plan.days.slice(0, 2).map(d => d.id)"):
        page.click(f'[data-pick="{d}"]')
        page.click(f'[data-finish="{d}"]')
        go(page, "pass")
    assert page.evaluate("weekSummary(weekStart(TODAY)).passes") == 2


def test_paminnelse_om_konto_efter_tre_dagar(page):
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page, SUPABASE_MOCK)
    seed(page, "for (const i of [1, 2]) S.log[shift(TODAY, -i)] = {workouts:[],dailies:{},food:[{name:'Ägg',kcal:150,protein:12}]}")
    assert page.locator(".nudge").count() == 0
    seed(page, "S.log[shift(TODAY, -3)] = {workouts:[],dailies:{},food:[{name:'Ägg',kcal:150,protein:12}]}")
    page.click("[data-nudgelater]")
    assert page.locator(".nudge").count() == 0
    page.evaluate("S.nudgeUntil = null; render()")
    page.click("[data-gokonto]")
    assert page.evaluate("tab") == "profil"
    assert page.evaluate("document.activeElement.id") == "acctemail"
    login(page)
    go(page, "idag")
    assert page.locator(".nudge").count() == 0

def test_nytt_datum_efter_midnatt(page):
    import datetime
    page.clock.install(time=datetime.datetime(2026, 10, 21, 23, 59, 0))
    start(page)
    assert page.evaluate("TODAY") == "2026-10-21"
    page.clock.fast_forward("02:00")
    page.evaluate("document.querySelector('[data-tab=kost]').click()")
    assert page.evaluate("TODAY") == "2026-10-22"
    page.evaluate("document.querySelector('[data-tab=kost]').click()")
    assert page.evaluate("tab") == "kost"


# ---------- Historik ----------

def test_fyra_flikar_och_profil_via_kugghjulet(page):
    start(page)
    assert page.evaluate("[...document.querySelectorAll('#nav [data-tab]')].map(b => b.dataset.tab)") == ["idag", "pass", "kost", "historik"]
    # Flikarna ligger centrerat, även på en bred skärm
    page.set_viewport_size({"width": 1400, "height": 800})
    first, last = page.locator("#nav button").first.bounding_box(), page.locator("#nav button").last.bounding_box()
    assert abs((first["x"] - 0) - (1400 - last["x"] - last["width"])) < 2
    page.set_viewport_size({"width": 390, "height": 844})
    page.click(".gear")
    assert page.evaluate("tab") == "profil"
    # Dailys bockas av direkt på Idag
    go(page, "idag")
    page.click("[data-dcheck=plankan]")
    assert page.evaluate("dailyDone(TODAY, 'plankan')")


def test_historik_andra_en_tidigare_dag(page):
    import datetime
    page.clock.install(time=datetime.datetime(2026, 10, 22, 12, 0))
    start(page)
    seed(page, "S.log['2026-10-20'] = {workouts:[{dayId:S.plan.days[0].id,done:true,sets:{bankpress:[{kg:80,reps:8,ok:true}]}}],dailies:{},food:[]}")
    go(page, "historik")
    assert page.locator('[data-histday="2026-10-20"] .cdot').count() == 1
    assert page.locator('[data-histday="2026-10-23"]').is_disabled()
    # Igår: dailys och vikt direkt i fönstret
    page.click('[data-histday="2026-10-21"]')
    assert "Igår" in page.inner_text(".sheet h2")
    page.click(".sheet [data-dcheck=plankan]")
    page.fill(".sheet #wkg", "80.5")
    page.click(".sheet [data-wsave]")
    assert page.evaluate("S.log['2026-10-21'].dailies.plankan") is True
    assert page.evaluate("dailyDone('2026-10-22', 'plankan')") is False
    assert page.evaluate("S.weights['2026-10-21']") == 80.5
    # Mat i efterhand: Kost öppnas för den dagen och Klar leder tillbaka
    page.click("[data-hfood]")
    assert "igår" in page.inner_text(".editbar")
    page.click('[data-addto="2"]')
    page.fill("#fname", "1 banan")
    page.click("[data-addfood]")
    page.click(".sheet [data-fsclose].wide")
    page.click("[data-editdone]")
    assert page.evaluate("tab") == "historik" and "Igår" in page.inner_text(".sheet h2")
    assert page.evaluate("S.log['2026-10-21'].food.map(f => f.meal)") == [2]
    assert page.evaluate("(S.log['2026-10-22'] || {food: []}).food.length") == 0
    # Ett pass i efterhand
    page.click("[data-hpass='']")
    assert page.evaluate("[tab, logDate()]") == ["pass", "2026-10-21"]
    page.click(f'[data-pick="{page.evaluate("S.plan.days[1].id")}"]')
    page.click('[data-ok=marklyft][data-i="0"]')
    page.click(f'[data-finish="{page.evaluate("S.plan.days[1].id")}"]')
    assert page.evaluate("[tab, histDay]") == ["historik", "2026-10-21"]
    assert page.evaluate("workoutsOn('2026-10-21').map(w => w.done)") == [True]
    assert page.evaluate("workoutsOn('2026-10-22').length") == 0
    # Till en annan flik: tillbaka till idag
    go(page, "idag")
    assert page.evaluate("logDate()") == "2026-10-22"

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
