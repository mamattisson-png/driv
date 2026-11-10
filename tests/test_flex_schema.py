"""Träningsschemat med aktiviteter: yoga, löpning m.m. i samma schema som gympassen."""
import datetime

from conftest import start, go


def open_schema(page):
    page.clock.install(time=datetime.datetime(2026, 11, 10, 12, 0))
    start(page)
    page.evaluate("S.tourAsked = true; setupFrom = 'pass'; tab = 'upplagg'; render()")


def add_activity(page, name, km=None):
    page.click("[data-planadd]")
    page.click(f"[data-actpick='{name}']")
    if km:
        page.fill("#actkm", str(km))
    page.click("[data-actsave]")


def test_add_activities_keeps_gym_passes(page):
    open_schema(page)
    add_activity(page, "Yoga")
    add_activity(page, "Löpning", 5)
    page.click("[data-savesetup]")
    plan = page.evaluate("S.plan.days.map(d => [d.name, d.type, !!d.extra])")
    assert [p[0] for p in plan] == ["Push", "Pull", "Legs", "Yoga", "Löpning"]
    assert plan[3][1] == "act" and plan[3][2]
    assert page.evaluate("S.plan.count") == 5
    assert page.evaluate("S.plan.days[4].act.km") == 5
    assert page.evaluate("S.plan.days[0].ex.length") > 0
    # Fler gympass: aktiviteterna ligger kvar
    page.evaluate("draft = null; tab = 'upplagg'; render()")
    page.click("[data-count='4']")
    assert page.evaluate("draft.days.map(d => d.name)") == ["Push", "Pull", "Legs", "Yoga", "Löpning", "Överkropp"]


def test_fixed_days_activity_gets_its_weekday(page):
    open_schema(page)
    page.evaluate("ensureDraft().mode = 'fixed'; draft.weekdays = [0, 2, 4]; render()")
    page.click("[data-planadd]")
    page.click("[data-actpick='Yoga']")
    page.click("[data-planwd='1']")
    page.click("[data-actsave]")
    assert page.evaluate("draft.days.map(d => d.name)") == ["Push", "Yoga", "Pull", "Legs"]
    assert page.evaluate("draft.weekdays") == [0, 1, 2, 4]


def test_activity_done_counts_as_pass(page):
    open_schema(page)
    add_activity(page, "Yoga")
    page.click("[data-savesetup]")
    page.evaluate("trSel = S.plan.days[3].id; tab = 'pass'; render()")
    assert page.locator(".actpass").count() == 1
    page.click(".actpass [data-actdaydone]")
    page.click("[data-actsave]")
    w = page.evaluate("workoutOn(TODAY, S.plan.days[3].id)")
    assert w["done"] and w["act"]["name"] == "Yoga" and w["act"]["min"] == 30
    assert page.evaluate("weekSummary(weekStart(TODAY)).passes") == 1
    go(page, "idag")
    assert "Aktivitet" in page.text_content(".h3-passcard")
    page.evaluate("histDay = TODAY; tab = 'historik'; render()")
    assert "Från schemat" in page.text_content(".hsheet")


def test_timer_sets_minutes(page):
    open_schema(page)
    add_activity(page, "Promenad")
    page.click("[data-savesetup]")
    page.evaluate("trSel = S.plan.days[3].id; tab = 'pass'; render()")
    page.click("[data-actstart]")
    page.clock.fast_forward(20 * 60 * 1000)
    page.click("[data-actstop]")
    assert page.evaluate("actSheet.min") == 20


def test_only_activities_program(page):
    open_schema(page)
    page.click("[data-progtoggle]")
    page.click("[data-prog=aktiviteter]")
    page.click("[data-savesetup]")
    assert all(page.evaluate("S.plan.days.map(d => d.type === 'act')"))
    go(page, "pass")
    assert page.locator(".actpass").count() == 1
    assert page.locator("[data-focusstart]").count() == 0
