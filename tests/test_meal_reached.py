import datetime
import pytest
from conftest import start,go
from test_design import CONTRAST


def prepare(page,kcal):
    page.clock.install(time=datetime.datetime(2026,10,29,12,0))
    start(page)
    page.evaluate('''kcal=>{
      S.kcalOverride=2300;
      day().food=[{name:'Frukostmat',kcal,protein:20,fat:10,fiber:5,meal:0}];
      save();
    }''',kcal)
    go(page,'kost')


@pytest.mark.parametrize('kcal,reached',[(579,False),(580,True),(581,True)])
def test_meal_uses_its_own_target_in_overview_and_selector(page,kcal,reached):
    prepare(page,kcal)
    card=page.locator('.kmrow').filter(has=page.locator('[data-mealpage="0"]'))
    assert card.evaluate('e=>e.classList.contains("meal-reached")')==reached
    assert page.locator('.kmrow.meal-reached').count()==int(reached)
    page.click('[data-mealpage="1"]')
    tab=page.locator('[data-sheetmeal="0"]')
    assert tab.evaluate('e=>e.classList.contains("meal-reached")')==reached
    if reached:
        assert 'riktmärket uppnått' in tab.get_attribute('aria-label')
    assert not page.locator('#faddbtn').evaluate('e=>e.classList.contains("meal-reached")')
    assert page.evaluate('eaten().kcal<macros().kcal')


def test_mark_updates_after_add_delete_and_day_change(page):
    prepare(page,579);page.click('[data-mealpage="0"]')
    page.click('[data-fpanel="kcal"]');page.fill('#fname','Tillägg');page.fill('#fkcal','1');page.click('#faddbtn')
    assert page.locator('[data-sheetmeal="0"].meal-reached').count()==1
    page.click('#faddbtn')
    assert page.locator('.kmrow.meal-reached').count()==1
    yesterday=page.evaluate('shift(TODAY,-1)')
    page.click(f'[data-kday="{yesterday}"]')
    assert page.locator('.kmrow.meal-reached').count()==0
    today=page.evaluate('TODAY');page.click(f'[data-kday="{today}"]')
    assert page.locator('.kmrow.meal-reached').count()==1
    page.click('[data-mealpage="0"]');page.locator('.kirow',has_text='Tillägg').locator('[data-mdel]').click()
    assert page.locator('[data-sheetmeal="0"].meal-reached').count()==0
    page.click('#faddbtn')
    assert page.locator('.kmrow.meal-reached').count()==0


@pytest.mark.parametrize('theme',['light','dark'])
@pytest.mark.parametrize('width',[320,390])
def test_reached_meal_layout_contrast_and_selected_state(page,theme,width):
    page.set_viewport_size({'width':width,'height':844})
    prepare(page,580);page.evaluate('setTheme',theme)
    assert page.locator('#app').evaluate(CONTRAST)==[]
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')
    page.click('[data-mealpage="0"]')
    button=page.locator('[data-sheetmeal="0"]')
    assert button.get_attribute('aria-checked')=='true'
    assert button.locator('svg').count()==1
    assert page.locator('#app').evaluate(CONTRAST)==[]
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')
