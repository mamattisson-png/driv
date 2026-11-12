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
    assert page.locator('.dlx-rut').count() == 0
    assert 'Övningar · 0/1' in page.text_content('.dlx')
    assert page.locator('[data-rutpage]').count() == 1


def test_alternate_and_rotation(page):
    prepare(page, "alternate")
    assert page.text_content('.dlx-rut b') == 'Mage A'
    assert 'i morgon Mage B' in page.text_content('.dlx-rutnext')
    names = page.evaluate("[1, 2, 3].map(i => routinePlanned(shift(TODAY, i)).name)")
    assert names == ['Mage B', 'Mage A', 'Mage B']
    page.evaluate("S.dailyMode = 'rotate'")
    assert page.evaluate("[1, 2, 3].map(i => routinePlanned(shift(TODAY, i)).name)") == ['Mage B', 'Rörlighet', 'Mage A']
    # Dagens lista är Varje dag plus rutinen
    assert page.evaluate("dailyList(TODAY).map(e => e.id)") == ['promenad', 'plankan', 'russian_twist']


def test_switch_for_today_keeps_checks_and_continues_rotation(page):
    prepare(page, "rotate")
    page.click('[data-dcheck=plankan]')
    page.click('.dlx-rut')
    page.click('[data-rutpick=rb]')
    assert page.text_content('.dlx-rut b') == 'Mage B'
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
    page.click('.dlx-rut')
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
