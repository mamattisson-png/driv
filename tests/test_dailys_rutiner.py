"""Dailys med sparade rutiner: växling mellan dagar, byte för dagen och att inget går förlorat."""
import datetime

from conftest import start, go, back_to_day


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
    assert page.text_content('.dl-h b') == 'Mage A'
    names = page.evaluate("[1, 2, 3].map(i => routinePlanned(shift(TODAY, i)).name)")
    assert names == ['Mage B', 'Mage A', 'Mage B']
    page.evaluate("S.dailyMode = 'rotate'")
    assert page.evaluate("[1, 2, 3].map(i => routinePlanned(shift(TODAY, i)).name)") == ['Mage B', 'Rörlighet', 'Mage A']
    # Dagens lista är Varje dag plus rutinen
    assert page.evaluate("dailyList(TODAY).map(e => e.id)") == ['promenad', 'plankan', 'russian_twist']


def test_switch_for_today_keeps_checks_and_continues_rotation(page):
    prepare(page, "rotate")
    page.click('[data-dcheck=plankan]')
    page.click('.dl-byt')
    page.click('[data-rutpick=rb]')
    assert page.text_content('.dl-h b') == 'Mage B'
    assert page.evaluate("dailyDone(TODAY, 'plankan')")
    assert page.evaluate("routinePlanned(shift(TODAY, 1)).name") == 'Rörlighet'
    # Gårdagens rutin räknas inte om när man byter idag
    assert page.evaluate("S.log[TODAY].dailyRoutine") == 'rb'


def test_all_done_counts_routine(page):
    prepare(page)
    for ex in ['promenad', 'plankan', 'russian_twist']:
        page.click(f'[data-dcheck={ex}]')
    assert page.evaluate("allDailiesDone(TODAY)")
    assert page.evaluate("S.log[TODAY].dailyRoutine") == 'ra'


def test_manage_routines_create_rename_delete(page):
    prepare(page, "manual")
    page.click('.dl-upp')
    # Äldre "välj själv" blir ett veckoschema när Upplägg öppnas
    assert page.evaluate("S.dailyMode") == 'week'
    page.click('[data-rutnew]')
    page.fill('.rutname input', 'Kvällsrutin')
    page.click('.rutname button[type=submit]')
    assert page.evaluate("S.dailyRoutines.map(r => r.name)")[-1] == 'Kvällsrutin'
    assert page.locator('.up-dh h1').text_content() == 'Kvällsrutin'   # den nya rutinen öppnas
    page.click('[data-rutback]')
    page.click('[data-rutopen=ra]')
    page.click('[data-rutmenu=ra]')
    page.click('[data-rutren=ra]')
    page.fill('.rutname input', 'Morgonmage')
    page.click('.rutname button[type=submit]')
    assert page.evaluate("routineById('ra').name") == 'Morgonmage'
    page.click('[data-rutmenu=ra]')
    page.click('[data-rutdel=ra]')
    assert 'blir vila' in page.inner_text('[data-rutdel=ra]')   # säger vilka dagar som påverkas
    page.click('[data-rutdel=ra]')
    assert page.evaluate("S.dailyRoutines.some(r => r.id === 'ra')") is False
    assert 'ra' not in page.evaluate("S.dailyWeek")


