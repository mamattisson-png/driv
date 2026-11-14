"""Startsidan får inte visa tillfälligt utloggat konto vid återläsning."""
from conftest import start
from test_app import SB_CONFIG, SUPABASE_MOCK


def delayed_account(page, mode='signed_in'):
    page.context.route('**/config.js', lambda r: r.fulfill(body=SB_CONFIG, content_type='application/javascript'))
    mock = SUPABASE_MOCK.replace(
        'async getSession() { return',
        'async getSession() { await new Promise(r => window.__releaseSession = r); '
        + ('throw new Error("offline"); ' if mode == 'error' else '') + 'return')
    mock = mock.replace('st.calls.push(name);', '''st.calls.push(name);
        if (name === 'driv_profile_get') await new Promise(r => window.__releaseProfile = r);''')
    setup = '''
      sessionStorage.setItem('sess', JSON.stringify({user:{id:'u1',email:'maria@example.se'}}));
      localStorage.setItem('driv-owner','u1');
    ''' if mode == 'signed_in' else ''
    start(page, setup + mock + '''
      window.__social={profiles:{u1:{name:'Kim',code:'KIM001',sharing:true}},friends:[],activity:[],kudos:[],calls:[]};
    ''')
    page.evaluate('''() => {
      S.name='Maria';
      for(let i=0;i<3;i++) S.log[shift(TODAY,-i)]={workouts:[],dailies:{},food:[{name:'Mat',kcal:100}]};
      save(); tab='idag'; render();
    }''')
    page.wait_for_function("typeof window.__releaseSession === 'function'")


def test_refresh_waits_for_session_and_profile_without_guest_flash(page):
    delayed_account(page)
    assert page.locator('[data-gokonto]').count() == 0
    page.evaluate('window.__releaseSession()')
    page.wait_for_function("typeof window.__releaseProfile === 'function'")
    page.evaluate('render()')
    assert page.locator('[data-gokonto]').count() == 0
    page.evaluate('window.__releaseProfile()')
    page.wait_for_function('account.ready && social.loaded')
    assert page.locator('[data-gokonto]').count() == 0


def test_guest_prompt_waits_until_session_check_finishes(page):
    delayed_account(page, 'guest')
    assert page.locator('[data-gokonto]').count() == 0
    page.evaluate('window.__releaseSession()')
    page.wait_for_function('account.ready')
    # Utan konto efter tre dagars loggning: kortet Spara dina loggar (Skapa konto och Logga in)
    assert page.locator('[data-gokonto]').count() == 2


def test_session_error_does_not_claim_user_is_signed_out(page):
    delayed_account(page, 'error')
    page.evaluate('window.__releaseSession()')
    page.wait_for_function('account.ready')
    assert page.locator('[data-gokonto]').count() == 0
    assert page.locator('.home3').count() == 1
    assert page.evaluate('day().food.length') == 1


def test_google_button_and_disabled_provider_message(page):
    from conftest import open_app
    open_app(page)
    page.evaluate("""history.replaceState(null, '', location.pathname + '?error=server_error&error_description=Unsupported+provider%3A+provider+is+not+enabled');
      oauthError(); document.getElementById('app').innerHTML = loginView()""")
    assert page.locator("[data-oauth]").count() == 3
    assert "inte påslagen" in page.evaluate("account.msg")
    assert page.evaluate("location.search") == ""


def test_login_page_lets_you_skip_account(page):
    from conftest import open_app
    open_app(page)
    page.evaluate("welcomeLogin = 'create'; document.getElementById('app').innerHTML = loginView()")
    page.click(".l3skip")
    assert page.evaluate("onb") == 1 and page.locator(".onbkind").count() == 4
