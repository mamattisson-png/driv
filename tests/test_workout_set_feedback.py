"""A completed set gives inline feedback and identifies the actual next set."""
import pytest
from test_workout_number_inputs import workout


def test_registration_identifies_next_set_and_expires_without_rerender(page):
    workout(page)
    page.click('.fbar .fdone')
    notice=page.locator('.set-feedback')
    assert 'Set 1 registrerat' in notice.inner_text()
    assert 'Set 2 av 2' in notice.inner_text()
    assert page.locator('.fset.active.set-arrival').count()==1
    page.locator('.fset.active input[data-f="kg"]').fill('27.5')
    page.clock.run_for(2000)
    assert page.locator('.fset.active input[data-f="kg"]').input_value()=='27.5'
    assert page.locator('.fset.active input[data-f="kg"]').evaluate('e=>e===document.activeElement')
    assert not notice.is_visible()


def test_last_set_feedback_names_next_exercise(page):
    workout(page)
    page.click('.fbar .fdone');page.click('.fbar .fdone')
    assert 'Bicepscurl' in page.inner_text('.set-feedback')
    assert 'Set 1 av 2' in page.inner_text('.set-feedback')


def test_superset_feedback_tracks_destination_and_stale_timeout(page):
    workout(page)
    page.evaluate('dayById(focus.dayId).ex[0].ss=true;render()')
    page.click('.fbar .fdone')
    assert 'Bicepscurl' in page.inner_text('.set-feedback')
    page.clock.run_for(1000)
    page.click('.fbar .fdone')
    assert 'Bänkpress' in page.inner_text('.set-feedback')
    assert 'Set 2 av 2' in page.inner_text('.set-feedback')
    page.clock.run_for(900)
    assert page.locator('.set-feedback').is_visible()


def test_warmup_and_final_set_feedback(page):
    workout(page)
    page.evaluate("dayById(focus.dayId).ex=[{id:'bankpress',sets:1,warm:1,reps:'8'}];focus.sel=null;render()")
    page.click('.fbar .fdone')
    assert 'Uppvärmning 1 registrerad' in page.inner_text('.set-feedback')
    assert 'Set 1 av 1' in page.inner_text('.set-feedback')
    page.click('.fbar .fdone')
    assert 'Alla set klara' in page.inner_text('.set-feedback')


def test_feedback_clears_on_manual_exercise_switch(page):
    workout(page);page.click('.fbar .fdone')
    page.click('[data-focusgo="1"]')
    assert not page.locator('.set-feedback').is_visible()


@pytest.mark.parametrize('reduce',[True,False])
def test_motion_preference_and_polite_status(page,reduce):
    page.emulate_media(reduced_motion='reduce' if reduce else 'no-preference')
    workout(page);page.click('.fbar .fdone')
    assert page.locator('.set-feedback').get_attribute('role')=='status'
    animation=page.locator('.fset.active').evaluate('e=>getComputedStyle(e).animationName')
    assert (animation=='none')==reduce
