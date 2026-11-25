"""Dailys med sparade rutiner: växling mellan dagar, byte för dagen och att inget går förlorat."""
import datetime

from conftest import start, go, back_to_day, tick


def prepare(page, mode="alternate"):
    page.clock.install(time=datetime.datetime(2026, 11, 9, 12, 0))
    start(page)
    page.evaluate("""mode => {
        S.daily = [exEntry('promenad')];
        S.dailyRoutines = [
            {id: 'ra', name: 'Mage A', ex: ['plankan', 'russian_twist'].map(exEntry)},
            {id: 'rb', name: 'Mage B', ex: ['dead_bug', 'sidoplanka'].map(exEntry)},
            {id: 'rc', name: 'Rörlighet', ex: ['cykelcrunch'].map(exEntry)},
        ];
        S.dailyMode = mode; S.dailyAnchor = {date: TODAY, id: 'ra'}; save();
    }""", mode)
    go(page, 'dailys')


def test_without_routines_dailys_work_as_before(page):
    page.clock.install(time=datetime.datetime(2026, 11, 9, 12, 0))
    start(page)
    page.evaluate("S.daily = [exEntry('plankan')]; save()")
    go(page, 'dailys')
    assert page.locator('.dl-byt').count() == 0
    assert '0 av 1 klara' in page.text_content('.dlx')
    assert page.locator('[data-rutpage]').count() == 1


def test_alternate_and_rotation(page):
    prepare(page, "alternate")
    # Varje dag först, sedan dagens extra under en egen rubrik
    assert page.evaluate("routineOn(TODAY).name") == 'Mage A' and page.locator('.fz-th.x').count() == 2
    names = page.evaluate("[1, 2, 3].map(i => routinePlanned(shift(TODAY, i)).name)")
    assert names == ['Mage B', 'Mage A', 'Mage B']
    page.evaluate("S.dailyMode = 'rotate'")
    assert page.evaluate("[1, 2, 3].map(i => routinePlanned(shift(TODAY, i)).name)") == ['Mage B', 'Rörlighet', 'Mage A']
    # Dagens lista är Varje dag plus rutinen
    assert page.evaluate("dailyList(TODAY).map(e => e.id)") == ['promenad', 'plankan', 'russian_twist']


def test_switch_for_today_keeps_checks_and_continues_rotation(page):
    prepare(page, "rotate")
    tick(page, 'plankan')
    page.click('.dl-byt')
    page.click('[data-rutpick=rb]')
    assert page.evaluate("routineOn(TODAY).name") == 'Mage B' and page.locator('.fz-th.x').count() == 2
    assert page.evaluate("dailyDone(TODAY, 'plankan')")
    assert page.evaluate("routinePlanned(shift(TODAY, 1)).name") == 'Rörlighet'
    # Gårdagens rutin räknas inte om när man byter idag
    assert page.evaluate("S.log[TODAY].dailyRoutine") == 'rb'


def test_all_done_counts_routine(page):
    prepare(page)
    for ex in ['promenad', 'plankan', 'russian_twist']:
        tick(page, ex)
    assert page.evaluate("allDailiesDone(TODAY)")
    assert page.evaluate("S.log[TODAY].dailyRoutine") == 'ra'


def test_manage_routines_create_rename_delete(page):
    prepare(page, "manual")
    page.click('.dl-mine')
    # Äldre "välj själv" blir ett veckoschema när Mina dailys öppnas
    assert page.evaluate("S.dailyMode") == 'week'
    # Ny grupp öppnas direkt; namnet skrivs överst och Spara går tillbaka
    n = page.evaluate("S.dailyRoutines.length")
    page.click('[data-rutnew]')
    assert page.evaluate("S.dailyRoutines.length") == n and page.locator('.up-name').input_value() == ''   # utkast
    assert 'Tryck på dagarna' in page.inner_text('.up-note') and page.locator('.up-dc.on').count() == 0
    page.fill('.up-name', 'Kvällsrutin')
    page.click('[data-rutsave]')
    assert page.evaluate("S.dailyRoutines.map(r => r.name)")[-1] == 'Kvällsrutin'
    assert page.evaluate("rutOpen") is None and 'Kvällsrutin' in page.inner_text('.up-xc >> nth=-1')
    # En ny grupp som lämnas tom tas bort
    page.click('[data-rutnew]')
    page.click('[data-rutback]')
    assert page.evaluate("S.dailyRoutines.length") == n + 1
    # Namnet ändras direkt i fältet
    page.click('[data-rutopen=ra]')
    page.fill('.up-name', 'Morgonmage')
    assert page.evaluate("routineById('ra').name") == 'Morgonmage'
    page.click('[data-rutmenu=ra]')
    page.click('[data-rutdel=ra]')
    assert 'Tryck igen' in page.inner_text('[data-rutdel=ra]')
    page.click('[data-rutdel=ra]')
    assert page.evaluate("S.dailyRoutines.some(r => r.id === 'ra')") is False
    assert 'ra' not in page.evaluate("S.dailyWeek")


