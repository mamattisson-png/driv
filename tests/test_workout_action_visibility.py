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
        page.evaluate('p=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p)',position)
        button=page.locator('.fbar .fdone')
        box=button.bounding_box();nav=page.locator('#nav').bounding_box()
        assert box['y']>=0 and box['y']+box['height']<=nav['y']
        assert button.evaluate('''e=>{
          const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return !!hit && e.contains(hit);
        }''')
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')


def test_completed_warmup_and_work_sets_can_be_expanded_and_edited(page):
    many_sets(page)
    assert '11 genomförda set' in page.inner_text('.completed-sets summary')
    assert page.locator('.completed-sets').get_attribute('open') is None
    assert page.locator('.completed-sets .fset:visible').count()==0
    page.click('.completed-sets summary')
    assert page.locator('.completed-sets .fset:visible').count()==11
    page.click('.completed-sets [data-fsel="0"]')
    assert page.locator('.fset.active.warm').count()==1
    assert page.input_value('.fset.active [data-f="kg"]')=='5'
    page.click('.fbar .fdone')
    assert page.locator('.fset.active [data-f="kg"]').get_attribute('data-i')=='9'
    assert page.evaluate('workoutsOn(TODAY)[0].warm.bankpress[0].kg')==5


def test_sticky_set_action_records_the_right_set_and_advances(page):
    many_sets(page)
    page.locator('.fset.active [data-f="kg"]').fill('21.5')
    page.locator('.fset.active [data-f="reps"]').fill('7')
    page.click('.fbar .fdone')
    assert page.evaluate('workoutsOn(TODAY)[0].sets.bankpress[9].ok') is True
    assert page.evaluate('workoutsOn(TODAY)[0].sets.bankpress[9].kg')==21.5
    assert page.evaluate('focus.idx')==1
