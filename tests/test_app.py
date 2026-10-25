"""Webbläsartester för Driv. Kör med: python -m pytest tests"""
from conftest import go, open_app, start

KONTO = '.card:has(h2:text-is("Konto"))'


def open_ex(page, ex_id):
    """Öppnar en övning i passet i fokusläget, från listan i Träna eller från en annan övning."""
    if page.locator(".pastlog").count():
        return   # i efterhand syns alla övningar och set direkt
    i = page.evaluate(f"currentPassDay().ex.findIndex(x => x.id === '{ex_id}')")
    page.click(f'[data-focusgo="{i}"]' if page.locator(".focus").count() else f'[data-focusex="{i}"]')


def to_list(page):
    """Lämnar fokusläget och visar listan med passets övningar."""
    if page.locator(".focus").count():
        page.click("[data-focusexit]")


def add_to(page, meal):
    """Öppnar fönstret för att lägga till mat och väljer måltid."""
    page.click("[data-addto]")
    page.click(f'[data-sheetmeal="{meal}"]')


def prof(page, sec):
    """Öppnar Profil och fäller ut en rad (om den inte redan är utfälld)."""
    go(page, "profil")
    if page.locator(f"#p-{sec}.open").count() == 0:
        page.click(f'[data-psec="{sec}"]')


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
    page.click("[data-setupmore]")
    page.fill('[data-dayname="0"]', "Bröst & triceps")
    page.press('[data-dayname="0"]', "Tab")
    page.click('[data-openpick="draft:0"]')
    page.fill("#exsearch", "bänk")
    page.click(".pick:not([hidden]) [data-add]")
    page.click('[data-count="3"]')
    assert page.evaluate("draft.days[0].name") == "Bröst & triceps"
    page.click("[data-savesetup]")
    assert "Bröst & triceps" in page.inner_text(".daypass")


def test_hem_visar_dagens_ovningar(page):
    start(page)
    seed(page, "S.log[shift(TODAY,-7)] = {workouts:[{dayId:S.plan.days[0].id,done:true,sets:{bankpress:[{kg:80,reps:8,ok:true}]}}],dailies:{},food:[]}")
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    assert page.inner_text("#nav [data-tab=idag]").endswith("Hem")
    rows = page.locator(".daypass .exnames li")
    assert rows.count() == page.evaluate("S.plan.days[0].ex.length")
    assert "Bänkpress" in rows.first.inner_text() and "4 × 6–8 · 82,5 kg × 6" in rows.first.inner_text()
    assert page.locator(".plus-card").count() == 0
    page.click(".daypass [data-focusstart]")
    assert page.locator(".focus").count() == 1

def test_kort_start_och_paminnelse_om_kalorimal(page):
    open_app(page)
    # Första gången: bara upplägg, antal och dagar; resten är valfritt
    assert page.locator("[data-prof]").count() == 0 and page.locator("[data-openpick^=draft]").count() == 0
    page.click("[data-savesetup]")
    go(page, "kost")
    assert "standardvärden" in page.inner_text(".dayring")
    page.click(".dayring [data-tab=profil]")
    page.fill("[data-prof=weight]", "72")
    page.press("[data-prof=weight]", "Tab")
    go(page, "kost")
    assert "standardvärden" not in page.inner_text(".dayring")

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
    open_ex(page, "bankpress")
    page.fill('[data-set=bankpress][data-i="0"][data-f=kg]', "82.5")
    page.press('[data-set=bankpress][data-i="0"][data-f=kg]', "Tab")
    page.fill('[data-set=bankpress][data-i="0"][data-f=reps]', "8")
    page.press('[data-set=bankpress][data-i="0"][data-f=reps]', "Tab")
    page.click('[data-ok=bankpress][data-i="0"]')
    go(page, "historik")
    page.click("[data-weekex]")
    row = page.locator(".exrow", has_text="Bänkpress").inner_text()
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
        open_ex(page, ex)
        sel = f'[data-set={ex}][data-i="0"][data-f=reps]'
        page.fill(sel, val)
        page.press(sel, "Tab")
    go(page, "historik")
    page.click("[data-weekex]")
    assert "+3 reps" in page.locator(".exrow", has_text="Armhävningar").inner_text()
    assert "+15 s" in page.locator(".exrow", has_text="Plankan").inner_text()


def test_dagens_mal_fylls_i_och_pers_firas(page):
    start(page)
    seed(page, "S.log[shift(TODAY,-7)] = {workout:{dayId:S.plan.days[0].id,done:true,sets:{bankpress:[{kg:80,reps:8,ok:true}],dips:[{reps:10,ok:true}]}},dailies:{},food:[]}")
    go(page, "pass")
    page.click("[data-pick]")
    # Listan visar varje övning på en rad med förslag utifrån förra gången
    assert "förslag 82,5 kg × 6" in page.locator(".exlist .krow", has_text="Bänkpress").inner_text()
    assert "förslag 11 reps" in page.locator(".exlist .krow", has_text="Dips").inner_text()
    open_ex(page, "bankpress")
    assert "Bänkpress" in page.inner_text(".focus h2")
    page.click('[data-ok=bankpress][data-i="0"]')
    assert page.evaluate("JSON.stringify(day().workouts[0].sets.bankpress[0])") == '{"ok":true,"reps":6,"kg":82.5}'
    assert "Nytt PB" in page.inner_text(".toast")


def test_spara_pass_och_oppna_igen(page):
    start(page)
    go(page, "pass")
    open_ex(page, "bankpress")
    for i in range(4):
        page.click(f'[data-ok=bankpress][data-i="{i}"]')
    to_list(page)
    assert "✓" in page.inner_text('.exlist .krow:has-text("Bänkpress") .setcount')
    assert "1 av 6 klara" in page.inner_text("button[data-finish]")
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