def test_week_planner(page):
    """Mina dailys: varje extra grupp visar sina dagar i ord; dagarna väljs på gruppens sida och gäller varje vecka."""
    prepare(page, "alternate")   # 9 november 2026 är en måndag
    page.click('.dl-mine')
    assert page.evaluate("S.dailyWeek") == ['ra', 'rb', 'ra', 'rb', 'ra', 'rb', 'ra']
    assert 'Måndag, onsdag, fredag och söndag' in page.inner_text('[data-rutopen=ra]')
    assert 'Inga dagar valda' in page.inner_text('[data-rutopen=rc]')
    # Fredag till Rörlighet, söndag utan extra
    page.click('[data-rutopen=rc]')
    page.click('[data-plset="4"]')
    assert 'Görs på fredagar, utöver Varje dag.' in page.inner_text('.up-note')
    page.click('[data-rutback]')
    page.click('[data-rutopen=ra]')
    assert page.locator('.up-dc.on').count() == 3   # måndag, onsdag och söndag
    page.click('[data-plset="6"]')
    page.click('[data-rutback]')
    assert page.evaluate("S.dailyWeek") == ['ra', 'rb', 'ra', 'rb', 'rc', 'rb', '']
    assert 'Måndag och onsdag' in page.inner_text('[data-rutopen=ra]') and 'Fredag' in page.inner_text('[data-rutopen=rc]')
    assert page.evaluate("[4, 11].map(i => routinePlanned(shift(TODAY, i)).name)") == ['Rörlighet', 'Rörlighet']
    assert page.evaluate("routinePlanned(shift(TODAY, 6))") is None
    # Utan extra är Varje dag kvar
    assert page.evaluate("dailyList(shift(TODAY, 6)).map(e => e.id)") == ['promenad']
    # Dailys visar fredagens extra
    back_to_day(page)
    page.click('[data-dlsel="2026-11-13"]')
    assert 'Extra: Rörlighet' in page.inner_text('.dl-xh')
    page.click('.dl-mine')
    # I tur och ordning: grupperna turas om från dagens grupp, och ordningen syns med Idag och I morgon
    page.click('[data-uppmode=rotate]')
    assert page.evaluate("S.dailyMode") == 'rotate'
    assert page.evaluate("[0, 1, 2, 3].map(i => routinePlanned(shift(TODAY, i)).id)") == ['ra', 'rb', 'rc', 'ra']
    assert '1. Mage A' in page.inner_text('[data-rutopen=ra]') and 'Idag' in page.inner_text('[data-rutopen=ra]')
    assert 'I morgon' in page.inner_text('[data-rutopen=rb]') and page.locator('.rutgrip').count() == 3
    page.click('[data-uppmode=week]')
    assert page.evaluate("S.dailyMode") == 'week'


def test_week_edit_routine_and_today_switch_only_today(page):
    prepare(page, "alternate")
    page.click('.dl-mine')
    page.click('[data-rutopen=ra]')
    assert page.locator('.up-name').input_value() == 'Mage A'
    # Övningen fälls ut: set med − och +; krysset tar bort
    page.click('[data-uxopen="0"]')
    page.click('[data-uxsets="1"]')
    assert page.evaluate("routineById('ra').ex[0].sets") == 4
    page.click('[data-xdel="rut:ra"][data-idx="0"]')
    assert page.evaluate("routineById('ra').ex.map(e => e.id)") == ['russian_twist']
    back_to_day(page)
    # Byt extra i Dailys gäller bara idag
    page.click('.dl-byt')
    page.click('[data-rutpick=rb]')
    assert page.evaluate("routineOn(TODAY).name") == 'Mage B' and page.locator('.fz-th.x').count() == 2
    assert page.evaluate("S.dailyWeek[0]") == 'ra' and page.evaluate("routinePlanned(shift(TODAY, 7)).name") == 'Mage A'
    # Dailys bockar bara av; allt ändras under Mina dailys
    assert page.locator('.dlx [data-openpick], .dlx [data-suppadd], .dlx [data-suppedit], .dlx [data-rutopen], .dl-editbtn').count() == 0
    page.click('[data-dlsel="2026-11-10"]')
    assert page.locator('.dlx [data-openpick], .dlx [data-suppadd], .dlx [data-suppedit], .dlx [data-rutopen]').count() == 0


