"""Restaurangmat ska använda svenska standardportioner utan påhittad vikt."""
import pytest
from conftest import start, go
from test_app import add_to

RESTO = {'id':'mcd-se-999999','chain':"McDonald's",'name':'Testburgare',
         'per_portion':{'kcal':548,'protein':27,'fat':29,'fiber':3.97},
         'source_url':'https://www.mcdonalds.com/se/sv-se/product/big-mac.html','checked_at':'2026-10-28'}


def ready(page):
    start(page)
    page.evaluate('async () => { await restaurantsReady; }')
    page.evaluate('r=>addRestaurants([r])',RESTO)


def test_restaurangdata_ar_per_portion(page):
    ready(page)
    result=page.evaluate('''() => {
      const i=parseFood('mcdonalds testburgare').items[0],a=amtFromItem(i);
      return {kcal:i.kcal,protein:i.protein,n:a.n,unit:a.unit,choices:unitChoices(a)};
    }''')
    assert result=={'kcal':548,'protein':27,'n':1,'unit':'portion','choices':['portion']}


def test_flera_och_halva_restaurangportioner(page):
    ready(page)
    result=page.evaluate("() => [parseFood('2 mcdonalds testburgare').kcal,parseFood('0,5 portion mcdonalds testburgare').kcal]")
    assert result==[1096,274]


def test_okand_restaurangvikt_kan_inte_loggas_i_gram(page):
    ready(page)
    assert page.evaluate("parseFood('100 g mcdonalds testburgare').unknown.length")==1
    assert page.evaluate("parseFood('2 dl mcdonalds testburgare').unknown.length")==1


def test_kalla_och_portion_foljer_med_i_loggen(page):
    ready(page);go(page,'kost');add_to(page,0)
    page.fill('#fname','mcdonalds testburgare');page.click('#faddbtn')
    f=page.evaluate('day().food[0]')
    assert f['kcal']==548 and f['amt']['basis']=='portion'
    assert f['amt']['source']['name']=="McDonald's Sverige"
    page.click('[data-fooditem="0"]')
    assert page.locator('a[href="'+RESTO['source_url']+'"]').count()==1
    page.reload()
    assert page.evaluate('day().food[0].kcal')==548


def test_en_produkts_naring_far_inte_bli_en_hel_meny(page):
    ready(page)
    assert page.evaluate("parseFood('mcdonalds testburgare meny').unknown.length")==1


def test_nuggetpaket_raknas_som_en_portion(page):
    ready(page)
    page.evaluate("r=>addRestaurants([{...r,id:'mcd-se-999998',name:'6 st Testnuggets',per_portion:{kcal:260,protein:15}}])",RESTO)
    assert page.evaluate("parseFood('mcdonalds 6 st testnuggets').kcal")==260
    assert page.evaluate("parseFood('2 portioner mcdonalds 6 st testnuggets').kcal")==520


def test_svenska_katalogen_innehaller_burgare_pommes_och_dryck(page):
    ready(page)
    result=page.evaluate('''() => {
      const fs=FOODS.filter(f=>f.restaurant);
      const big=fs.find(f=>f.code==='mcd-se-200000');
      return {count:fs.length,big:parseFood('big mac').items[0].food.code,
        kcal:parseFood('big mac').kcal,pommes:fs.some(f=>/pommes/i.test(f.label)),cola:fs.some(f=>/coca.cola/i.test(f.label))};
    }''')
    assert result['count']>=80 and result['big']=='mcd-se-200000'
    assert result['kcal']>400 and result['pommes'] and result['cola']


def test_restaurangmat_fungerar_utan_nat(page):
    ready(page);page.context.set_offline(True)
    assert page.evaluate("parseFood('donken testburgare').kcal")==548


def test_alla_valda_restaurangnamn_bevarar_produkt_och_portion(page):
    ready(page)
    failures=page.evaluate('''() => FOODS.filter(f=>f.restaurant).flatMap(f=>{
      chooseProduct(0,f);
      const i=parseFood(f.n[0]).items[0];
      return i?.known && i.food.code===f.code && i.kcal===Math.round(f.kcal) ? [] : [f.label];
    })''')
    assert failures==[]


@pytest.mark.parametrize('text',['bigmacmeny','bigmacmenyn','mcdonalds big mac menu'])
def test_menynamn_kraver_separata_produkter(page,text):
    ready(page)
    result=page.evaluate('text=>parseFood(text).items[0]',text)
    assert not result['known']
    assert 'inte en hel meny' in result['note']