def test_ovningar_visar_utrustning_och_hur_vikten_skrivs(page):
    open_app(page)
    assert page.evaluate("Object.keys(EX).filter(id => EX[id].cat !== 'cardio' && !GEAR[gearOf(id)])") == []
    assert page.evaluate("Object.keys(EX).filter(id => !EX[id].A || !EX[id].cues.length)") == []
    assert page.evaluate("Object.keys(EX).length") >= 75
    page.evaluate("modal = { info: 'bencurl' }; render()")
    assert "Maskin" in page.inner_text(".gearbox") and "sprinten" in page.inner_text(".gearbox")
    page.evaluate("modal = { info: 'bankpress' }; render()")
    assert "stången (oftast 20 kg)" in page.inner_text(".gearbox")


def test_upplagg_har_tillbaka_till_profil(page):
    start(page)
    go(page, "profil")
    page.click('.prow-head[data-tab="upplagg"]')
    page.click(".backlink")
    assert page.evaluate("tab") == "profil" and page.evaluate("draft") is None


def test_utseende_kan_valjas(page):
    start(page)
    prof(page, "utseende")
    page.click('[data-theme-set="dark"]')
    assert page.evaluate("document.documentElement.dataset.theme") == "dark"
    page.reload()
    assert page.evaluate("document.documentElement.dataset.theme") == "dark"
    assert page.evaluate("getComputedStyle(document.body).backgroundColor") == "rgb(15, 18, 21)"
    prof(page, "utseende")
    page.click('[data-theme-set="auto"]')
    assert page.evaluate("document.documentElement.dataset.theme") is None


def test_upplagg_och_ovningar_andras_fran_hem(page):
    start(page)
    go(page, "idag")
    page.click('.homepasses [data-tab="upplagg"]')
    assert page.evaluate("tab") == "upplagg" and "Hem" in page.inner_text(".backlink")
    page.click(".backlink")
    assert page.evaluate("tab") == "idag"
    # Övningarna i dagens pass ändras direkt i kortet
    n = page.evaluate("currentPassDay ? S.plan.days.find(x => x.id === document.querySelector('.daypass [data-focusstart]').dataset.focusstart).ex.length : 0")
    page.click(".daypass [data-edit]")
    page.click(".daypass [data-xdel] >> nth=0")
    assert page.locator(".daypass [data-xdel]").count() == n - 1
    page.click(".daypass [data-edit]")
    assert page.locator(".daypass .exnames li").count() == n - 1


def test_logga_hela_passet_i_efterhand(page):
    start(page)
    d = page.evaluate("S.plan.days[0].id")
    # Passet efter dagen man loggar har vikter som blir förslag
    seed(page, f"S.log[TODAY] = {{workouts:[{{dayId:'{d}',done:true,sets:{{bankpress:[{{kg:80,reps:8,ok:true}}]}}}}],dailies:{{}},food:[]}}")
    page.evaluate(f"editDate = shift(TODAY, -3); tab = 'pass'; chosenDay = '{d}'; render()")
    assert page.locator("[data-focusstart]").count() == 0 and page.locator(".pastlog").count() == 1
    assert page.get_attribute('[data-set=bankpress][data-f=kg][data-i="0"]', "placeholder") == "80"
    page.click("[data-fillall]")
    w = page.evaluate("workoutsOn(shift(TODAY, -3))[0]")
    assert w["sets"]["bankpress"][0] == {"kg": 80, "reps": 8, "ok": True} and w["done"] is True
    # Ett eget värde skrivs direkt i vyn
    page.fill('[data-set=bankpress][data-f=kg][data-i="1"]', "85")
    page.press('[data-set=bankpress][data-f=kg][data-i="1"]', "Tab")
    assert page.evaluate("workoutsOn(shift(TODAY, -3))[0].sets.bankpress[1].kg") == 85


def test_utveckling_visar_personbasta_och_okning(page):
    start(page)
    d = page.evaluate("S.plan.days[0].id")
    seed(page, f"""S.log[shift(TODAY, -30)] = {{workouts:[{{dayId:'{d}',done:true,sets:{{bankpress:[{{kg:60,reps:8,ok:true}}]}}}}],dailies:{{}},food:[]}};
      S.log[shift(TODAY, -2)] = {{workouts:[{{dayId:'{d}',done:true,sets:{{bankpress:[{{kg:72.5,reps:6,ok:true}},{{kg:70,reps:8,ok:true}}]}}}}],dailies:{{}},food:[]}}""")
    go(page, "historik")
    page.click('[data-hview="utveckling"]')
    row = page.locator('.krow[data-chart="bankpress"]')
    assert "72,5 kg × 6" in row.inner_text() and "+12,5 kg" in row.inner_text() and "60 kg × 8" in row.inner_text()
    assert "2" in page.inner_text(".kstat >> nth=0")
    row.click()
    assert page.locator(".sheet .chart").count() == 1


def test_recept_byggs_och_loggas_per_portion(page):
    start(page)
    go(page, "kost")
    add_to(page, 3)
    page.click("[data-rlist]")
    page.click("[data-rnew]")
    page.fill("#rname", "Lasagne")
    page.fill("#ring", "500 g nötfärs, 2 dl grädde, okändgrej")
    page.click("[data-ringadd]")
    assert page.evaluate("recipeEdit.items.length") == 2
    assert "okändgrej" in page.inner_text(".sheet") and page.input_value("#ring") == "okändgrej"
    page.click('[data-rport="1"]')   # 5 portioner
    total = page.evaluate("recipeTotal(recipeEdit).kcal")
    page.click("[data-rsave]")
    assert page.evaluate("S.recipes.map(r => [r.name, r.portions])") == [["Lasagne", 5]]
    page.click('[data-ruse="0"]')
    f = page.evaluate("day().food.at(-1)")
    assert f["name"] == "Lasagne" and f["meal"] == 3 and abs(f["kcal"] - total / 5) <= 1
    # Receptet syns bland förslagen i andra måltider
    page.click('[data-sheetmeal="1"]')
    assert page.locator('.qadd:has-text("Lasagne")').count() == 1


