"""Confirm a number without recording a completed set."""
import pytest
from test_workout_number_inputs import workout


@pytest.mark.parametrize('field,value',[('kg','22.5'),('reps','9')])
@pytest.mark.parametrize('enter',[False,True])
def test_confirm_only_saves_number(page,field,value,enter):
    workout(page)
    inp=page.locator(f'.fset.active input[data-f="{field}"]')
    inp.fill(value)
    assert page.locator('[data-setconfirm]').is_visible()
    assert not page.locator('.fbar .fdone').is_visible()
    if enter:inp.press('Enter')
    else:page.click('[data-setconfirm]')
    assert page.evaluate('focus.idx')==0
    assert page.evaluate(f'workoutsOn(TODAY)[0].sets.bankpress[0].{field}')==float(value)
    assert page.evaluate('!!workoutsOn(TODAY)[0].sets.bankpress[0].ok') is False
    assert page.locator('.fbar .fdone').is_visible()
    assert page.evaluate('document.activeElement.tagName')!='INPUT'
    page.click('.fbar .fdone')
    assert page.evaluate('workoutsOn(TODAY)[0].sets.bankpress[0].ok') is True


def test_edit_does_not_change_rest_timer_or_warmup_status(page):
    workout(page)
    page.evaluate("dayById(focus.dayId).ex[0].warm=1;focus.sel=null;startRest('bankpress');render()")
    before=page.evaluate('rest.end')
    page.locator('.fset.active input[data-f="kg"]').fill('10.5')
    page.click('[data-setconfirm]')
    assert page.evaluate('rest.end')==before
    assert page.evaluate('workoutsOn(TODAY)[0].warm.bankpress[0].kg')==10.5
    assert page.evaluate('!!workoutsOn(TODAY)[0].warm.bankpress[0].ok') is False


def test_render_and_navigation_clear_editing_mode(page):
    workout(page)
    page.locator('.fset.active input[data-f="kg"]').fill('15')
    assert page.locator('[data-setconfirm]').is_visible()
    page.evaluate("tab='idag';render()")
    assert not page.locator('body').evaluate('e=>e.classList.contains("set-editing")')


def test_ok_remains_in_reduced_mobile_visual_viewport(browser,base_url):
    ctx=browser.new_context(is_mobile=True,has_touch=True,viewport={'width':390,'height':844})
    ctx.route('**/config.js',lambda r:r.fulfill(body='window.DRIV_CONFIG={};',content_type='application/javascript'))
    pg=ctx.new_page();pg.base_url=base_url
    try:
        workout(pg)
        pg.locator('.fset.active input[data-f="kg"]').fill('25')
        pg.evaluate("Object.defineProperty(visualViewport,'height',{configurable:true,value:360});visualViewport.dispatchEvent(new Event('resize'))")
        button=pg.locator('[data-setconfirm]')
        box=button.bounding_box()
        assert box['y']>=0 and box['y']+box['height']<=360
        assert button.evaluate('e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}')
        button.tap()
        assert pg.evaluate('!!workoutsOn(TODAY)[0].sets.bankpress[0].ok') is False
    finally:ctx.close()
