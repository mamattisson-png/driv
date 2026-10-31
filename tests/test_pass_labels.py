"""Passens etiketter skiljer turordning från schemalagda och genomförda dagar."""
import datetime

from conftest import start, go


def prepare(page, mode="flex", log=""):
    page.clock.install(time=datetime.datetime(2026, 10, 29, 12, 0))
    start(page)
    page.evaluate("""({mode, log}) => {
        S.plan.mode = mode; S.plan.weekdays = [0, 2, 4]; S.log = {};
        if (log) eval(log);
        tab = 'pass'; render();
    }""", {"mode": mode, "log": log})


def test_flexible_pass_is_next_not_today_on_both_screens(page):
    prepare(page)
    assert page.text_content('.daypass .klabel') == 'Nästa pass'
    assert page.locator('.wkcard .pst').first.inner_text().strip() == 'På tur'
    go(page, 'idag')
    assert page.text_content('.passtile .klabel') == 'Nästa pass'
    assert page.get_attribute('.passtile', 'aria-label').startswith('Nästa pass:')


def test_fixed_days_show_weekdays_and_today_only_for_today(page):
    prepare(page, 'fixed')
    assert page.locator('.wkcard .pst').all_text_contents() == ['Måndag', 'Onsdag', 'Fredag']
    page.evaluate("S.plan.weekdays = [0, 3, 4]; render()")
    assert page.locator('.wkcard .pst').all_text_contents() == ['Måndag', 'Idag', 'Fredag']
    assert page.text_content('.daypass .klabel') == 'Dagens pass'


def test_completed_pass_uses_actual_latest_day_not_planned_day(page):
    prepare(page, 'fixed', """
        for (const date of ['2026-10-27', '2026-10-28'])
            S.log[date] = {workouts:[{dayId:S.plan.days[0].id,done:true,sets:{}}],food:[],dailies:{}};
    """)
    assert page.locator('.wkcard .pst').first.inner_text() == 'Klar · ons'


def test_completed_today_is_labelled_on_both_screens(page):
    prepare(page, log="S.log[TODAY] = {workouts:[{dayId:S.plan.days[0].id,done:true,sets:{}}],food:[],dailies:{}}")
    assert page.locator('.wkcard .pst').first.inner_text() == 'Klar idag'
    assert page.text_content('.daypass .klabel') == 'Genomfört idag'
    assert page.inner_text('.daypass .passok') == 'Genomfört idag'
    go(page, 'idag')
    assert page.text_content('.passtile .klabel') == 'Genomfört idag'
    assert page.inner_text('.passtile .muted.small .oktext') == 'Genomfört idag'


def test_started_pass_is_ongoing_not_just_next(page):
    prepare(page, log="S.log[TODAY] = {workouts:[{dayId:S.plan.days[0].id,done:false,sets:{bankpress:[{ok:true,kg:20,reps:8}]}}],food:[],dailies:{}}")
    assert page.text_content('.daypass .klabel') == 'Pågående pass'
    assert page.locator('.wkcard .pst').first.inner_text() == 'Pågående'
    go(page, 'idag')
    assert page.text_content('.passtile .klabel') == 'Pågående pass'


def test_fixed_today_label_survives_another_pass_completed_today(page):
    prepare(page, 'fixed', "S.log[TODAY] = {workouts:[{dayId:S.plan.days[0].id,done:true,sets:{}}],food:[],dailies:{}}")
    page.evaluate("S.plan.weekdays = [0, 3, 4]; render()")
    assert page.locator('.wkcard .pst').all_text_contents() == ['Klar idag', 'Idag', 'Fredag']


def test_completed_label_fits_small_mobile_tiles(page):
    prepare(page, 'fixed', "S.log['2026-10-28'] = {workouts:[{dayId:S.plan.days[0].id,done:true,sets:{}}],food:[],dailies:{}}")
    page.set_viewport_size({'width': 320, 'height': 740})
    assert page.locator('.wkcard').evaluate_all('els => els.every(e => e.scrollWidth <= e.clientWidth)')