def test_forslag_sorteras_efter_maltiden_och_har_tak(page):
    start(page)
    many = ",".join(f"{{name:'Sak {i}', kcal:{100 + i}, protein:1, meal:2}}" for i in range(40))
    seed(page, f"""S.log[shift(TODAY, -1)] = {{workouts:[], dailies:{{}}, food:[{{name:'Gröt', kcal:300, protein:10, meal:0}}, {many}]}};
      S.log[shift(TODAY, -2)] = {{workouts:[], dailies:{{}}, food:[{{name:'Gröt', kcal:300, protein:10, meal:0}}]}};
      S.favs = [{{name:'Kaffe', kcal:20, protein:1}}]""")
    go(page, "kost")
    add_to(page, 0)
    # Gröt äts oftast till frukost och kommer först, före favoriten
    assert page.evaluate("quickCache.map(f => f.name).slice(0, 2)") == ["Gröt", "Kaffe"]
    assert page.evaluate("quickCache.length") <= 20


def test_superset_vaxlar_och_vilar_efter_varvet(page):
    start(page)
    go(page, "pass")
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    page.click("[data-edit]")
    page.click('[data-ss][data-idx="0"]')   # bänkpress + lutande hantelpress
    assert page.evaluate("S.plan.days[0].ex[0].ss") is True
    page.click("[data-edit]")
    assert "Superset 1/2" in page.inner_text('.exlist .krow >> nth=0')
    page.click("[data-focusstart]")
    page.click('[data-ok=bankpress][data-i="0"]')
    # Direkt till nästa övning i varvet, utan vila
    assert page.evaluate("focus.idx") == 1 and page.locator(".rest:not(.hidden)").count() == 0
    page.click('[data-ok=lutande_hantelpress][data-i="0"]')
    # Varvet klart: vila och tillbaka till bänkpress
    assert page.evaluate("focus.idx") == 0 and page.evaluate("rest.end > Date.now()") is True


def test_hem_har_en_rad_med_dagens_siffror(page):
    start(page)
    seed(page, "logFood({name: 'Gröt', kcal: 300, protein: 10}, 0)")
    go(page, "idag")
    assert "300" in page.inner_text(".homesum") and "10" in page.inner_text(".homesum")
    page.click(".homesum")
    assert page.evaluate("tab") == "kost"


def test_aktivitet_loggas_och_raknas_som_pass(page):
    start(page)
    go(page, "pass")
    assert page.locator("text=Kommande").count() == 0
    page.click('.actcard [data-actnew="Padel"]')
    page.click('[data-actmin="15"]')   # 75 min
    page.click('[data-actint="3"]')
    page.click("[data-actsave]")
    assert page.evaluate("S.log[TODAY].acts") == [{"name": "Padel", "min": 75, "int": 3}]
    assert page.evaluate("weekSummary(weekStart(TODAY)).passes") == 1
    # En egen aktivitet med sträcka, på Hem
    go(page, "idag")
    page.click('.homeacts [data-actnew=""]')
    page.fill("#actname", "Kanotpaddling")
    page.click('[data-actmin="-15"]')
    page.click('[data-actmin="-15"]')
    page.click('[data-actmin="-15"]')   # 15 min: räknas inte som pass
    page.click("[data-actsave]")
    assert page.evaluate("S.log[TODAY].acts.length") == 2 and page.evaluate("weekSummary(weekStart(TODAY)).passes") == 1
    assert "Kanotpaddling · 15 min" in page.inner_text(".homeacts")
    # Förbrända kcal läggs bara till när man valt det
    goal = page.evaluate("macros().kcal")
    prof(page, "aktiviteter")
    page.click("[data-actkcal]")
    go(page, "kost")
    assert page.evaluate("macros().kcal + burnedOn(TODAY)") > goal
    assert f"{goal + page.evaluate('burnedOn(TODAY)'):,}".replace(",", "\xa0") in page.inner_text(".dayring")
    # Ändra och ta bort
    go(page, "idag")
    page.click('.homeacts [data-actedit="1"]')
    page.click("[data-actdel]")
    assert page.evaluate("S.log[TODAY].acts.length") == 1


def test_dailys_under_passet(page):
    start(page)
    seed(page, "S.daily = [{id:'plankan',sets:3,reps:'45 sek'},{id:'lop',sets:1,reps:''}]")
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    page.click("[data-focusstart]")
    assert "Dailys 0/2" in page.inner_text("[data-fdopen]")
    page.click("[data-fdopen]")
    assert page.locator(".overlay [data-dedit]").count() == 0
    page.click('.overlay [data-dcheck="plankan"]')
    assert page.evaluate("dailyDone(TODAY, 'plankan')") is True
    assert page.locator(".overlay").count() == 1   # fönstret står kvar tills man stänger
    page.click(".overlay button.wide[data-fdclose]")
    assert page.locator(".overlay").count() == 0 and page.locator(".focus").count() == 1
    assert "Dailys 1/2" in page.inner_text("[data-fdopen]")


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
    go(page, "pass")
    assert page.locator(".thumb animate").count() == 0
    page.click('[data-focusex="0"]')
    page.click(".focus .thumb")
    assert page.locator(".sheet .fig animate").count() > 0


