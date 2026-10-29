"""Viktsteget kan väljas per övning och följer med till nästa pass."""
import datetime
import pytest
from conftest import start, go
from test_design import CONTRAST


def workout(page):
    page.clock.install(time=datetime.datetime(2026,10,29,12,0))
    start(page)
    page.evaluate('S.plan.days[0].ex=[{id:"bankpress",sets:2,reps:"6–8"},{id:"bicepscurl",sets:2,reps:"8–10"}];save();render()')
    go(page,'pass');page.click('[data-focusstart]')


@pytest.mark.parametrize('step',[0.5,1,1.5,2,2.5,5])
def test_selected_increment_applies_to_plus_and_minus_without_changing_reps(page,step):
    workout(page)
    page.select_option('[data-weightstep="bankpress"]',str(step))
    kg=page.locator('.fset.active [data-f="kg"]');kg.fill('10');kg.blur()
    reps=page.locator('.fset.active [data-f="reps"]');reps.fill('7');reps.blur()
    page.click('.fset.active [data-step="kg"][data-dir="1"]')
    assert float(page.input_value('.fset.active [data-f="kg"]'))==10+step
    assert page.input_value('.fset.active [data-f="reps"]')=='7'
    page.click('.fset.active [data-step="kg"][data-dir="-1"]')
    assert page.input_value('.fset.active [data-f="kg"]')=='10'


def test_increment_is_remembered_per_exercise_and_after_reload(page):
    workout(page)
    page.select_option('[data-weightstep="bankpress"]','0.5')
    page.click('[data-focusgo="1"]')
    assert page.input_value('[data-weightstep="bicepscurl"]')=='2.5'
    page.select_option('[data-weightstep="bicepscurl"]','1')
    page.reload();go(page,'pass');page.click('[data-focusstart]')
    assert page.input_value('[data-weightstep="bankpress"]')=='0.5'
    page.click('[data-focusgo="1"]')
    assert page.input_value('[data-weightstep="bicepscurl"]')=='1'


def test_selected_increment_is_used_for_next_workout_target(page):
    workout(page)
    page.evaluate('''() => {
      S.log[shift(TODAY,-2)]={food:[],dailies:{},workouts:[{dayId:S.plan.days[0].id,done:true,sets:{bankpress:[{kg:40,reps:8,ok:true}]}}]};save();render();
    }''')
    page.select_option('[data-weightstep="bankpress"]','0.5')
    assert page.locator('.fset.active [data-f="kg"]').get_attribute('placeholder')=='40.5'


@pytest.mark.parametrize('theme',['light','dark'])
@pytest.mark.parametrize('width',[320,390])
def test_increment_control_mobile_layout_and_contrast(page,theme,width):
    page.set_viewport_size({'width':width,'height':844});workout(page)
    page.evaluate('setTheme',theme)
    assert page.locator('#app').evaluate(CONTRAST)==[]
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')


@pytest.mark.parametrize('mobile',[False,True])
@pytest.mark.parametrize('direction,expected',[(1,7),(-1,5)])
def test_reps_start_from_visible_default_on_desktop_and_touch(browser,base_url,mobile,direction,expected):
    ctx=browser.new_context(is_mobile=mobile,has_touch=mobile,viewport={'width':390 if mobile else 1200,'height':844})
    ctx.route('**/config.js',lambda r:r.fulfill(body='window.DRIV_CONFIG={};',content_type='application/javascript'))
    pg=ctx.new_page();pg.base_url=base_url
    try:
        workout(pg)
        reps=pg.locator('.fset.active [data-f="reps"]')
        assert reps.input_value()=='' and reps.get_attribute('placeholder')=='6'
        button=pg.locator(f'.fset.active [data-step="reps"][data-dir="{direction}"]')
        button.tap() if mobile else button.click()
        assert pg.input_value('.fset.active [data-f="reps"]')==str(expected)
    finally:
        ctx.close()


def test_explicit_zero_is_not_replaced_by_rep_default(page):
    workout(page)
    reps=page.locator('.fset.active [data-f="reps"]');reps.fill('0');reps.blur()
    page.click('.fset.active [data-step="reps"][data-dir="1"]')
    assert page.input_value('.fset.active [data-f="reps"]')=='1'


def test_warmup_uses_its_own_visible_rep_hint_and_chosen_weight_step(page):
    workout(page)
    page.evaluate('S.plan.days[0].ex[0].warm=1;save();render()')
    assert page.locator('.fset.active').get_attribute('class').find('warm')>=0
    assert page.locator('.fset.active [data-f="reps"]').get_attribute('placeholder')=='8'
    page.click('.fset.active [data-step="reps"][data-dir="1"]')
    assert page.input_value('.fset.active [data-f="reps"]')=='9'
    page.select_option('[data-weightstep="bankpress"]','0.5')
    page.click('.fset.active [data-step="kg"][data-dir="1"]')
    assert page.input_value('.fset.active [data-f="kg"]')=='0.5'
