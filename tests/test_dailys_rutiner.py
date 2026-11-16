"""Dailys med sparade rutiner: växling mellan dagar, byte för dagen och att inget går förlorat."""
import datetime

from conftest import start, go


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
    page.click('.dl-byt')
    page.click('[data-rutpage]')
    page.click('[data-rutnew]')
    page.fill('.rutname input', 'Kvällsrutin')
    page.click('.rutname button[type=submit]')
    assert page.evaluate("S.dailyRoutines.map(r => r.name)")[-1] == 'Kvällsrutin'
    page.click('[data-rutmenu=ra]')
    page.click('[data-rutren=ra]')
    page.fill('.rutname input', 'Morgonmage')
    page.click('.rutname button[type=submit]')
    assert page.evaluate("routineById('ra').name") == 'Morgonmage'
    page.click('[data-rutmenu=rc]')
    page.click('[data-rutdel=rc]')
    page.click('[data-rutdel=rc]')
    assert page.evaluate("S.dailyRoutines.some(r => r.id === 'rc')") is False
    # Övningar läggs till i rutinen via biblioteket
    page.click('[data-rutopen=rb]')
    page.click('[data-openpick="rut:rb"]')
    assert page.text_content('h1') == 'Lägg till daily'


def test_week_planner(page):
    """Planera veckan: välj rutin och tryck på dagarna; snabbval; gäller varje vecka."""
    prepare(page, "alternate")   # 9 november 2026 är en måndag
    page.click('[data-dlview=vecka]')
    assert page.locator('.wk-day').count() == 7
    page.click('.wk-plan')
    # Utkastet börjar med det som gällde (varannan dag: A, B, A, B …)
    assert page.evaluate("plDraft") == ['ra', 'rb', 'ra', 'rb', 'ra', 'rb', 'ra']
    page.click('[data-plsel=rc]')
    page.click('[data-plday="4"]')
    page.click('[data-plsel=""]')
    page.click('[data-plday="6"]')
    page.click('[data-plsave]')
    assert page.evaluate("S.dailyMode") == 'week'
    assert page.evaluate("S.dailyWeek") == ['ra', 'rb', 'ra', 'rb', 'rc', 'rb', '']
    assert page.evaluate("[4, 11].map(i => routinePlanned(shift(TODAY, i)).name)") == ['Rörlighet', 'Rörlighet']
    assert page.evaluate("routinePlanned(shift(TODAY, 6))") is None
    assert page.evaluate("dailyList(shift(TODAY, 6)).map(e => e.id)") == ['promenad']
    # Rörlighets rad har en markering på fredagen och inga andra dagar
    assert page.locator('.wk-r', has_text='Cykelcrunch').locator('.wk-d').count() == 1
    # Snabbval: turordning och samma alla dagar; Tillbaka utan att spara ändrar inget
    page.click('.wk-plan')
    page.click('[data-plfill=turn]')
    assert page.evaluate("plDraft") == ['ra', 'rb', 'rc', 'ra', 'rb', 'rc', 'ra']
    page.click('[data-plsel=rb]')
    page.click('[data-plfill=same]')
    assert page.evaluate("plDraft") == ['rb'] * 7
    page.click('[data-plclose]')
    assert page.evaluate("S.dailyWeek") == ['ra', 'rb', 'ra', 'rb', 'rc', 'rb', '']


def test_week_edit_routine_and_today_switch_only_today(page):
    prepare(page, "alternate")
    page.click('[data-dlview=vecka]')
    page.click('.wk-plan')
    page.click('[data-plsel=ra]')
    page.click('[data-plday="0"]')
    page.click('[data-plsave]')
    # Rutinens övningar ändras från veckan
    page.click('[data-dledit="rut:ra"]')
    assert page.locator('.dl-edit h1').text_content() == 'Mage A'
    page.click('[data-xdel="rut:ra"][data-idx="0"]')
    assert page.evaluate("routineById('ra').ex.map(e => e.id)") == ['russian_twist']
    page.click('[data-dledit=""]')
    # Byt rutin i Dag gäller bara idag
    page.click('[data-dlview=dag]')
    page.click('.dl-byt')
    page.click('[data-rutpick=rb]')
    assert page.text_content('.dl-h b') == 'Mage B'
    assert page.evaluate("S.dailyWeek[0]") == 'ra' and page.evaluate("routinePlanned(shift(TODAY, 7)).name") == 'Mage A'
    # Ingen "Ändra"-text i veckovyn
    page.click('[data-dlview=vecka]')
    assert 'Ändra' not in page.inner_text('.dlx')


def test_routines_page_every_day_move_and_colors(page):
    prepare(page, "manual")
    page.evaluate("rutPage = true; render()")
    colors = page.evaluate("dailyRoutines().map(r => rutColor(r))")
    # Varje dag fälls ut på samma sida som rutinerna
    page.click('[data-rutopen="daily"]')
    assert page.locator('.rutevery [data-xdel="daily"]').count() == 1
    # Flytta via menyn; färgen följer rutinen, inte platsen
    page.click('[data-rutmenu=ra]')
    page.click('[data-rutmv="1"][data-rutmvid=ra]')
    assert page.evaluate("dailyRoutines().map(r => r.id)") == ['rb', 'ra', 'rc']
    assert page.evaluate("rutColor(routineById('ra'))") == colors[0]
    # Handtaget för att dra går att använda med fingret (scrollar inte sidan)
    assert page.evaluate("getComputedStyle(document.querySelector('.rutgrip')).touchAction") == 'none'
