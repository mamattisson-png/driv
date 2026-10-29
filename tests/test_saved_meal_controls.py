"""Sparade snabbval kan hanteras utan att ändra matloggen."""
import pytest
from conftest import start, go
from test_design import CONTRAST


def meal(page, saved=False):
    start(page)
    page.evaluate('''saved => {
      day().food=[{name:'Ramen',kcal:495,protein:28,meal:3},{name:'Ägg',kcal:77,protein:7,fat:6,fiber:0,meal:3}];
      if(saved) S.meals=Array.from({length:4},(_,i)=>({name:i<3?'Ramen, Ägg':'Annan måltid',slot:3,kcal:572,protein:35,items:[{name:'Ramen',kcal:495,protein:28},{name:'Ägg',kcal:77,protein:7,fat:6,fiber:0}]}));
      save();
    }''',saved)
    go(page,'kost');page.click('[data-mealpage="3"]')


def test_saved_meals_can_all_be_removed_without_changing_food_log(page):
    meal(page,True)
    before=page.evaluate('JSON.stringify(day().food)')
    assert page.locator('.saved-meals [data-usemeal]').count()==4
    assert page.locator('.saved-meals h2').text_content()=='Sparade måltider'
    for count in [3,2,1,0]:
        page.locator('[data-savedremove]').first.click()
        assert page.evaluate('S.meals.length')==count
        assert page.evaluate('JSON.stringify(day().food)')==before
    page.reload()
    assert page.evaluate('S.meals.length')==0
    assert page.evaluate('day().food.length')==2


def test_same_combination_is_only_saved_once_even_in_different_order(page):
    meal(page)
    page.click('[data-savegroup="3"]')
    page.click('[data-savegroup="3"]')
    assert page.evaluate('S.meals.length')==1
    page.evaluate('day().food.reverse();save();render()')
    page.click('[data-savegroup="3"]')
    assert page.evaluate('S.meals.length')==1
    assert page.locator('.saved-meals [data-usemeal]').count()==1


@pytest.mark.parametrize('change',[
    'day().food[0].kcal=500',
    'day().food[0].fat=0',
    'setQty(day().food[1],2)',
])
def test_different_nutrition_or_amount_is_not_a_duplicate(page,change):
    meal(page)
    page.click('[data-savegroup="3"]')
    page.evaluate(change+';save();render()')
    page.click('[data-savegroup="3"]')
    assert page.evaluate('S.meals.length')==2


def test_saved_meal_can_be_added_after_deleting_another_saved_copy(page):
    meal(page,True)
    page.locator('[data-savedremove]').first.click()
    page.evaluate('day().food=[];save();render()')
    page.locator('.saved-meals [data-usemeal]').first.click()
    assert page.evaluate('eaten().kcal')==572
    assert page.evaluate('S.meals.length')==3


@pytest.mark.parametrize('theme',['light','dark'])
@pytest.mark.parametrize('width',[320,390])
def test_saved_meals_layout_and_contrast(page,theme,width):
    page.set_viewport_size({'width':width,'height':844})
    meal(page,True);page.evaluate('setTheme',theme)
    assert page.locator('#app').evaluate(CONTRAST)==[]
    assert page.locator('body').evaluate('e=>e.scrollWidth<=innerWidth')
    assert page.locator('.saved-meals button button').count()==0


def test_measured_amount_is_part_of_saved_combination(page):
    meal(page)
    page.evaluate('''() => {
      day().food[0].amt={n:1,unit:'portion',u:{portion:100},k:495,p:28};save();render();
    }''')
    page.click('[data-savegroup="3"]')
    page.evaluate('day().food[0].amt.n=2;applyAmt(day().food[0]);save();render()')
    page.click('[data-savegroup="3"]')
    assert page.evaluate('S.meals.length')==2


def test_same_combination_can_be_saved_for_another_meal_slot(page):
    meal(page)
    page.click('[data-savegroup="3"]')
    page.evaluate('day().food.forEach(f=>f.meal=1);save();render()')
    page.click('[data-sheetmeal="1"]')
    page.click('[data-savegroup="1"]')
    assert page.evaluate('S.meals.map(m=>m.slot)')==[3,1]
