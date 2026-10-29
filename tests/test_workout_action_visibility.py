"""Setknappen är alltid åtkomlig, även med många set och vilotimer."""
import datetime
import pytest
from conftest import start, go


def many_sets(page,resting=True,superset=False):
    page.clock.install(time=datetime.datetime(2026,10,29,12,0));start(page)
    page.evaluate('''ss => {
      const d=S.plan.days[0];d.ex=[{id:'bankpress',sets:10,warm:2,reps:'6–8',ss},{id:'bicepscurl',sets:10,reps:'8–10'}];
      const w=workoutFor(d);w.sets.bankpress=Array.from({length:9},()=>({kg:20,reps:8,ok:true}));
      w.warm={bankpress:[{kg:5,reps:8,ok:true},{kg:10,reps:5,ok:true}]};save();render();
    }''',superset)
    go(page,'pass');page.click('[data-focusstart]')
    if resting: page.evaluate("startRest('bankpress')")
    page.evaluate('render()')


@pytest.mark.parametrize('size',[(320,568),(390,640),(390,844)])
@pytest.mark.parametrize('resting',[False,True])
@pytest.mark.parametrize('superset',[False,True])
def test_set_action_is_uncovered_at_every_scroll_position(page,size,resting,superset):
    page.set_viewport_size({'width':size[0],'height':size[1]});many_sets(page,resting,superset)
    assert page.locator('.fbar .fdone').count()==1
    assert page.locator('.fset.active .fdone').count()==0
    for position in [0,0.5,1]:
        page.locator('.focus-scroll').evaluate('(e,p)=>e.scrollTop=(e.scrollHeight-e.clientHeight)*p',position)
        button=page.locator('.fbar .fdone')
        box=button.bounding_box();nav=page.locator('#nav').bounding_box()
        assert box['y']>=0 and box['y']+box['height']<=nav['y']
        assert button.evaluate('''e=>{
          const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return !!hit && e.contains(hit);
        }''')
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')


def test_original_set_rows_and_exercise_navigation_are_preserved(page):
    many_sets(page)
    assert page.locator('.set-icons, .set-icon').count()==0
    assert page.locator('.fsets > .fset').count()==12
    assert page.locator('.fsets > .fset.done').count()==11
    assert page.locator('[data-focusgo="0"]').count()>=1
    assert page.locator('[data-focusgo="1"]').count()>=1
    page.locator('.completed-sets summary').click()
    page.click('.fsets [data-fsel="0"]')
    assert page.locator('.fset.active.warm').count()==1
    assert page.input_value('.fset.active [data-f="kg"]')=='5'
    page.click('.fbar .fdone')
    assert page.locator('.fset.active [data-f="kg"]').get_attribute('data-i')=='9'
    assert page.evaluate('workoutsOn(TODAY)[0].warm.bankpress[0].kg')==5


@pytest.mark.parametrize('size',[(320,568),(390,844)])
def test_all_workout_tools_can_be_reached_without_any_overlay(page,size):
    page.set_viewport_size({'width':size[0],'height':size[1]});many_sets(page)
    for button in page.locator('.ftools button').all():
        button.scroll_into_view_if_needed()
        box=button.bounding_box();footer=page.locator('.fbar').bounding_box()
        assert box['y']>=0 and box['y']+box['height']<=footer['y']
        assert button.evaluate('e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}')


def test_adjusting_values_preserves_the_workout_scroll_position(page):
    many_sets(page)
    page.locator('.fset.active').scroll_into_view_if_needed()
    before=page.locator('.focus-scroll').evaluate('e=>e.scrollTop')
    page.click('.fset.active [data-step="kg"][data-dir="1"]')
    after=page.locator('.focus-scroll').evaluate('e=>e.scrollTop')
    assert abs(after-before)<2


def test_sticky_set_action_records_the_right_set_and_advances(page):
    many_sets(page)
    page.locator('.fset.active [data-f="kg"]').fill('21.5')
    page.locator('.fset.active [data-f="reps"]').fill('7')
    page.click('.fbar .fdone')
    assert page.evaluate('workoutsOn(TODAY)[0].sets.bankpress[9].ok') is True
    assert page.evaluate('workoutsOn(TODAY)[0].sets.bankpress[9].kg')==21.5
    assert page.evaluate('focus.idx')==1