def test_forslag_i_efterhand_tar_narmaste_gangen(page):
    import datetime
    page.clock.install(time=datetime.datetime(2026, 10, 22, 12, 0))
    start(page)
    seed(page, """const D = S.plan.days;
      S.log['2026-10-15'] = {workouts:[{dayId:D[0].id,done:true,sets:{militarpress:[{kg:40,reps:8,ok:true}]}}],dailies:{},food:[]};
      S.log['2026-10-01'] = {workouts:[{dayId:D[0].id,done:true,sets:{bankpress:[{kg:70,reps:8,ok:true}]}}],dailies:{},food:[]}""")
    # Ett pass den 8 oktober i efterhand: militärpress gjordes först efteråt, bänkpress före
    go(page, "historik")
    page.click('[data-histday="2026-10-08"]')
    page.click("[data-hpass='']")
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    open_ex(page, "militarpress")
    assert page.get_attribute('[data-set=militarpress][data-f=kg][data-i="0"]', "placeholder") == "40"
    # Förslagen är det som faktiskt lyftes närmast före (eller efter), inte en höjning
    assert page.get_attribute('[data-set=bankpress][data-f=kg][data-i="0"]', "placeholder") == "70"

def test_vilotimer(page):
    start(page, "window.__vib = []; navigator.vibrate = p => { window.__vib.push(p); return true; };")
    go(page, "pass")
    open_ex(page, "bankpress")
    page.click('[data-ok=bankpress][data-i="0"]')
    assert page.inner_text(".rest-time") == "1:30"
    page.click('[data-restadd="15"]')
    assert page.inner_text(".rest-time") == "1:45"
    # Med en övning öppen ligger timern under dialogen, inte över den, även med stor text
    page.add_style_tag(content=".rest-row { font-size: 22px; padding: 14px 0; }")
    open_ex(page, "militarpress")
    page.click('[data-info=militarpress]')
    page.wait_for_timeout(100)
    sheet, timer = page.locator(".sheet").bounding_box(), page.locator(".rest").bounding_box()
    assert sheet["y"] + sheet["height"] <= timer["y"] + 1
    page.click(".sheet [data-close]")
    open_ex(page, "sidolyft")
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
    # Inga pilar i sifferfälten som tar plats från siffrorna
    assert page.evaluate("getComputedStyle(document.querySelector('[data-run=lop]')).appearance") == "textfield"


def test_kroppsvikt_en_gang_i_veckan_och_kalorimal(page):
    import datetime
    page.clock.install(time=datetime.datetime(2026, 10, 22, 8, 0))   # torsdag
    open_app(page)
    page.click("[data-setupmore]")
    page.select_option("[data-prof=goal]", "cut")
    page.click("[data-savesetup]")
    seed(page, "S.weights['2026-10-15'] = 82; S.weights['2026-10-16'] = 81.8")
    # Ingen vägning den här veckan: rutan ber om en
    assert "VECKANS VÄGNING" in page.inner_text("#app").upper()
    page.fill("#wkg", "70")
    page.click("[data-wsave]")
    assert page.evaluate("S.weights['2026-10-22']") == 70 and page.evaluate("S.profile.weight") == 70
    assert page.evaluate("kcalGoal()") < 2360
    # Därefter försvinner rutan från Hem; vikten över tid finns under Historik
    assert page.locator("#wkg").count() == 0 and "VECKANS" not in page.inner_text("#app").upper()
    # Före vägningsdagen syns ingen ruta
    prof(page, "vikt")
    page.select_option("[data-weighday]", "4")
    page.evaluate("delete S.weights['2026-10-22']; save()")
    go(page, "idag")
    assert "Veckans" not in page.inner_text("#app")
    # Vikten kan döljas och visas igen
    prof(page, "vikt")
    page.select_option("[data-weighday]", "0")
    go(page, "idag")
    page.click("[data-hideweight]")
    assert page.locator("#wkg").count() == 0
    go(page, "historik")
    assert page.locator('.card:has(h2:text-is("Vikt"))').count() == 0
    prof(page, "vikt")
    page.click("[data-showweight]")
    go(page, "idag")
    assert page.locator("#wkg").count() == 1


def test_paminnelse_i_kalendern(page):
    start(page)
    prof(page, "paminnelse")
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
    add_to(page, 1)
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


