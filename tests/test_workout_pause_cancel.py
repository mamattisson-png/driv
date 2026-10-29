from conftest import start,go
from test_workout_navigation import active_workout
import pytest


def test_pause_removes_rest_timer_and_keeps_sets_for_resume(page):
    active_workout(page)
    before=page.evaluate('JSON.stringify(workoutsOn(TODAY)[0].sets)')
    page.click('[data-fend]');page.click('[data-focusexit]')
    assert page.locator('.rest').count()==0
    assert page.evaluate('rest.end===0 && rest.timer===0')
    assert not page.locator('body').evaluate('e=>e.classList.contains("resting")')
    assert page.evaluate('JSON.stringify(workoutsOn(TODAY)[0].sets)')==before
    page.click('[data-focusstart]')
    assert page.locator('.focus').count()==1
    page.click('.fset.active .fdone')
    assert page.locator('.rest').count()==1


def test_cancel_started_workout_requires_confirmation_and_only_removes_that_workout(page):
    active_workout(page)
    ids=page.evaluate('''() => {
      const current=focus.dayId, other=S.plan.days.find(d=>d.id!==current).id, yesterday=shift(TODAY,-1);
      day().workouts.push({dayId:other,done:true,end:Date.now(),sets:{}});
      day().food=[{name:'Mat',kcal:500,protein:20,meal:1}];day().dailies={planka:true};
      S.log[yesterday]={workouts:[{dayId:current,done:true,sets:{}}],dailies:{},food:[]};save();
      return {current,other,yesterday};
    }''')
    page.click('[data-fend]');page.click('[data-passcancel]')
    assert page.get_by_role('dialog',name='Avbryt passet').is_visible()
    page.click('[data-passcancelclose]')
    assert page.evaluate('workoutsOn(TODAY).length')==2
    page.click('[data-fend]');page.click('[data-passcancel]');page.click('[data-passcancelconfirm]')
    assert page.evaluate('focus') is None
    assert page.locator('.rest').count()==0
    assert page.evaluate('workoutsOn(TODAY).map(w=>w.dayId)')==[ids['other']]
    assert page.evaluate('day().food[0].kcal')==500
    assert page.evaluate('day().dailies.planka') is True
    page.reload()
    assert page.evaluate('workoutsOn(TODAY).map(w=>w.dayId)')==[ids['other']]
    assert page.evaluate(f'workoutsOn("{ids["yesterday"]}").length')==1


def test_paused_workout_can_be_cancelled_from_overview(page):
    active_workout(page)
    page.click('[data-fend]');page.click('[data-focusexit]')
    page.click('[data-passcancel]');page.click('[data-passcancelconfirm]')
    assert page.evaluate('workoutsOn(TODAY).length')==0
    assert 'Starta' in page.inner_text('[data-focusstart]')


def test_old_finished_rest_cleanup_cannot_stop_a_new_rest(page):
    active_workout(page)
    page.evaluate('rest.end=Date.now();tickRest();stopRest();startRest("bankpress")')
    page.clock.fast_forward(6500)
    assert page.locator('.rest').count()==1
    assert page.evaluate('rest.end>Date.now()')


def test_extending_finished_rest_cancels_its_old_cleanup(page):
    active_workout(page)
    page.evaluate('rest.end=Date.now();tickRest()')
    page.click('.frestctl [data-restadd="15"]')
    page.clock.fast_forward(6500)
    assert page.locator('.rest').count()==1


def test_paused_last_set_can_cancel_before_final_save(page):
    start(page)
    page.evaluate('S.plan.days[0].ex=[{id:"bankpress",sets:1,reps:"8"}];render()')
    go(page,'pass');page.click('[data-focusstart]');page.click('.fset.active .fdone')
    page.click('[data-fend]');page.click('[data-focusexit]')
    page.click('[data-passcancel]');page.click('[data-passcancelconfirm]')
    assert page.evaluate('workoutsOn(TODAY).length')==0


@pytest.mark.parametrize('typed',[False,True])
def test_workout_can_cancel_before_first_checked_set(page,typed):
    start(page);go(page,'pass');page.click('[data-focusstart]')
    if typed:
        page.evaluate('setAt(currentPassDay(),currentPassDay().ex[0].id,0).kg=10;save()')
    page.click('[data-fend]');page.click('[data-passcancel]');page.click('[data-passcancelconfirm]')
    assert page.evaluate('focus') is None
    assert page.evaluate('workoutsOn(TODAY).length')==0
