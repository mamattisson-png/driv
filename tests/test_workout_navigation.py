"""Ett pågående pass kan lämnas och avslutas utan att resultat tappas."""
import datetime

import pytest
from conftest import start, go


def active_workout(page):
    page.clock.install(time=datetime.datetime(2026, 10, 29, 12, 0))
    start(page)
    go(page, 'pass')
    page.click('[data-focusstart]')
    page.click('.fbar .fdone')


def test_can_navigate_and_resume_same_exercise_with_saved_sets(page):
    active_workout(page)
    assert page.locator('#nav').is_visible()
    before = page.evaluate('({dayId:focus.dayId,idx:focus.idx,start:focus.start,sets:workoutOn(TODAY,focus.dayId).sets})')
    for target in ['kost', 'historik', 'idag']:
        page.click(f'#nav [data-tab="{target}"]')
        assert page.evaluate('tab') == target
        assert page.locator('.focus').count() == 0
        assert page.evaluate('focus.dayId') == before['dayId']
    page.click('#nav [data-tab="pass"]')
    assert page.locator('.focus').count() == 1
    assert page.evaluate('({dayId:focus.dayId,idx:focus.idx,start:focus.start,sets:workoutOn(TODAY,focus.dayId).sets})') == before


def test_finish_completed_workout_is_an_action_and_does_not_reopen_it(page):
    start(page)
    page.evaluate('S.plan.days[0].ex = [{id:"bankpress",sets:1,reps:"8"}]; render()')
    go(page, 'pass')
    page.click('[data-focusstart]')
    page.click('.fbar .fdone')
    assert page.evaluate('workoutsOn(TODAY)[0].done') is True
    button = page.locator('.fbar .primary')
    assert button.inner_text() == 'Avsluta pass'
    button.click()
    assert page.locator('.passdone').is_visible()
    assert page.evaluate('focus') is None
    assert page.evaluate('workoutsOn(TODAY)[0].done') is True
    assert page.evaluate('workoutsOn(TODAY)[0].end >= workoutsOn(TODAY)[0].start') is True
    page.reload()
    assert page.evaluate('workoutsOn(TODAY)[0].done') is True


def test_partial_workout_can_save_and_finish(page):
    active_workout(page)
    page.click('[data-fend]')
    button = page.locator('.endsheet [data-focusend]')
    assert button.inner_text() == 'Spara och avsluta'
    button.click()
    assert page.locator('.passdone').is_visible()
    assert page.evaluate('workoutsOn(TODAY)[0].done') is True


def test_past_workout_edit_does_not_replace_or_end_active_workout(page):
    active_workout(page)
    before = page.evaluate('({dayId:focus.dayId,idx:focus.idx,start:focus.start,sets:workoutOn(TODAY,focus.dayId).sets})')
    past = page.evaluate("""() => {
        const date=shift(TODAY,-1), id=S.plan.days[1].id;
        S.log[date]={workouts:[{dayId:id,done:false,sets:{}}],food:[],dailies:{}};
        return {date,id};
    }""")
    page.click('#nav [data-tab="historik"]')
    page.click(f'[data-histday="{past["date"]}"]')
    page.click(f'[data-hpass="{past["id"]}"]')
    assert page.locator('.pastlog').count() == 1
    assert page.evaluate('currentPassDay().id') != before['dayId']
    page.click('[data-fillall]')
    assert page.evaluate('focus.idx') == before['idx']
    page.click('[data-editdone]')
    page.click('.sheet .iconbtn[data-hclose]')
    page.click('#nav [data-tab="pass"]')
    assert page.evaluate('({dayId:focus.dayId,idx:focus.idx,start:focus.start,sets:workoutOn(TODAY,focus.dayId).sets})') == before


@pytest.mark.parametrize('width', [320, 390])
@pytest.mark.parametrize('theme', ['light', 'dark'])
def test_focus_actions_and_rest_controls_do_not_overlap_navigation(page, width, theme):
    page.set_viewport_size({'width':width,'height':844})
    active_workout(page)
    page.evaluate('setTheme', theme)
    page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
    assert page.locator('#nav').is_visible()
    nav = page.locator('#nav').bounding_box()
    footer = page.locator('.fbar').bounding_box()
    assert footer['y'] + footer['height'] <= nav['y']
    assert page.locator('.frestctl').is_visible()
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')


def test_inspecting_another_workout_today_keeps_active_workout(page):
    active_workout(page)
    before = page.evaluate('({dayId:focus.dayId,idx:focus.idx,start:focus.start})')
    other = page.evaluate("""() => {
        const id=S.plan.days[1].id;
        day().workouts.push({dayId:id,done:true,sets:{}});
        return id;
    }""")
    page.click('#nav [data-tab="historik"]')
    date=page.evaluate('TODAY')
    page.click(f'[data-histday="{date}"]')
    page.click(f'[data-hpass="{other}"]')
    assert page.locator('.focus').count() == 0
    assert page.evaluate('currentPassDay().id') == other
    assert page.evaluate('focus && focus.dayId') == before['dayId']
    page.click('#nav [data-tab="pass"]')
    assert page.locator('.focus').count() == 1
    assert page.evaluate('({dayId:focus.dayId,idx:focus.idx,start:focus.start})') == before


def test_finishing_past_log_keeps_current_workout_and_rest_timer(page):
    active_workout(page)
    before = page.evaluate('({dayId:focus.dayId,idx:focus.idx,start:focus.start,restEnd:rest.end})')
    past = page.evaluate("""() => {
        const date=shift(TODAY,-1), id=focus.dayId;
        S.log[date]={workouts:[{dayId:id,done:false,sets:{bankpress:[{kg:40,reps:8,ok:true}]}}],food:[],dailies:{}};
        return {date,id};
    }""")
    page.click('#nav [data-tab="historik"]')
    page.click(f'[data-histday="{past["date"]}"]')
    page.click(f'[data-hpass="{past["id"]}"]')
    page.click('[data-finish]')
    assert page.evaluate('!!rest.el') is True
    assert page.evaluate('({dayId:focus.dayId,idx:focus.idx,start:focus.start,restEnd:rest.end})') == before
    assert page.evaluate('date => workoutsOn(date)[0].done', past['date']) is True


def test_home_reflects_active_selected_workout_before_first_set(page):
    start(page)
    go(page, 'pass')
    selected = page.evaluate('({id:S.plan.days[2].id,name:S.plan.days[2].name})')
    page.click(f'[data-pick="{selected["id"]}"]')
    page.click('[data-focusstart]')
    page.click('#nav [data-tab="idag"]')
    assert page.inner_text('.passtile .hname').lower() == selected['name'].lower()
    assert page.text_content('.passtile .klabel') == 'Pågående pass'
    page.click('#nav [data-tab="pass"]')
    assert page.evaluate('focus.dayId') == selected['id']