def test_kost_maltider_forslag_mangd_och_upprepa(page):
    start(page)
    seed(page, """S.log[shift(TODAY, -1)] = {workouts:[], dailies:{}, food:[
      {name:'Gröt', kcal:300, protein:10, meal:0}, {name:'Ägg', kcal:154, protein:13, meal:0, qty:2, per:{kcal:77, protein:6.5}},
      {name:'Pasta', kcal:700, protein:25, meal:1}]}""")
    go(page, "kost")
    amounts = lambda meal: page.evaluate(f"day().food.filter(f => f.meal === {meal}).map(f => [f.name, f.kcal, f.amt ? f.amt.n + ' ' + f.amt.unit : ''])")
    # Sidan visar bara måltiderna; att lägga till sker i ett eget fönster per måltid
    assert page.locator("#fname").count() == 0
    # Som igår: gammalt "Ägg × 2" har fått mängden 2 st
    add_to(page, 0)
    page.click('[data-repeat="0"]')
    page.click('.sheet-foot [data-fsclose]')
    assert amounts(0) == [["Gröt", 300, ""], ["Ägg", 154, "2 st"]]
    # Fritext i lunch
    add_to(page, 1)
    page.fill("#fname", "1 banan")
    page.click("[data-addfood]")
    assert page.evaluate("day().food.at(-1).meal") == 1
    # Ett förslag läggs till med sin senaste mängd och flyttar upp till "I lunchen nu"
    page.click('.qadd:has-text("Ägg")')
    assert amounts(1)[-1] == ["Ägg", 154, "2 st"]
    assert page.locator('.qadd:has-text("Ägg")').count() == 0
    assert page.locator(".sheet .qadd button").count() == 0   # ett förslag är en enda knapp, utan egna − och +
    row = page.locator('.nrow:has-text("Ägg")')
    row.locator('[data-mstep="-1"]').click()
    assert amounts(1)[-1] == ["Ägg", 77, "1 st"]
    page.locator('.nrow:has-text("Ägg") [data-mstep="1"]').click()
    page.locator('.nrow:has-text("Ägg") [data-mstep="1"]').click()
    assert amounts(1)[-1] == ["Ägg", 231, "3 st"]
    # Klar syns även i ett lågt fönster
    page.set_viewport_size({"width": 1200, "height": 500})
    klar = page.locator(".sheet-foot [data-fsclose]").bounding_box()
    assert klar["y"] + klar["height"] <= 500
    page.set_viewport_size({"width": 390, "height": 844})
    page.click('.sheet-foot [data-fsclose]')
    assert page.locator(".sheet").count() == 0
    assert "Ägg · 3 st\n21 g protein\n231 kcal" in page.inner_text("#app")
    # Tryck på en loggad sak: favorit med sin mängd, ta bort
    i = page.evaluate("day().food.findIndex(f => f.meal === 1 && f.name === 'Ägg')")
    page.click(f'[data-fooditem="{i}"]')
    page.click("[data-itemfav]")
    assert page.evaluate("S.favs.map(f => [f.name, f.amt.n, f.amt.unit])") == [["Ägg", 3, "st"]]
    page.click(".sheet [data-delfood]")
    assert page.locator(".sheet").count() == 0
    assert page.evaluate("day().food.some(f => f.meal === 1 && f.name === 'Ägg')") is False
    # Frukosten sparad som måltid: föreslås bara till frukost och loggas del för del
    add_to(page, 0)
    page.click('[data-savegroup="0"]')
    page.click('.sheet-foot [data-fsclose]')
    add_to(page, 3)
    assert page.locator('.qadd:has-text("🍽")').count() == 0
    page.click('.sheet-foot [data-fsclose]')
    page.evaluate("day().food = day().food.filter(f => f.meal !== 0); save(); render()")
    add_to(page, 0)
    page.click('.qadd:has-text("🍽")')
    assert amounts(0) == [["Gröt", 300, ""], ["Ägg", 154, "2 st"]]
    page.click('.sheet-foot [data-fsclose]')


def test_hela_garadagen_och_sparad_maltid_med_ett_tryck(page):
    start(page)
    seed(page, """S.log[shift(TODAY, -1)] = {workouts:[], dailies:{}, food:[
      {name:'Gröt', kcal:300, protein:10, meal:0}, {name:'Pasta', kcal:700, protein:25, meal:1}]};
      S.meals = [{name:'Gröt, kaffe', kcal:320, protein:11, slot:0, items:[{name:'Gröt', kcal:300, protein:10}, {name:'Kaffe', kcal:20, protein:1}]}]""")
    go(page, "kost")
    assert "hela dagen, 1\xa0000 kcal" in page.inner_text("[data-repeatday]")
    # Sparad frukost syns direkt när frukost är vald, inte för lunch
    add_to(page, 1)
    assert page.locator("[data-usemeal]").count() == 0
    page.click('[data-sheetmeal="0"]')
    page.click('[data-usemeal][data-meal="0"]')
    page.click('.sheet-foot [data-fsclose]')
    assert page.evaluate("day().food.map(f => [f.name, f.meal])") == [["Gröt", 0], ["Kaffe", 0]]
    assert page.locator("[data-repeatday]").count() == 0   # dagen är inte tom längre
    page.evaluate("day().food = []; save(); render()")
    page.click("[data-repeatday]")
    assert page.evaluate("day().food.map(f => [f.name, f.meal, f.kcal])") == [["Gröt", 0, 300], ["Pasta", 1, 700]]


def test_uppskattningar_raknas_inte_dubbelt(page):
    start(page)
    seed(page, "S.log[shift(TODAY, -1)] = {workouts:[], dailies:{}, food:[{name:'Pasta', kcal:700, protein:25, meal:1}]}")
    go(page, "kost")
    add_to(page, 2)
    page.fill("#qm-2", "300")
    page.click('[data-qmeal="2"]')
    assert page.evaluate("day().food.at(-1)") == {"name": "Uppskattning", "kcal": 300, "protein": 17, "meal": 2, "est": True}
    # Uppskattningen är aldrig ett förslag eller en favorit
    assert page.locator('.qadd:has-text("Uppskattning")').count() == 0
    # Riktig mat i samma måltid: varning och ett tryck för att ta bort uppskattningen
    page.click('.qadd:has-text("Pasta")')
    assert "räknas dubbelt" in page.inner_text(".sheet")
    page.click(".sheet .nrow.est [data-mdel]")
    assert page.evaluate("day().food.filter(f => f.meal === 2).map(f => f.name)") == ["Pasta"]
    page.click('.sheet-foot [data-fsclose]')
    # En uppskattning visas som just det och kan inte bli favorit
    page.evaluate("day().food.push({name: 'Uppskattning', kcal: 600, protein: 30, meal: 3, est: true}); render()")
    assert "≈ Uppskattning" in page.inner_text("#app")
    page.click(f'[data-fooditem="{page.evaluate("day().food.length - 1")}"]')
    assert page.locator("[data-itemfav]").count() == 0


