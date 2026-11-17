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
    assert page.inner_text("#rv-height") == "180"
    # Vikt och BMI finns på sidan Vikt; här bara en länk dit
    assert page.locator("[data-rul=weight], .bmicard").count() == 0 and page.locator('.vlink[data-tab="vagning"]').count() == 1
    drag(page, "height", 2)
    page.wait_for_function("S.profile.height === 182")
    assert page.evaluate("S.profileSet") is True and page.locator(".vnote").count() == 0
    page.click("[data-vreset]")
    assert page.evaluate("[S.profile.height, S.profileSet]") == [180, False]


def test_weight_page_ruler_saves_only_on_button(page):
    open_varden(page)
    page.click('.vlink[data-tab="vagning"]')
    drag(page, "wlog", -1.5)
    page.wait_for_function("wDraft === 78.5")
    assert page.inner_text("#bmi-num") == "24,2" and page.evaluate("S.weights[TODAY]") is None
    page.click("[data-wsave]")
    assert page.evaluate("[S.weights[TODAY], S.profile.weight]") == [78.5, 78.5]
    assert page.inner_text(".backbtn").strip() == "Dina värden"


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


def test_target_weight_and_charts(page):
    start(page)
    page.evaluate("""S.tourAsked = true; for (const k of [28, 21, 14, 7, 0]) weights()[shift(TODAY, -k)] = 84 - (28 - k) / 14;
      S.profile.weight = latestWeight().kg; S.profile.goal = 'cut'; save(); tab = 'profil'; render()""")
    page.click("#p-vikt [data-tab='vagning']")
    # Målvikten sätts på sidan Vikt och syns som streckad linje
    assert page.locator(".ch-goal").count() == 0
    page.click('[data-wtarget="set"]')
    assert page.evaluate("S.profile.targetWeight") == 77
    page.click('[data-wtarget="0.5"]')
    assert page.evaluate("S.profile.targetWeight") == 77.5
    assert page.locator(".ch-goal").count() == 1 and "kvar till 77,5 kg" in page.inner_text(".vk-hero")
    # Perioden byts, och ett tryck i grafen visar en vägning
    page.click('[data-wrange="28"]')
    assert page.evaluate("wRange") == 28
    box = page.locator("svg[data-chpts]").bounding_box()
    page.mouse.click(box["x"] + box["width"] * 0.3, box["y"] + 50)
    assert "kg" in page.text_content(".ch-tipt")
    page.click('[data-wtarget="clear"]')
    assert page.evaluate("S.profile.targetWeight") is None
