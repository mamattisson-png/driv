"""Health habits are separate from exercises and use the existing daily log."""
from conftest import start, go


def edit_dailys(page):
    start(page)
    go(page,'pass')
    page.click('[data-trsheet="dailys"]')
    page.click('[data-dedit]')


def test_preset_persists_and_can_be_checked_without_workout(page):
    edit_dailys(page)
    page.click('[data-habitpreset="Kreatin"]')
    assert page.locator('[data-habitpreset="Kreatin"]').is_disabled()
    page.click('[data-dedit]')
    habit=page.get_by_role('region',name='Hälsorutiner')
    assert 'Kreatin' in habit.inner_text()
    habit.get_by_role('button',name='Kreatin klar').click()
    assert habit.get_by_role('button',name='Kreatin klar').get_attribute('aria-pressed')=='true'
    assert page.evaluate('workoutsOn(TODAY).length')==0
    page.reload()
    go(page,'pass')
    page.click('[data-trsheet="dailys"]')
    assert page.get_by_role('button',name='Kreatin klar').get_attribute('aria-pressed')=='true'
    assert page.evaluate('S.daily.some(e=>e.name==="Kreatin")') is False


def test_custom_habit_edit_remove_keeps_logged_history(page):
    edit_dailys(page)
    page.evaluate('S.daily=[];save();render()')
    page.fill('#habit-name','Min rutin')
    page.fill('#habit-note','Efter frukost')
    page.click('[data-habitadd]')
    page.locator('[data-habitedit][data-f="name"]').fill('Kvällsrutin')
    page.locator('[data-habitedit][data-f="name"]').blur()
    page.click('[data-dedit]')
    page.get_by_role('button',name='Kvällsrutin klar').click()
    habit_id=page.evaluate('S.habits[0].id')
    page.click('[data-dedit]')
    page.click('[data-habitremove]')
    assert page.evaluate('S.habits.length')==0
    assert page.evaluate('(id)=>S.log[TODAY].dailies[id]',habit_id) is True
    page.evaluate("dailyEditing=false;tab='historik';histDay=TODAY;render()")
    assert 'Kvällsrutin' in page.get_by_role('region',name='Hälsorutiner').inner_text()


def test_habits_do_not_break_workout_dailys_or_date_separation(page):
    edit_dailys(page)
    page.click('[data-habitpreset="Vatten"]')
    page.click('[data-dedit]')
    page.get_by_role('button',name='Vatten klar').click()
    page.evaluate("tab='historik';histDay=shift(TODAY,-1);render()")
    assert page.get_by_role('button',name='Vatten klar').get_attribute('aria-pressed')=='false'
    page.evaluate("histDay=null;editDate=null;tab='pass';trSheet='dailys';render()")
    page.locator('.sheetbtns [data-trsheet=""]').click()
    page.click('[data-focusstart]')
    page.click('[data-fdopen]')
    assert page.get_by_role('button',name='Vatten klar').is_visible()
    assert page.get_by_role('button',name='Vatten klar').get_attribute('aria-pressed')=='true'


def test_push_reminder_includes_health_habits_on_rest_day(page):
    from pathlib import Path
    source=(Path(__file__).resolve().parents[1]/'supabase/functions/driv-push/regler.js').read_text().replace('export ','')
    result=page.evaluate("(source)=>{return new Function(source+`;return dailyMessage({plan:{mode:'fixed',weekdays:[],days:[]},daily:[],habits:[{id:'habit-water'}]}, {}, '2026-10-30',4);`)()}",source)
    assert result['body']=='1 av 1 dailys kvar idag.'
