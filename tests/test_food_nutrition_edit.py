"""Egna näringsvärden ska ändra vald produkt, utan dubbla sökträffar."""
import pytest
from conftest import start, go
from test_design import CONTRAST


def editor(page):
    start(page)
    go(page,'kost')
    page.click('[data-addto="3"]')


def test_manual_food_has_no_conflicting_search_result(page):
    editor(page)
    page.fill('#fname','Morot')
    page.click('[data-fpanel="kcal"]')
    page.fill('#fkcal','200')
    page.fill('#fprot','10')
    page.fill('#ffat','3.5');page.fill('#ffiber','2')
    assert page.locator('#fpreview').inner_text()==''
    assert page.locator('#productresults').inner_text()==''
    assert page.locator('#fname').get_attribute('aria-label')=='Namn på maten'
    assert 'Egen mat' in page.inner_text('.manual')
    page.click('#faddbtn')
    assert page.evaluate('day().food.map(f=>[f.name,f.kcal,f.protein,f.fat,f.fiber])')==[['Morot',200,10,3.5,2]]


def test_manual_name_never_reuses_learned_values_and_accepts_zero(page):
    editor(page)
    page.evaluate("S.learned={morot:{kcal:28,protein:1}}")
    page.fill('#fname','Morot');page.click('[data-fpanel="kcal"]')
    assert '28 kcal' not in page.inner_text('#faddbtn')
    page.fill('#fkcal','-200')
    assert page.locator('#faddbtn').is_disabled()
    page.fill('#fkcal','0');page.fill('#fprot','0')
    assert page.locator('#faddbtn').is_enabled()
    page.click('#faddbtn')
    assert page.evaluate('day().food.map(f=>[f.name,f.kcal,f.protein])')==[['Morot',0,0]]


def test_edit_selected_food_nutrition_then_scale_and_log(page):
    editor(page)
    page.fill('#fname','1 morot')
    page.locator('[data-dnutrition="0"] summary').click()
    page.fill('[data-dnutrition="0"] [data-nutrient="k"]','200')
    page.fill('[data-dnutrition="0"] [data-nutrient="p"]','10')
    page.fill('[data-dnutrition="0"] [data-nutrient="fa"]','3.5')
    page.fill('[data-dnutrition="0"] [data-nutrient="fi"]','2')
    assert '200 kcal' in page.inner_text('.dk')
    page.locator('[data-drow="0"] [data-astep="1"]').click()
    assert '400 kcal' in page.inner_text('.dk')
    page.click('#faddbtn')
    assert page.evaluate('day().food.map(f=>[f.name,f.kcal,f.protein,f.fat,f.fiber])')==[['Morot',400,20,7,4]]


def test_invalid_nutrition_cannot_log_old_values_but_zero_is_valid(page):
    editor(page);page.fill('#fname','1 morot')
    page.locator('.nutrition-edit summary').click()
    page.fill('[data-nutrient="k"]','-1')
    assert page.locator('#faddbtn').is_disabled()
    page.fill('[data-nutrient="k"]','')
    assert page.locator('#faddbtn').is_disabled()
    page.fill('[data-nutrient="k"]','0')
    page.fill('[data-nutrient="p"]','0')
    assert page.locator('#faddbtn').is_enabled()
    page.click('#faddbtn')
    assert page.evaluate('day().food.map(f=>f.kcal)')==[0]


def test_custom_nutrition_survives_search_refresh_without_changing_catalog(page):
    editor(page);page.fill('#fname','1 morot')
    original=page.evaluate('foodDraft[0].amt.k')
    page.locator('.nutrition-edit summary').click()
    page.fill('[data-nutrient="k"]','200')
    page.evaluate('foodPreview()')
    assert '200 kcal' in page.inner_text('.dk')
    page.fill('#fname','2 morötter')
    assert page.evaluate('foodDraft[0].amt.k')==original


@pytest.mark.parametrize('theme',['light','dark'])
@pytest.mark.parametrize('width',[320,390])
def test_nutrition_fields_fit_mobile_and_have_contrast(page,theme,width):
    page.set_viewport_size({'width':width,'height':844})
    editor(page);page.evaluate('setTheme',theme);page.fill('#fname','1 morot')
    page.locator('.nutrition-edit summary').click()
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')
    assert page.locator('#app').evaluate(CONTRAST)==[]


def test_edit_logged_product_updates_same_entry_and_survives_reload(page):
    editor(page)
    page.fill('#fname','1 morot');page.click('#faddbtn')
    page.click('[data-fooditem="0"]')
    page.locator('.nutrition-edit summary').click()
    for key,value in [('k','200'),('p','10'),('fa','3.5'),('fi','2')]:
        page.fill(f'[data-nutrient="{key}"]',value)
    page.click('[data-savenutrition]')
    assert page.evaluate('day().food.length')==1
    assert page.evaluate('eaten().kcal')==200
    page.click('[data-astep="1"]')
    assert page.evaluate('eaten().kcal')==400
    page.reload()
    assert page.evaluate('day().food.map(f=>[f.name,f.kcal,f.protein,f.fat,f.fiber])')==[['Morot',400,20,7,4]]


def test_logged_portion_keeps_fiber_when_fat_is_unknown(page):
    editor(page)
    page.evaluate("day().food=[{name:'Min portion',kcal:200,protein:10,qty:2,per:{kcal:100,protein:5},meal:3}];render()")
    page.click('[data-fooditem="0"]');page.locator('.nutrition-edit summary').click()
    page.fill('[data-nutrient="fi"]','5');page.click('[data-savenutrition]')
    page.click('[data-qty="1"]');page.click('[data-qty="1"]')
    assert page.evaluate('day().food[0].fiber')==10
    assert page.evaluate('day().food[0].fat ?? null') is None
