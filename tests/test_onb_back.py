"""Tillbaka från första steget leder till välkomstsidan, även inloggad utan sparat schema."""
from conftest import open_app


def test_back_from_step_one_shows_welcome_when_logged_in(page):
    open_app(page)
    page.evaluate("account.step = 'in'; account.email = 'test@example.com'; onb = 0; tab = 'upplagg'; S.setupDone = false; render()")
    assert page.locator('[data-onb="0"]').count() == 1
    page.click('[data-onb="0"]')
    assert page.locator('.welcome').count() == 1
    page.click('[data-onb="1"]')
    assert page.locator('[data-onb="2"]').count() == 1
