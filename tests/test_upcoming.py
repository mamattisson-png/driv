"""Gemensam lista över kommande funktioner, åtkomlig även utan konto."""
import pytest

from conftest import start, go
from test_design import CONTRAST


def open_upcoming(page):
    start(page)
    go(page, 'profil')
    page.click('[data-psec="kommande"]')


def test_upcoming_is_available_without_account_and_can_be_closed(page):
    start(page)
    go(page, 'profil')
    button = page.locator('[data-psec="kommande"]')
    assert button.count() == 1
    assert button.get_attribute('aria-expanded') == 'false'
    button.click()
    assert button.get_attribute('aria-expanded') == 'true'
    panel = page.locator('#p-kommande .prow-body')
    assert 'Stretch guiden' in panel.inner_text()
    assert 'Planerat' in panel.inner_text()
    assert 'dailys' in panel.inner_text() and 'träningspass' in panel.inner_text()
    assert panel.locator('input, textarea, select, button').count() == 0
    button.click()
    assert panel.count() == 0


def test_upcoming_is_shared_content_independent_of_training_plan(page):
    open_upcoming(page)
    before = page.inner_text('#p-kommande .prow-body')
    page.evaluate("S.plan.days[0].name = 'Mitt egna pass'; S.name = 'Anna'; render()")
    assert page.inner_text('#p-kommande .prow-body') == before
    page.reload()
    go(page, 'profil')
    page.click('[data-psec="kommande"]')
    assert page.inner_text('#p-kommande .prow-body') == before


@pytest.mark.parametrize('theme', ['light', 'dark'])
@pytest.mark.parametrize('width', [320, 390])
def test_upcoming_fits_mobile_and_has_readable_contrast(page, theme, width):
    page.set_viewport_size({'width': width, 'height': 844})
    open_upcoming(page)
    page.evaluate('setTheme', theme)
    panel = page.locator('#p-kommande')
    assert panel.evaluate('e => e.scrollWidth <= e.clientWidth')
    assert page.locator('body').evaluate('e => e.scrollWidth <= innerWidth')
    assert panel.evaluate(CONTRAST) == []