def test_week_planner(page):
    """Upplägg → Veckan: välj rutin och tryck på dagar; sparas direkt och gäller varje vecka."""
    prepare(page, "alternate")   # 9 november 2026 är en måndag
    page.click('.dl-upp')
    assert page.evaluate("S.dailyWeek") == ['ra', 'rb', 'ra', 'rb', 'ra', 'rb', 'ra']
    page.click('[data-plsel=rc]')
    page.click('[data-plday="4"]')
    page.click('[data-plsel=""]')
    page.click('[data-plday="6"]')
    assert page.evaluate("S.dailyWeek") == ['ra', 'rb', 'ra', 'rb', 'rc', 'rb', '']
    assert page.evaluate("[4, 11].map(i => routinePlanned(shift(TODAY, i)).name)") == ['Rörlighet', 'Rörlighet']
    assert page.evaluate("routinePlanned(shift(TODAY, 6))") is None
    # Vila tar bara bort rutinen: Varje dag är kvar
    assert page.evaluate("dailyList(shift(TODAY, 6)).map(e => e.id)") == ['promenad']
    page.click('[data-plfill=turn]')
    assert page.evaluate("S.dailyWeek") == ['ra', 'rb', 'rc', 'ra', 'rb', 'rc', 'ra']
    # Turordning fortsätter in i nästa vecka
    page.click('[data-uppmode=rotate]')
    assert page.evaluate("S.dailyMode") == 'rotate'
    assert page.evaluate("[0, 1, 2, 3, 7].map(i => routinePlanned(shift(TODAY, i)).id)") == ['ra', 'rb', 'rc', 'ra', 'rb']
    # Veckotabellen visar Rörlighet bara på sina dagar
    page.click('[data-rutback]')
    page.click('[data-dlview=vecka]')
    assert page.locator('.wk-r', has_text='Cykelcrunch').locator('.wk-d').count() == 2


def test_week_edit_routine_and_today_switch_only_today(page):
    prepare(page, "alternate")
    page.click('.dl-upp')
    page.click('[data-rutopen=ra]')
    assert page.locator('.up-dh h1').text_content() == 'Mage A'
    # Övningen fälls ut: set med − och +, och Ta bort
    page.click('[data-uxopen="0"]')
    page.click('[data-uxsets="1"]')
    assert page.evaluate("routineById('ra').ex[0].sets") == 4
    page.click('[data-xdel="rut:ra"][data-idx="0"]')
    assert page.evaluate("routineById('ra').ex.map(e => e.id)") == ['russian_twist']
    back_to_day(page)
    # Byt rutin i Dag gäller bara idag
    page.click('.dl-byt')
    page.click('[data-rutpick=rb]')
    assert page.text_content('.dl-h b') == 'Mage B'
    assert page.evaluate("S.dailyWeek[0]") == 'ra' and page.evaluate("routinePlanned(shift(TODAY, 7)).name") == 'Mage A'
    # Dag lägger bara till för dagen (eller framåt via väljaren); kosttillskott ändras bara under Upplägg
    assert page.locator('.dlx [data-openpick]').count() == 0 and page.locator('.dl-editbtn').count() == 1
    assert page.locator('.dlx [data-suppadd], .dlx [data-suppedit]').count() == 0
    page.click('[data-dlview=vecka]')
    assert page.locator('.dlx [data-openpick], .dlx [data-suppadd], .dlx [data-suppedit], .dlx [data-rutopen]').count() == 0


def test_upplagg_every_day_supplements_and_colors(page):
    prepare(page, "manual")
    page.click('.dl-upp')
    colors = page.evaluate("dailyRoutines().map(r => rutColor(r))")
    # Kosttillskott läggs till och tas bort under Varje dag
    page.click('[data-rutopen=supp]')
    page.click('[data-suppadd]')
    page.fill('#supplement-form [name=name]', 'Kreatin')
    page.click('#supplement-form [type=submit]')
    assert page.evaluate("S.supplements.map(x => x.name)") == ['Kreatin']
    page.click('[data-suppedit="0"]')
    page.click('[data-suppdel="0"]')
    assert page.evaluate("S.supplements.length") == 0
    page.click('[data-rutback]')
    # Turordning: rutinerna kan dras i ordning, och färgen följer rutinen
    page.click('[data-uppmode=rotate]')
    assert page.evaluate("getComputedStyle(document.querySelector('.rutgrip')).touchAction") == 'none'
    page.evaluate("S.dailyRoutines.reverse(); render()")
    assert page.evaluate("rutColor(routineById('ra'))") == colors[0]