def test_gammal_mat_far_mangd_och_protein_ar_gront_over_malet(page):
    start(page)
    seed(page, """S.favs = [{name: 'Lunch (ca 830 kcal)', kcal: 830, protein: 48}, {name: 'ägg', kcal: 77, protein: 7}];
      S.log[shift(TODAY, -1)] = {workouts: [], dailies: {}, food: [
        {name: 'ägg', kcal: 385, protein: 35, meal: 0, qty: 5, per: {kcal: 77, protein: 7}},
        {name: 'Lunch (ca 830 kcal)', kcal: 830, protein: 48, meal: 1},
        {name: 'ägg', kcal: 100, protein: 9, meal: 2}]};
      day().food.push({name: 'Kvarg', kcal: 600, protein: 200, meal: 0})""")
    L = page.evaluate("S.log[shift(TODAY, -1)].food")
    assert [L[0]["name"], L[0]["amt"]["n"], L[0]["amt"]["unit"], L[0]["kcal"]] == ["Ägg", 5, "st", 385]
    assert L[1].get("est") is True
    assert L[2]["name"] == "ägg" and L[2]["kcal"] == 100 and L[2].get("plain") is True   # egna kcal skrivs aldrig över
    assert page.evaluate("S.favs.map(f => f.name)") == ["ägg"]
    go(page, "kost")
    assert page.evaluate("document.querySelectorAll('.dayring .bar')[1].classList.contains('ok')") is True


def test_mangd_styr_kalorierna(page):
    start(page)
    go(page, "kost")
    add_to(page, 1)
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
    # − och + stegar mängden: 50 g åt gången
    row.locator('[data-astep="1"]').click()
    assert row.locator(".amt-n").input_value() == "150" and "225 kcal" in row.inner_text()
    row.locator('[data-astep="-1"]').click()
    assert row.locator(".amt-n").input_value() == "100"
    # Fälten för egna kcal syns inte när allt känns igen
    assert page.locator(".sheet .manual").is_hidden()
    page.click("[data-addfood]")
    f = page.evaluate("day().food[0]")
    assert [f["name"], f["kcal"], f["protein"], f["amt"]["n"], f["amt"]["unit"]] == ["Spaghetti bolognese", 150, 7, 100, "g"]
    # Ändra mängden i efterhand på det loggade
    page.click('.sheet-foot [data-fsclose]')
    page.click('[data-fooditem="0"]')
    page.locator('[data-iamt="n"]').fill("300")
    page.locator('[data-iamt="n"]').press("Enter")
    page.wait_for_function("day().food[0].kcal === 450")
    page.locator('[data-iamt="u"]').select_option("portion")
    page.wait_for_function("day().food[0].amt.unit === 'portion'")
    assert page.evaluate("[day().food[0].amt.n, day().food[0].kcal]") == [0.5, 338]
    page.click('.sheet [data-astep="1"]')
    assert page.evaluate("[day().food[0].amt.n, day().food[0].kcal]") == [1, 675]
    # Två ägg: flera rader i en text blir var sin rad med sin mängd
    page.click("[data-itemclose].primary")
    add_to(page, 0)
    page.fill("#fname", "2 ägg och 1 dl mjölk")
    page.click(".sheet h2")
    page.click("[data-addfood]")
    assert page.evaluate("day().food.filter(f => f.meal === 0).map(f => [f.name, f.amt.n, f.amt.unit, f.kcal])") == [["Ägg", 2, "st", 154], ["Mjölk", 1, "dl", 46]]