def test_upplagg_every_day_supplements_and_colors(page):
    prepare(page, "manual")
    page.click('.dl-mine')
    colors = page.evaluate("dailyRoutines().map(r => rutColor(r))")
    # Varje dag och kosttillskott ändras direkt på sidan
    page.click('[data-xdel="daily"][data-idx="0"]')
    assert page.evaluate("S.daily.length") == 0
    page.click('[data-suppadd]')
    page.fill('#supplement-form [name=name]', 'Kreatin')
    page.click('#supplement-form [type=submit]')
    assert page.evaluate("S.supplements.map(x => x.name)") == ['Kreatin']
    page.click('[data-suppdel="0"]')
    assert page.evaluate("S.supplements.length") == 0
    # Färgen följer gruppen även när ordningen ändras
    page.evaluate("S.dailyRoutines.reverse(); render()")
    assert page.evaluate("rutColor(routineById('ra'))") == colors[0]


def test_utan_extra_visas_schema_som_val(page):
    page.clock.install(time=datetime.datetime(2026, 11, 9, 12, 0))
    start(page)
    page.evaluate("S.daily = [exEntry('plankan')]; S.dailyRoutines = []; save()")
    go(page, 'dailys')
    # Utan extra: inga grupprubriker, bara listan
    assert page.locator('.dl-xh').count() == 0
    page.click('.dl-mine')
    assert 'valfritt' in page.inner_text('.up-opt')
    # Frågan kommer först: vissa veckodagar eller turas om
    page.click('.up-opt [data-rutnew="week"]')
    page.fill('.up-name', 'Mage')
    # Första extra gruppen: fasta veckodagar, inga dagar än
    assert page.evaluate("[S.dailyMode, S.dailyWeek]") == ['week', ['', '', '', '', '', '', '']]
    page.click('[data-plset="0"]')
    page.click('[data-rutsave]')
    assert page.evaluate("routinePlanned(TODAY).name") == 'Mage'
    # Byter man till turas om finns veckodagarna kvar och kommer tillbaka
    page.click('[data-uppmode=rotate]')
    assert 'finns kvar' in page.inner_text('.up-note')
    page.click('[data-uppmode=week]')
    assert page.evaluate("S.dailyMode") == 'week'
    assert page.evaluate("routinePlanned(TODAY).name") == 'Mage'


def test_forsta_extra_turas_om(page):
    page.clock.install(time=datetime.datetime(2026, 11, 9, 12, 0))
    start(page)
    page.evaluate("S.daily = [exEntry('plankan')]; S.dailyRoutines = []; save()")
    go(page, 'dailys')
    page.click('.dl-mine')
    page.click('.up-opt [data-rutnew="rotate"]')
    assert page.evaluate("S.dailyMode") == 'rotate'
    # Gruppens sida visar plats i ordningen i stället för dagar
    assert page.locator('.up-dc').count() == 0 and 'Nummer 1 av 1' in page.inner_text('.up-pos')
    page.fill('.up-name', 'Mage')
    page.click('[data-rutsave]')
    page.click('[data-rutnew]')
    page.fill('.up-name', 'Rörlighet')
    assert 'Nummer 2 av 2' in page.inner_text('.up-pos') and 'i morgon' in page.inner_text('.up-pos')
    page.click('[data-rutsave]')
    assert page.evaluate("[0, 1, 2].map(i => routinePlanned(shift(TODAY, i)).name)") == ['Mage', 'Rörlighet', 'Mage']


