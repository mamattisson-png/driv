"""Tydliga redigerbara sifferfält och reps från det synliga förvalet."""
import datetime
import pytest
from conftest import start, go
from test_design import CONTRAST


def workout(page):
    page.clock.install(time=datetime.datetime(2026,10,29,12,0))
    start(page)
    page.evaluate('S.plan.days[0].ex=[{id:"bankpress",sets:2,reps:"6–8"},{id:"bicepscurl",sets:2,reps:"8–10"}];save();render()')
    go(page,'pass');page.click('[data-focusstart]')


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



@pytest.mark.parametrize('weight',[10.5,11,11.5,12])
def test_manual_weight_allows_small_increases_and_is_saved(page,weight):
    workout(page)
    kg=page.locator('.fset.active [data-f="kg"]')
    kg.fill(str(weight));kg.blur()
    reps=page.locator('.fset.active [data-f="reps"]');reps.fill('7');reps.blur()
    assert page.evaluate('workoutsOn(TODAY)[0].sets.bankpress[0].kg')==weight
    page.reload();go(page,'pass');page.click('[data-focusstart]')
    assert float(page.input_value('.fset.active [data-f="kg"]'))==weight
    assert page.input_value('.fset.active [data-f="reps"]')=='7'


@pytest.mark.parametrize('theme',['light','dark'])
@pytest.mark.parametrize('width',[320,390])
def test_number_fields_look_editable_and_request_numeric_keyboards(page,theme,width):
    page.set_viewport_size({'width':width,'height':844});workout(page)
    page.evaluate('setTheme',theme)
    assert page.locator('[data-weightstep]').count()==0
    kg=page.locator('.fset.active [data-f="kg"]');reps=page.locator('.fset.active [data-f="reps"]')
    assert kg.get_attribute('inputmode')=='decimal'
    assert reps.get_attribute('inputmode')=='numeric'
    for field in [kg,reps]:
        assert field.get_attribute('type')=='number'
        assert field.evaluate('e=>getComputedStyle(e).borderTopStyle')=='solid'
        assert field.evaluate('e=>getComputedStyle(e).borderTopWidth')=='1px'
    assert page.locator('#app').evaluate(CONTRAST)==[]
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')


def test_warmup_reps_start_from_its_visible_hint(page):
    workout(page)
    page.evaluate('S.plan.days[0].ex[0].warm=1;save();render()')
    assert page.locator('.fset.active [data-f="reps"]').get_attribute('placeholder')=='8'
    page.click('.fset.active [data-step="reps"][data-dir="1"]')
    assert page.input_value('.fset.active [data-f="reps"]')=='9'