def test_streckkod_fran_open_food_facts(page):
    start(page, "window.BarcodeDetector = class { async detect() { return window.__code ? [{ rawValue: window.__code }] : []; } };")
    go(page, "kost")
    add_to(page, 0)
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
    add_to(page, 0)
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
  // Funktionerna i supabase/vanner.sql, i minnet. Inloggad användare är u1.
  async rpc(name, a = {}) {
    const st = window.__social || (window.__social = { profiles: {}, friends: [], activity: [], kudos: [], calls: [] });
    st.calls.push(name);
    const me = this.auth.session && this.auth.session.user.id, prof = st.profiles[me];
    const fail = message => ({ data: null, error: { message } });
    const friendsOf = u => st.friends.filter(f => f[0] === u).map(f => f[1]);
    if (window.__noSocial) return fail("Funktionen saknas");
    if (!me) return fail("Inte inloggad");
    switch (name) {
      case "driv_profile_get": return { data: prof ? { ...prof } : null, error: null };
      case "driv_profile_save":
        st.profiles[me] = { name: a.p_name, code: prof ? prof.code : "ANNA01", sharing: a.p_sharing };
        return { data: { ...st.profiles[me] }, error: null };
      case "driv_add_friend": {
        if (!prof) return fail("Skapa en profil först");
        const id = Object.keys(st.profiles).find(k => st.profiles[k].code === a.p_code);
        if (!id) return fail("Hittade ingen med den koden");
        if (id === me) return fail("Det är din egen kod");
        st.friends.push([me, id], [id, me]);
        return { data: st.profiles[id].name, error: null };
      }
      case "driv_remove_friend": st.friends = st.friends.filter(f => !f.includes(a.p_friend) || !f.includes(me)); return { data: null, error: null };
      case "driv_friends": return { data: friendsOf(me).map(id => ({ id, name: st.profiles[id].name })), error: null };
      case "driv_log_activity": {
        if (!prof || !prof.sharing) return { data: null, error: null };
        st.activity = st.activity.filter(x => !(x.user_id === me && x.day === a.p_day && x.pass === a.p_pass));
        if (a.p_done) st.activity.push({ id: st.activity.length + 100, user_id: me, day: a.p_day, pass: a.p_pass, exercises: a.p_exercises });
        return { data: null, error: null };
      }
      case "driv_feed": return { data: st.activity.filter(x => (x.user_id === me || friendsOf(me).includes(x.user_id)) && st.profiles[x.user_id].sharing)
        .map(x => ({ ...x, name: st.profiles[x.user_id].name, mine: x.user_id === me,
          kudos: st.kudos.filter(k => k[0] === x.id).length, kudoed: st.kudos.some(k => k[0] === x.id && k[1] === me) }))
        .sort((x, y) => y.day.localeCompare(x.day)), error: null };
      case "driv_kudos": {
        const x = st.activity.find(y => y.id === a.p_activity);
        if (!x || !friendsOf(me).includes(x.user_id)) return fail("Inte en väns pass");
        const i = st.kudos.findIndex(k => k[0] === x.id && k[1] === me);
        if (i >= 0) st.kudos.splice(i, 1); else st.kudos.push([x.id, me]);
        return { data: null, error: null };
      }
      case "driv_delete_me": delete st.profiles[me]; st.deleted = me; return { data: null, error: null };
      case "driv_push_save": st.push = { ...a, user: me }; return { data: null, error: null };
      case "driv_push_delete": st.pushDeleted = a.p_endpoint; st.push = null; return { data: null, error: null };
    }
    return fail("okänd funktion " + name);
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
    prof(page, "konto")
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
    prof(page, "konto")
    page.click("[data-signout]")
    assert page.evaluate("cloud.status") == "local"



def test_logga_in_fran_startsidan(page):
    page.context.route("**/config.js", lambda r: r.fulfill(
        body='window.DRIV_CONFIG = { supabaseUrl: "https://exempel.supabase.co", supabaseAnonKey: "nyckel" };',
        content_type="application/javascript"))
    # Ett konto med färdigt upplägg och lite logg
    start(page, SUPABASE_MOCK)
    page.evaluate("S.log['2026-01-05'] = {workout:null,dailies:{},food:[{name:'Macka',kcal:300,protein:10}]}; save()")
    prof(page, "konto")
    page.fill("#acctemail", "test@exempel.se")
    page.click("[data-sendcode]")
    page.fill("#acctcode", "123456")
    page.click("[data-verifycode]")
    page.wait_for_function("account.step === 'in' && Object.keys(window.__db).length >= 2")
    # Ny enhet: tom webbläsare och utloggad, startsidan visas
    page.evaluate("localStorage.clear(); sessionStorage.removeItem('sess')")
    page.reload()
    assert page.locator("[data-savesetup]").count() == 1
    page.click('.corner-login')
    assert "Logga in" in page.inner_text(".card:has(#acctemail) h2")
    assert "bara för att logga in" in page.inner_text(".card:has(#acctemail)")
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
    prof(page, "konto")
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
    open_ex(page, "bankpress")
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
    open_ex(page, "bankpress")
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
    open_ex(page, "bankpress")
    page.click('[data-ok=bankpress][data-i="0"]')
    to_list(page)
    page.click(f'[data-pick="{page.evaluate("S.plan.days[1].id")}"]')
    open_ex(page, "marklyft")
    page.click('[data-ok=marklyft][data-i="0"]')
    to_list(page)
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
    add_to(page, 2)
    page.fill("#fname", "1 banan")
    page.click("[data-addfood]")
    page.click(".sheet-foot [data-fsclose]")
    page.click("[data-editdone]")
    assert page.evaluate("tab") == "historik" and "Igår" in page.inner_text(".sheet h2")
    assert page.evaluate("S.log['2026-10-21'].food.map(f => f.meal)") == [2]
    assert page.evaluate("(S.log['2026-10-22'] || {food: []}).food.length") == 0
    # Ett pass i efterhand
    page.click("[data-hpass='']")
    assert page.evaluate("[tab, logDate()]") == ["pass", "2026-10-21"]
    page.click(f'[data-pick="{page.evaluate("S.plan.days[1].id")}"]')
    open_ex(page, "marklyft")
    page.click('[data-ok=marklyft][data-i="0"]')
    to_list(page)
    page.click(f'[data-finish="{page.evaluate("S.plan.days[1].id")}"]')
    assert page.evaluate("[tab, histDay]") == ["historik", "2026-10-21"]
    assert page.evaluate("workoutsOn('2026-10-21').map(w => w.done)") == [True]
    assert page.evaluate("workoutsOn('2026-10-22').length") == 0
    # Till en annan flik: tillbaka till idag
    go(page, "idag")
    assert page.evaluate("logDate()") == "2026-10-22"


SOCIAL_SEED = """window.__social = { profiles: { u2: { name: 'Bo', code: 'BO1234', sharing: true } }, friends: [], kudos: [], calls: [],
  activity: [{ id: 1, user_id: 'u2', day: '2026-10-21', pass: 'Push', exercises: 6 }] };"""


def test_vanner_kod_flode_och_peppning(page):
    import datetime
    page.clock.install(time=datetime.datetime(2026, 10, 22, 12, 0))
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page, SUPABASE_MOCK + SOCIAL_SEED)
    # Utan konto: vänner kräver ett konto
    prof(page, "vanner")
    assert "Kräver ett konto" in page.inner_text("#vanner")
    login(page)
    prof(page, "vanner")
    page.wait_for_selector("#sname")
    assert "aldrig vikter, mat eller kroppsvikt" in page.inner_text("#vanner")
    page.fill("#sname", "Anna")
    page.click("[data-profsave]")
    page.wait_for_selector(".vcode")
    assert page.inner_text(".vcode") == "ANNA01"
    # Lägg till Bo med kod; fel kod ger ett begripligt besked
    page.fill("#vcode", "XXXXXX")
    page.click("[data-addfriend]")
    page.wait_for_function("social.msg.includes('Hittade ingen')")
    page.fill("#vcode", "bo1234")
    page.click("[data-addfriend]")
    page.wait_for_function("social.friends.length === 1")
    assert "Bo" in page.inner_text("#vanner")
    # Hem visar Bos pass, och peppningen sparas
    go(page, "idag")
    page.wait_for_selector(".friendsrow [data-kudos]")
    assert "Bo körde Push" in page.inner_text(".friendsrow") and "igår" in page.inner_text(".friendsrow")
    page.click("[data-kudos='1']")
    page.wait_for_function("window.__social.kudos.length === 1")
    assert "👏 1" in page.inner_text("[data-kudos='1']")
    # Ett sparat pass delas med antal övningar, inget annat
    go(page, "pass")
    open_ex(page, "bankpress")
    page.click('[data-ok=bankpress][data-i="0"]')
    to_list(page)
    page.click("button[data-finish]")
    page.wait_for_function("window.__social.activity.some(x => x.user_id === 'u1')")
    mine = page.evaluate("window.__social.activity.find(x => x.user_id === 'u1')")
    assert {k: mine[k] for k in ("day", "pass", "exercises")} == {"day": "2026-10-22", "pass": "Push", "exercises": 1}
    # Slutar man dela sparas inga fler pass
    prof(page, "vanner")
    page.click("[data-sharing]")
    page.wait_for_function("social.profile && social.profile.sharing === false")
    # Radera konto kräver två tryck
    prof(page, "konto")
    page.click("[data-delacct]")
    assert page.evaluate("window.__social.deleted") is None
    page.click("[data-delacct]")
    page.wait_for_function("window.__social.deleted === 'u1' && account.step === 'email'")


