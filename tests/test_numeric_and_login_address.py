"""Numeric keyboard hints and stable OTP destination in both login views."""
import pytest
from conftest import start, go
from test_app import SB_CONFIG, SUPABASE_MOCK, prof


def test_daily_history_edit_uses_numeric_keyboard_and_keeps_reps(page):
    start(page)
    page.evaluate("histDay=TODAY;tab='historik';dailyEditing=true;render()")
    reps=page.locator('[data-t="daily"][data-f="reps"]').first
    assert reps.get_attribute('inputmode')=='numeric'
    reps.fill('45')
    reps.dispatch_event('change')
    page.evaluate('render()')
    assert page.locator('[data-t="daily"][data-f="reps"]').first.input_value()=='45'


def test_profile_keyboards_distinguish_integer_and_decimal(page):
    start(page)
    page.evaluate("document.getElementById('app').innerHTML=profileFields(S.profile)")
    for name,mode,step in [('age','numeric','1'),('weight','decimal','0.1'),('height','decimal','0.1')]:
        field=page.locator(f'[data-prof="{name}"]')
        assert field.get_attribute('inputmode')==mode
        assert field.get_attribute('step')==step


@pytest.mark.parametrize('welcome',[False,True])
def test_destination_stays_visible_after_wrong_code_and_resend(page,welcome):
    page.context.route('**/config.js', lambda r:r.fulfill(body=SB_CONFIG,content_type='application/javascript'))
    start(page,SUPABASE_MOCK)
    if welcome:
        page.evaluate("welcomeLogin='login';S.setupDone=false;tab='upplagg';render()")
    else:
        prof(page,'konto')
    page.fill('#acctemail','test@exempel.se')
    page.click('[data-sendcode]')
    page.wait_for_selector('#acctcode')
    assert page.inner_text('.code-destination strong')=='test@exempel.se'
    page.fill('#acctcode','000000');page.click('[data-verifycode]')
    page.wait_for_function("account.msg.includes('stämmer inte')")
    assert page.inner_text('.code-destination strong')=='test@exempel.se'
    page.evaluate("account.msg='';render()")
    assert page.inner_text('.code-destination strong')=='test@exempel.se'
    page.click('[data-changeemail]')
    assert page.input_value('#acctemail')=='test@exempel.se'


@pytest.mark.parametrize('width',[320,390])
def test_long_destination_wraps_and_is_escaped(page,width):
    page.set_viewport_size({'width':width,'height':844})
    start(page)
    email='very.long.email.address.for.mobile.layout@example.se'
    page.evaluate("email=>{account.step='code';account.email=email;document.getElementById('app').innerHTML=loginView()}",email)
    assert page.inner_text('.code-destination strong')==email
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')
    page.evaluate("account.email='<img src=x onerror=alert(1)>';document.getElementById('app').innerHTML=loginView()")
    assert page.locator('.code-destination img').count()==0
    assert '<img' in page.inner_text('.code-destination')