def test_week_check_missed_day_afterwards(page):
    """En annan dag i veckan visas på samma sida; missade övningar och kosttillskott bockas av i efterhand."""
    page.clock.install(time=datetime.datetime(2026, 11, 11, 12, 0))   # onsdag
    start(page)
    page.evaluate("""S.daily = [exEntry('plankan')]; S.supplements = [{id: 's1', name: 'Kreatin'}]; save()""")
    go(page, 'dailys')
    assert page.locator('.dl-sd').count() == 7 and page.locator('.dl-sd.on.t').count() == 1
    page.click('[data-dlsel="2026-11-09"]')
    page.click('[data-wkck="2026-11-09"][data-wkid="plankan"]')
    assert "1 av 2 klara" in page.inner_text('.dl-h')
    page.click('[data-dlsel="2026-11-10"]')
    page.click('[data-wkck="2026-11-10"][data-wkid="supp:s1"]')
    assert page.evaluate("dailyDone('2026-11-09', 'plankan')") is True
    assert page.evaluate("S.log['2026-11-10'].dailies['supp:s1']") is True
    page.click('[data-dlsel="2026-11-09"]')
    page.click('[data-wkck="2026-11-09"][data-wkid="plankan"]')
    assert page.evaluate("dailyDone('2026-11-09', 'plankan')") is False
    # Allt gjort bockar av hela dagen
    page.click('[data-wkall="2026-11-09"]')
    assert page.evaluate("dailyDone('2026-11-09', 'plankan') && S.log['2026-11-09'].dailies['supp:s1']") is True
    assert page.locator('[data-dlsel="2026-11-09"].ok').count() == 1
    # Kommande dagar visas men går inte att bocka av
    page.click('[data-dlsel="2026-11-12"]')
    assert page.locator('[data-wkck]').count() == 0 and "planerat" in page.inner_text('.dl-h')


def test_week_navigation_back_and_forth(page):
    page.clock.install(time=datetime.datetime(2026, 11, 11, 12, 0))
    start(page)
    page.evaluate("S.daily = [exEntry('plankan')]; save()")
    go(page, 'dailys')
    assert page.locator('[data-dlweek="7"]').is_disabled()
    page.click('[data-dlweek="-7"]')
    assert page.evaluate("dlSel") == '2026-11-04'
    page.click('[data-wkck="2026-11-04"][data-wkid="plankan"]')
    assert page.evaluate("dailyDone('2026-11-04', 'plankan')") is True
    page.click('[data-dlweek="7"]')
    assert page.evaluate("dlSel") is None


def test_day_done_banner(page):
    start(page)
    page.evaluate("S.daily = [exEntry('plankan')]; S.supplements = [{id: 's1', name: 'Kreatin'}]; save()")
    go(page, 'dailys')
    assert page.locator('.dl-sum').count() == 0
    tick(page, 'plankan')
    assert page.locator('.dl-sum').count() == 0   # kosttillskottet återstår
    page.click('[data-suppcheck=s1]')
    assert "Bra jobbat" in page.inner_text('.dl-sum') and page.locator('.dl-rows').count() == 0
    page.click('[data-dllist]')
    assert page.locator('.dl-rows [data-dcheck=plankan]').count() == 1
    page.click('[data-dcheck=plankan]')   # ett tryck på en klar bock nollställer
    assert page.locator('.dl-sum').count() == 0


def test_mina_dailys_lagg_till_och_ta_bort(page):
    prepare(page, "manual")   # Varje dag: promenad; Mage A: plankan, russian_twist
    page.click('.dl-mine')
    # Lägg till i Varje dag
    page.click('[data-openpick="daily"]')
    page.fill('#mskq', 'dead bug'); page.click('[data-libpick="dead_bug"]')
    assert page.evaluate("S.daily.map(e => e.id)") == ['promenad', 'dead_bug']
    assert 'dead_bug' in page.evaluate("dailyList(shift(TODAY, 7)).map(e => e.id)")
    # Lägg till i en extra grupp
    page.evaluate("rutPage = true; rutOpen = 'ra'; render()")
    page.click('[data-openpick="rut:ra"]')
    page.fill('#mskq', 'sidoplanka'); page.click('[data-libpick="sidoplanka"]')
    assert 'sidoplanka' in page.evaluate("routineById('ra').ex.map(e => e.id)")


def test_stora_bocken_blinkar_inte_och_vibrerar(page):
    start(page)
    page.evaluate("window.buzz = []; navigator.vibrate = p => { window.buzz.push(p); return true; }")
    page.evaluate("S.supplements = []; S.daily = [{id:'plankan',sets:3,reps:'45 s'}]; save(); tab = 'dailys'; render()")
    page.evaluate("cheerState = { date: logDate(), done: false }")
    page.evaluate("day().dailies.plankan = true; save(); render(); cheerCheck()")
    assert page.locator(".ds-burst.pop").count() == 1
    assert [60, 50, 60, 50, 220] in page.evaluate("window.buzz")
    # En omritning efteråt (t.ex. synk) får inte få bocken att hoppa in igen
    page.wait_for_timeout(50)
    page.evaluate("render()")
    assert page.locator(".ds-burst").count() == 1 and page.locator(".ds-burst.pop").count() == 0


