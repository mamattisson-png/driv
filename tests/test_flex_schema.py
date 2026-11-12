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
    assert "Motion" in page.text_content(".h3-passcard")
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


def test_onboarding_gym_motion_both(page):
    from conftest import open_app
    open_app(page)
    page.evaluate("onb = 1; tab = 'upplagg'; render()")
    assert page.locator(".onbkind").count() == 4
    page.click('[data-onbkind="motion"]')
    assert page.locator("[data-prog]").count() == 0
    assert all(page.evaluate("draft.days.map(d => d.type === 'act')"))
    page.click('[data-onbkind="both"]')
    assert page.evaluate("draft.days.map(d => d.name)") == ["Push", "Pull", "Legs", "Promenad", "Yoga"]
    assert page.locator('[data-prog="aktiviteter"]').count() == 0
    page.click('[data-onbkind="gym"]')
    assert page.evaluate("draft.days.map(d => d.name)") == ["Push", "Pull", "Legs"]


def test_no_schedule_logs_freely(page):
    from conftest import open_app, go
    open_app(page)
    page.evaluate("onb = 1; tab = 'upplagg'; render()")
    page.click('[data-onbkind="free"]')
    page.click('[data-onb="2"]')
    page.click('[data-count="4"]')
    page.click('[data-onb="3"]')
    page.click('[data-savesetup]')
    assert page.evaluate("[S.plan.free, S.plan.count]") == [True, 4]
    page.evaluate("S.tourAsked = true; save(); render()")
    page.click(".h3-passcard [data-freegym]")
    page.locator("[data-libpick]").first.click()
    assert page.evaluate("focus && focus.dayId") == "fritt"
    page.evaluate("const w = workoutFor(freeDay()); w.done = true; w.end = Date.now(); endFocus(); day().acts = [{name: 'EMS', min: 20, int: 2}]; chosenDay = null; tab = 'idag'; save(); render()")
    # Allt räknas mot målet, även kort motion
    assert page.evaluate("weekSummary(weekStart(TODAY)).passes") == 2
    go(page, "pass")
    assert page.locator("[data-freegym]").count() == 1 and "Fritt pass" in page.inner_text("main")
    # Tillbaka till ett schema: passen finns kvar
    page.evaluate("draft = null; setupFrom = 'pass'; tab = 'upplagg'; render()")
    assert page.inner_text(".freegoal .unum") == "4"
    page.click('[data-onbkind="gym"]')
    page.click('[data-savesetup]')
    assert page.evaluate("[!!S.plan.free, S.plan.days.map(d => d.name).join()]") == [False, "Push,Pull,Legs"]


def test_free_pass_not_done_until_finished(page):
    from conftest import start, go
    start(page)
    page.evaluate("S.tourAsked = true; S.plan.free = true; S.plan.count = 3; save(); tab = 'pass'; render()")
    page.click("[data-freegym]")
    page.locator("[data-libpick]").first.click()
    d = page.evaluate("freeDay().ex[0].id")
    page.evaluate(f"const w = workoutFor(freeDay()); w.sets['{d}'] = [1,2,3,4,5].map(() => ({{kg: 20, reps: 8, ok: true}})); syncDone(freeDay()); render()")
    # Alla set gjorda men passet är inte klart: nästa övning eller avsluta
    assert page.evaluate("workoutOn(TODAY, 'fritt').done") is False
    assert page.locator(".fbar [data-faddex]").count() == 1
    page.click(".fbar [data-finish]")
    assert page.evaluate("workoutOn(TODAY, 'fritt').done") is True
    page.evaluate("passDone = null; tab = 'pass'; render()")
    # Raden heter efter övningen och öppnar dagen ovanpå Träna
    assert page.evaluate(f"EX['{d}'].name") in page.inner_text("main")
    page.click("[data-freeday]")
    assert page.evaluate("tab") == "pass" and page.locator(".hsheet").count() == 1


def test_free_pass_resume_goes_straight_to_focus(page):
    from conftest import start, go
    start(page)
    page.evaluate("S.tourAsked = true; S.plan.free = true; S.plan.count = 3; save(); tab = 'pass'; render()")
    page.click("[data-freegym]")
    page.locator("[data-libpick]").first.click()
    page.evaluate("const w = workoutFor(freeDay()); w.sets[freeDay().ex[0].id] = [{kg: 20, reps: 8, ok: true}]; save()")
    go(page, "idag")
    # Hem: tryck på kortet tar en direkt in i passet, inte till en passida
    page.click(".h3-passcard .h3-head")
    assert page.evaluate("[tab, !!focus && !focus.suspended, passOpen]") == ["pass", True, False]
    # Historik: Ändra passet på dagens pågående fria pass fortsätter passet
    page.evaluate("focus.suspended = true; histDay = TODAY; tab = 'historik'; render()")
    page.click("[data-hpass='fritt']")
    assert page.evaluate("[tab, !!focus && !focus.suspended, passOpen]") == ["pass", True, False]