def test_week_check_missed_day_afterwards(page):
    """Vecka: en missad övning eller ett kosttillskott bockas av i efterhand; kommande dagar går inte att trycka på."""
    page.clock.install(time=datetime.datetime(2026, 11, 11, 12, 0))   # onsdag
    start(page)
    page.evaluate("""S.daily = [exEntry('plankan')]; S.supplements = [{id: 's1', name: 'Kreatin'}]; save()""")
    go(page, 'dailys')
    page.click('[data-dlview=vecka]')
    page.click('[data-wkck="2026-11-09"][data-wkid="plankan"]')
    page.click('[data-wkck="2026-11-10"][data-wkid="supp:s1"]')
    assert page.evaluate("dailyDone('2026-11-09', 'plankan')") is True
    assert page.evaluate("S.log['2026-11-10'].dailies['supp:s1']") is True
    page.click('[data-wkck="2026-11-09"][data-wkid="plankan"]')
    assert page.evaluate("dailyDone('2026-11-09', 'plankan')") is False
    assert page.locator('[data-wkck="2026-11-12"]').count() == 0


def test_week_navigation_back_and_forth(page):
    page.clock.install(time=datetime.datetime(2026, 11, 11, 12, 0))
    start(page)
    page.evaluate("S.daily = [exEntry('plankan')]; save()")
    go(page, 'dailys')
    page.click('[data-dlview=vecka]')
    assert page.locator('[data-dlweek="7"]').is_disabled()
    page.click('[data-dlweek="-7"]')
    assert page.evaluate("dlWeek") == '2026-11-02'
    page.click('[data-wkck="2026-11-04"][data-wkid="plankan"]')
    assert page.evaluate("dailyDone('2026-11-04', 'plankan')") is True
    page.click('[data-dlweek="7"]')
    assert page.evaluate("dlWeek") is None


def test_day_done_banner(page):
    start(page)
    page.evaluate("S.daily = [exEntry('plankan')]; S.supplements = [{id: 's1', name: 'Kreatin'}]; save()")
    go(page, 'dailys')
    assert page.locator('.dl-sum').count() == 0
    page.click('[data-dcheck=plankan]')
    assert page.locator('.dl-sum').count() == 0   # kosttillskottet återstår
    page.click('[data-suppcheck=s1]')
    assert "Bra jobbat" in page.inner_text('.dl-sum') and page.locator('.dl-rows').count() == 0
    page.click('[data-dllist]')
    assert page.locator('.dl-rows [data-dcheck=plankan]').count() == 1
    page.click('[data-dcheck=plankan]')
    assert page.locator('.dl-sum').count() == 0


def test_day_add_and_remove_today_or_ahead(page):
    prepare(page, "manual")   # dagens rutin Mage A: plankan, russian_twist; Varje dag: promenad
    assert page.locator('.dl-minus, .dl-addrow').count() == 0   # vanliga läget: bara listan
    page.click('[data-dledit2]')
    # Lägg till bara idag
    page.click('.dl-addrow')
    assert page.locator('[data-libtoday="true"].on').count() == 1
    page.fill('#mskq', 'dead bug'); page.click('[data-libpick="dead_bug"]')
    assert 'dead_bug' in page.evaluate("dailyList(TODAY).map(e => e.id)")
    assert 'dead_bug' not in page.evaluate("routineById('ra').ex.map(e => e.id)")
    assert 'dead_bug' not in page.evaluate("dailyList(shift(TODAY, 7)).map(e => e.id)")
    # Ta bort bara idag: finns kvar i rutinen
    page.click('[data-dldrop="plankan"]')
    assert 'plankan' not in page.evaluate("dailyList(TODAY).map(e => e.id)")
    assert 'plankan' in page.evaluate("routineById('ra').ex.map(e => e.id)")
    # Även framåt: tillagt i rutinen, borttaget ur rutinen
    page.click('[data-dlahead="true"]:not([data-openpick])')
    page.click('.dl-addrow')
    assert page.locator('[data-libtoday="false"].on').count() == 1
    page.fill('#mskq', 'sidoplanka'); page.click('[data-libpick="sidoplanka"]')
    assert 'sidoplanka' in page.evaluate("routineById('ra').ex.map(e => e.id)")
    page.click('[data-dlahead="true"]:not([data-openpick])')
    page.click('[data-dldrop="russian_twist"]')
    assert 'russian_twist' not in page.evaluate("routineById('ra').ex.map(e => e.id)")
    page.click('.dl-done2')
    assert page.locator('.dl-minus').count() == 0


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