PUSH_MOCK = r"""
// Webbläsarens push-tjänst finns inte i testerna: prenumerationen låtsas finnas
window.__swTest = true;
PushManager.prototype.getSubscription = async function () { return window.__sub || null; };
PushManager.prototype.subscribe = async function () {
  return (window.__sub = { endpoint: 'https://push.example/abc', unsubscribe: async () => { window.__sub = null; return true; },
    toJSON: () => ({ endpoint: 'https://push.example/abc', keys: { p256dh: 'P', auth: 'A' } }) });
};
Object.defineProperty(Notification, 'permission', { get: () => window.__perm || 'default' });
Notification.requestPermission = async () => (window.__perm = 'granted');
"""


def test_notiser_slas_pa_och_av(page):
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG.replace(" };", ', vapidPublicKey: "BHM13dgfWzzKV4NL9-b37Q0bkn2xOHwGUU6UYkGpbs1OdH1btJsNwBNQZI2-5Fv7uNDZyH7Knp2fYL5kDlRtzuA" };'),
        content_type="application/javascript"))
    start(page, SUPABASE_MOCK + PUSH_MOCK)
    login(page)
    prof(page, "notiser")
    page.click("[data-pushtoggle]")
    page.wait_for_function("push.on && window.__social.push")
    saved = page.evaluate("window.__social.push")
    assert saved["p_endpoint"] == "https://push.example/abc" and saved["p_time"] == "18:00" and saved["p_kudos"] is True
    assert "På · kl. 18:00" in page.inner_text("#p-notiser")
    page.fill("#pushtime", "07:30")
    page.press("#pushtime", "Tab")
    page.wait_for_function("window.__social.push && window.__social.push.p_time === '07:30'")
    page.click("[data-pushtoggle]")
    page.wait_for_function("!push.on && window.__social.pushDeleted")


def test_notislogiken_i_edge_function(page):
    # Samma regler som Supabase-funktionen kör (supabase/functions/driv-push/regler.js)
    import pathlib
    fn = pathlib.Path(__file__).parent.parent.joinpath("supabase/functions/driv-push/regler.js").read_text().replace("export ", "")
    open_app(page)
    res = page.evaluate("() => {" + fn + """
      const s = { plan: { mode: 'flex', count: 3, days: [] }, daily: [{ id: 'plankan' }, { id: 'lop' }] };
      const log = { '2026-10-19': { workouts: [{ done: true, sets: {} }], dailies: {} },
                    '2026-10-22': { workouts: [], dailies: { plankan: true } } };
      const a = dailyMessage(s, log, '2026-10-22', 3);
      log['2026-10-22'].workouts.push({ done: false, sets: { x: [{ ok: true }] } });
      const b = dailyMessage(s, log, '2026-10-22', 3);
      log['2026-10-22'].dailies.lop = { km: 5 };
      const c = dailyMessage(s, log, '2026-10-22', 3);
      const fixed = { plan: { mode: 'fixed', count: 2, weekdays: [0, 3], days: [{ name: 'Push' }, { name: 'Pull' }] }, daily: [] };
      const d = dailyMessage(fixed, {}, '2026-10-22', 3), e = dailyMessage(fixed, {}, '2026-10-21', 2);
      return [a, b, c, d, e]; }""")
    assert res[0] == {"title": "Dags att träna 💪", "body": "1 av 3 pass den här veckan. 1 av 2 dailys kvar idag."}
    assert res[1] == {"title": "Dailys kvar ✓", "body": "1 av 2 dailys kvar idag."}
    assert res[2] is None
    assert res[3]["body"] == "Pull står på schemat idag." and res[4] is None


def test_vanner_utan_funktioner_i_supabase(page):
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page, SUPABASE_MOCK + "window.__noSocial = true;")
    login(page)
    prof(page, "vanner")
    page.wait_for_function("social.loaded")
    assert "går inte att nå just nu" in page.inner_text("#vanner")


def test_vanlank_visar_forfragan(page):
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    page.add_init_script(SUPABASE_MOCK)
    page.goto(page.base_url + "?v=BO1234")
    page.click("[data-savesetup]")
    assert "BO1234" in page.inner_text(".nudge")
    page.click("[data-gofriends]")
    assert page.evaluate("tab") == "profil"
    page.evaluate("document.querySelector('[data-tab=idag]').click()")
    page.click("[data-dropcode]")
    assert page.locator(".nudge").count() == 0

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
    prof(page, "tyck")
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
