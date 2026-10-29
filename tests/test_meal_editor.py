"""En måltid redigeras på en sida; Klar återgår till översikten."""
import datetime
import pytest
from conftest import start, go
from test_design import CONTRAST


def meals(page):
    page.clock.install(time=datetime.datetime(2026,10,29,12,0))
    start(page)
    page.evaluate("""() => {
        day().food=[{name:'Pyttipanna',kcal:560,protein:24,meal:1}];
        S.log[shift(TODAY,-1)]={workouts:[],dailies:{},food:[{name:'Gårdagens lunch',kcal:400,protein:20,meal:1}]};
        save();
    }""")
    go(page,'kost')


@pytest.mark.parametrize('entry',['mealpage','addto'])
def test_meal_and_plus_open_same_editor_with_search_and_delete(page,entry):
    meals(page)
    page.click(f'[data-{entry}="1"]')
    assert page.locator('.mealpage #fname').count()==1
    assert page.locator('.mealpage .kitems [data-mdel]').count()==1
    assert 'Pyttipanna' in page.inner_text('.kitems')
    assert page.locator('.pagefoot [data-addto]').count()==0


def test_add_and_remove_stay_on_meal_then_done_opens_overview(page):
    meals(page)
    page.click('[data-mealpage="1"]')
    page.fill('#fname','1 banan')
    page.click('#faddbtn')
    assert page.locator('#fname').count()==1
    assert page.input_value('#fname')==''
    assert page.locator('.kitems .kirow').count()==2
    page.locator('.kirow',has_text='Pyttipanna').locator('[data-mdel]').click()
    assert page.locator('.kitems .kirow').count()==1
    assert 'Banan' in page.inner_text('.kitems')
    page.click('#faddbtn')
    assert page.locator('.kdnav').count()==1 and page.locator('#fname').count()==0
    assert page.evaluate('mealPage===null && foodSheet===null')
    assert page.evaluate('eaten().kcal')==108


@pytest.mark.parametrize('theme',['light','dark'])
def test_added_food_highlight_does_not_cover_meal_summary(page,theme):
    meals(page)
    page.evaluate('setTheme',theme)
    page.click('[data-mealpage="1"]')
    page.fill('#fname','1 banan')
    page.click('#faddbtn')
    # Freeze the actual confirmation animation while it is visible.
    page.locator('.current-meal').evaluate('''el => {
        for (const a of el.getAnimations({subtree:true})) {
            a.pause(); a.currentTime=200;
        }
    }''')
    summary=page.locator('.current-meal').evaluate('''el => {
        const s=getComputedStyle(el);
        return {background:s.backgroundColor, shadow:s.boxShadow};
    }''')
    assert summary=={'background':'rgba(0, 0, 0, 0)','shadow':'none'}
    banana=page.locator('.kirow',has_text='Banan')
    assert banana.evaluate('el=>getComputedStyle(el).boxShadow')!='none'
    assert page.locator('.kirow',has_text='Pyttipanna').evaluate(
        'el=>getComputedStyle(el).boxShadow')=='none'
    assert page.locator('.kitems .kirow').count()==2


def test_done_keeps_selected_historical_date_and_other_days_unchanged(page):
    meals(page)
    date=page.evaluate('shift(TODAY,-1)')
    page.click(f'[data-kday="{date}"]')
    page.click('[data-mealpage="1"]')
    page.fill('#fname','1 banan');page.click('#faddbtn')
    page.locator('.kirow',has_text='Gårdagens lunch').locator('[data-mdel]').click()
    page.click('#faddbtn')
    assert page.locator('.kdnav').count()==1
    assert page.evaluate('logDate()')==date
    assert page.evaluate('eaten().kcal')==108
    assert page.evaluate('eaten(TODAY).kcal')==560


def test_banner_done_returns_to_today_overview(page):
    meals(page)
    date=page.evaluate('shift(TODAY,-1)')
    page.click(f'[data-kday="{date}"]')
    page.click('[data-mealpage="1"]')
    page.click('.editbar [data-editdone]')
    assert page.locator('.kdnav').count()==1
    assert page.evaluate('logDate()===TODAY && foodSheet===null && mealPage===null')


@pytest.mark.parametrize('theme',['light','dark'])
@pytest.mark.parametrize('width',[320,390])
def test_meal_editor_layout_and_contrast(page,theme,width):
    page.set_viewport_size({'width':width,'height':844})
    meals(page);page.click('[data-addto="1"]');page.evaluate('setTheme',theme)
    assert page.locator('#app').evaluate(CONTRAST)==[]
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')
    page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
    done=page.locator('#faddbtn').bounding_box();nav=page.locator('#nav').bounding_box()
    assert done['y']+done['height']<=nav['y']


def test_meal_done_stays_above_rest_timer_during_workout(page):
    meals(page)
    page.click('#nav [data-tab="pass"]');page.click('[data-focusstart]')
    page.click('.fbar .fdone')
    page.click('#nav [data-tab="kost"]');page.click('[data-mealpage="1"]')
    page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
    done=page.locator('#faddbtn').bounding_box();timer=page.locator('.rest').bounding_box()
    assert done['y']+done['height']<=timer['y']
    page.click('#faddbtn')
    assert page.locator('.kdnav').count()==1
    assert page.evaluate('focus!==null')


def test_history_food_entry_opens_overview_without_previous_meal_or_search(page):
    meals(page)
    date=page.evaluate('shift(TODAY,-1)')
    # Kost's date picker was used first; History must still keep its own return destination.
    page.click(f'[data-kday="{date}"]')
    page.click('#nav [data-tab="historik"]')
    page.click(f'[data-histday="{date}"]');page.click('[data-hfood]')
    assert page.locator('.kdnav').count()==1
    page.click('[data-mealpage="1"]');page.fill('#fname','1 banan')
    page.click('.editbar [data-editdone]')
    assert page.evaluate('tab')=='historik'
    page.click('[data-hfood]')
    assert page.locator('.kdnav').count()==1 and page.locator('#fname').count()==0
    assert page.evaluate('logDate()')==date
    assert page.evaluate('eaten().kcal')==400
