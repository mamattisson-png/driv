"""Stretch under vilan: förslag för musklerna i övningen, appens egen gubbe, försvinner när vilan är slut."""
from conftest import start


def test_stretch_suggestion_during_rest(page):
    start(page)
    page.evaluate("S.tourAsked = true; save(); tab = 'pass'; startFocus(S.plan.days[0].id); render()")
    assert page.evaluate("stretchesFor('bankpress')[0]") == "brost_dorr"
    assert page.evaluate("stretchesFor('plankan').length >= 0")
    page.locator(".fbar-action button").first.click()
    assert page.locator(".vstretch").count() == 1
    assert page.locator(".vstretch svg").count() >= 1   # appens gubbe, ingen bild utifrån
    page.click(".vstretch")
    assert page.locator(".vssheet").count() == 1 and page.locator(".vsanim svg").count() >= 1
    first = page.inner_text(".vssheet .sheeth")
    page.click("[data-vsnext]")
    assert page.inner_text(".vssheet .sheeth") != first
    # Vilan slut: förslaget och bladet försvinner, set och loggar orörda
    sets = page.evaluate("JSON.stringify(workoutOn(TODAY, S.plan.days[0].id).sets)")
    page.evaluate("rest.end = Date.now() - 1")
    page.wait_for_timeout(700)
    assert page.locator(".vssheet").count() == 0 and page.locator(".vstretch").count() == 0
    assert page.evaluate("JSON.stringify(workoutOn(TODAY, S.plan.days[0].id).sets)") == sets


def test_stretch_can_be_turned_off(page):
    start(page)
    page.evaluate("S.tourAsked = true; S.restStretch = false; save(); tab = 'pass'; startFocus(S.plan.days[0].id); render()")
    page.locator(".fbar-action button").first.click()
    assert page.locator(".vstretch").count() == 0
