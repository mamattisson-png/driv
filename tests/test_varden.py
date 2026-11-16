"""Dina värden: linjaler för ålder, längd och vikt, BMI, standardvärden, och förbränning efter profilen."""
from conftest import start  # noqa


def drag(page, f, units):
    page.evaluate("""([f, n]) => { const el = document.querySelector(`[data-rul=${f}]`);
      el.scrollLeft += n * RULERS[f].px; el.dispatchEvent(new Event('scroll')); }""", [f, units])


def open_varden(page):
    start(page)
    page.evaluate("S.tourAsked = true; S.profileSet = false; save(); tab = 'profil'; render()")
    page.click("[data-tab='varden']")


def test_standard_values_and_ruler(page):
    open_varden(page)
    assert page.locator(".vnote").count() == 1
    assert page.inner_text("#rv-weight") == "80"
    # Dra vikten 2 kg åt höger: värdet och BMI följer med och sparas
    drag(page, "weight", 2)
    page.wait_for_function("S.profile.weight === 82")
    assert page.evaluate("S.profileSet") is True
    assert page.inner_text("#bmi-num") == "25,3" and page.inner_text("#bmi-tag") == "Övervikt"
    assert page.locator(".vnote").count() == 0
    page.click("[data-vreset]")
    assert page.evaluate("[S.profile.weight, S.profileSet]") == [80, False]


def test_burn_follows_profile(page):
    open_varden(page)
    walk = page.evaluate("actKcal({name: 'Promenad', min: 30, int: 2})")
    page.click("[data-vsex=f]")
    drag(page, "age", 30)
    page.wait_for_function("S.profile.age === 60")
    assert page.evaluate("actKcal({name: 'Promenad', min: 30, int: 2})") < walk
    page.click("[data-vact='1.2']")
    assert page.evaluate("S.profile.activity") == 1.2


def test_show_more_keeps_scroll(page):
    """Visa fler i Övningar ska visa fler under, inte hoppa upp till toppen."""
    start(page)
    page.evaluate("S.tourAsked = true; save(); tab = 'pass'; render()")
    page.click("[data-exlib]")
    page.locator("[data-mskmore]").scroll_into_view_if_needed()
    y = page.evaluate("scrollY")
    assert y > 500
    page.click("[data-mskmore]")
    assert abs(page.evaluate("scrollY") - y) < 5
