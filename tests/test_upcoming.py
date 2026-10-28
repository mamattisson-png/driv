"""Gemensam lista över kommande funktioner, åtkomlig även utan konto."""
import pytest

from conftest import start, go
from test_design import CONTRAST


def open_upcoming(page):
    start(page)
    go(page, 'profil')
    page.click('[data-tab="kommande"]')


def test_upcoming_opens_own_page_without_account_and_returns_to_settings(page):
    start(page)
    go(page, 'profil')
    button = page.locator('[data-tab="kommande"]')
    assert button.count() == 1
    button.click()
    assert page.evaluate('tab') == 'kommande'
    assert page.inner_text('h1') == 'Kommande funktioner'
    assert page.evaluate('scrollY') == 0
    panel = page.locator('.upcoming-page .upcoming-list')
    assert 'Stretch guiden' in panel.inner_text()
    assert 'Planerat' in panel.inner_text()
    assert 'dailys' in panel.inner_text() and 'träningspass' in panel.inner_text()
    assert panel.locator('input, textarea, select, button').count() == 0
    page.click('.upcoming-page .backbtn')
    assert page.evaluate('tab') == 'profil'
    assert page.inner_text('h1') == 'Inställningar'
    assert page.locator('[data-tab="kommande"]').count() == 1


def test_upcoming_is_shared_content_independent_of_training_plan(page):
    open_upcoming(page)
    before = page.inner_text('.upcoming-page .upcoming-list')
    page.evaluate("S.plan.days[0].name = 'Mitt egna pass'; S.name = 'Anna'; render()")
    assert page.inner_text('.upcoming-page .upcoming-list') == before
    page.reload()
    go(page, 'profil')
    page.click('[data-tab="kommande"]')
    assert page.inner_text('.upcoming-page .upcoming-list') == before


@pytest.mark.parametrize('theme', ['light', 'dark'])
@pytest.mark.parametrize('width', [320, 390])
def test_upcoming_fits_mobile_and_has_readable_contrast(page, theme, width):
    page.set_viewport_size({'width': width, 'height': 844})
    open_upcoming(page)
    page.evaluate('setTheme', theme)
    panel = page.locator('.upcoming-page')
    assert panel.evaluate('e => e.scrollWidth <= e.clientWidth')
    assert page.locator('body').evaluate('e => e.scrollWidth <= innerWidth')
    assert panel.evaluate(CONTRAST) == []


def test_long_upcoming_list_can_be_scrolled_above_bottom_navigation(page):
    open_upcoming(page)
    page.evaluate("""() => {
        for (let i=0; i<20; i++) UPCOMING_FEATURES.push({title:'Kommande punkt '+i,status:'planned',description:'En längre beskrivning. '.repeat(20)});
        render();
        window.scrollTo(0, document.documentElement.scrollHeight);
    }""")
    last = page.locator('.upcoming-list li').last.bounding_box()
    nav = page.locator('#nav').bounding_box()
    assert last['y'] >= 0
    assert last['y'] + last['height'] <= nav['y']


def test_upcoming_back_preserves_settings_origin(page):
    start(page)
    go(page, 'kost')
    go(page, 'profil')
    page.click('[data-tab="kommande"]')
    page.click('.upcoming-page .backbtn')
    page.click('#app > .backbtn')
    assert page.evaluate('tab') == 'kost'