def test_inget_kugghjul_over_timern(page):
    start(page)
    page.evaluate("S.daily = [{id:'plankan',sets:3,reps:'45 s'}]; save(); tab = 'dailys'; render()")
    assert page.locator("#app > .gear").count() == 1
    page.evaluate("dailyClock = { id: 'plankan', set: 1, sets: 3, sec: 45, left: 45, run: false }; render()")
    # Timern har eget kryss; kugghjulet ska inte ligga ovanpå kortet
    assert page.locator("#app > .gear").count() == 0


def test_set_i_dailys(page):
    start(page)
    page.evaluate("S.supplements = []; S.daily = [{id:'plankan',sets:3,reps:'45 s'}]; save()")
    go(page, 'dailys')
    page.click('[data-dcheck=plankan]')
    # Kortet visar seten som streck och vilket set som står på tur
    assert page.locator('.fz-sets i.on').count() == 1 and "set 2 av 3" in page.inner_text('.fz-meta')
    assert not page.evaluate("dailyDone(TODAY, 'plankan')")
    page.click('[data-dcheck=plankan]'); page.click('[data-dcheck=plankan]')
    assert page.evaluate("dailyDone(TODAY, 'plankan')") and page.evaluate("day().dailies['set:plankan']") is None


def test_dailys_kan_startas_i_valfri_ordning(page):
    start(page)
    page.evaluate("S.supplements = []; S.daily = [{id:'plankan',sets:3,reps:'45 s'}, {id:'russian_twist',sets:3,reps:'20'}]; save()")
    go(page, 'dailys')
    # Raden under kortet väljer övning; timern startar för den som visas
    page.click('[data-dlfocus=russian_twist]')
    page.click('[data-dclockstart=russian_twist]')
    assert page.evaluate("dailyClock.id") == 'russian_twist'


def test_rutin_efter_mal(page):
    start(page)
    # Alla mål bygger på övningar som finns
    assert page.evaluate("GOAL_ROUTINES.flatMap(g => g.ex.map(s => s.split('@')[0]).filter(id => !EX[id]))") == []
    page.evaluate("S.dailyRoutines = []; save(); tab = 'dailys'; rutPage = true; rutOpen = null; render()")
    page.click("[data-goallist]")
    assert page.locator("[data-goalroutine]").count() == page.evaluate("GOAL_ROUTINES.length")
    # Målet öppnas direkt som förslag att ändra; inget läggs till förrän man trycker Lägg till
    page.click('[data-goalroutine="landrygg"]')
    assert page.evaluate("S.dailyRoutines.length") == 0 and page.inner_text('.up-dh h1') == 'Stel ländrygg'
    assert "1177" in page.inner_text("#app") and page.locator(".gr-src a").count() == 3
    assert page.evaluate("GOAL_ROUTINES.every(g => g.src.length && g.src.every(([n, u]) => n && u.startsWith('https://')))")
    # Tillbaka går till målen och lägger inte till något
    page.click('[data-rutback]')
    assert page.evaluate("[S.dailyRoutines.length, goalPick, rutDraft]") == [0, 'list', None]
    page.click('[data-goalroutine="landrygg"]')
    # Förslaget visas lugnt; Redigera öppnar ändringarna
    assert page.locator('[data-xdel], .up-name, [data-openpick]').count() == 0
    page.click('[data-gredit]')
    page.click('[data-xdel^="rut:"][data-idx="4"]')
    page.click('[data-plset="2"]')
    assert page.inner_text('[data-rutsave]') == 'Lägg till'
    page.click('[data-rutsave]')
    r = page.evaluate("S.dailyRoutines[0]")
    assert r["name"] == "Stel ländrygg" and r["goal"] == "landrygg" and len(r["ex"]) == 4
    assert page.evaluate("S.dailyWeek[2]") == r["id"]
    # Lägg till går tillbaka till listan, där gruppen syns
    assert page.evaluate("[rutOpen, goalPick]") == [None, None] and page.locator(f'[data-rutopen="{r["id"]}"].up-flash').count() == 1
