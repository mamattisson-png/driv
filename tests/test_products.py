"""Märkesvaror: syntetiska näringsvärden så att testerna inte beror på nätet."""
import json
import pytest
from test_design import CONTRAST
from conftest import start, go
from test_app import add_to


PRODUCT = {
    'code': '7310000000001', 'product_name_sv': 'Lasagne', 'brands': ['Testfelix'],
    'quantity': '400 g', 'last_modified_t': 1700000000,
    'nutriments': {'energy-kcal_100g': 145, 'proteins_100g': 7.5, 'fat_100g': 5.2},
}


def ready(page):
    start(page)
    page.wait_for_function("typeof offFood === 'function'")
    page.evaluate("window.DRIV_CONFIG={supabaseUrl:'https://proxy.test',supabaseAnonKey:'public-test'}")
    page.evaluate('addProducts([%s])' % json.dumps(PRODUCT))


def test_produkt_med_mangd_och_kalla(page):
    start(page)
    food = page.evaluate('p => offFood(p)', PRODUCT)
    assert food['brand'] == 'Testfelix' and food['forp'] == 400
    assert food['basis'] == 'g' and food['kcal'] == 145 and food['p'] == 7.5
    assert food.get('fib') is None


def test_ofullstandiga_eller_orimliga_produkter_hoppas_over(page):
    start(page)
    result = page.evaluate('''p => {
      const noProtein = structuredClone(p); delete noProtein.nutriments.proteins_100g;
      const noEnergy = structuredClone(p); delete noEnergy.nutriments['energy-kcal_100g'];
      const negative = structuredClone(p); negative.nutriments.fat_100g = -1;
      const excess = structuredClone(p); excess.nutriments['energy-kcal_100g'] = 1800;
      const water = structuredClone(p); water.nutriments = {'energy-kcal_100g':0,proteins_100g:0};
      return [offFood(noProtein),offFood(noEnergy),offFood(negative),offFood(excess),offFood(water).kcal];
    }''', PRODUCT)
    assert result == [None, None, None, None, 0]


def test_multipack_ar_inte_en_portion(page):
    start(page)
    food = page.evaluate("p => offFood({...p,quantity:'6 x 50 g'})", PRODUCT)
    assert food['forp'] == 300
    assert not food.get('st') and not food.get('portion')


def test_ml_och_gram_blandas_inte(page):
    ready(page)
    result = page.evaluate('''p => {
      addProducts([{...p,code:'7310000000002',product_name_sv:'Havredryck',quantity:'1 l'}]);
      const food = FOODS.find(f=>f.code==='7310000000002');
      const i = parseFood(food.n[0]).items[0], a = amtFromItem(i);
      return {basis:food.basis,pack:food.forp,unit:a.unit,n:a.n,choices:unitChoices(a),bad:parseFood('100 g '+food.n[0]).unknown.length};
    }''', PRODUCT)
    assert result['basis'] == 'ml' and result['pack'] == 1000
    assert result['unit'] == 'dl' and result['n'] == 1
    assert 'g' not in result['choices'] and result['bad'] == 1


def test_marke_soks_i_valfri_ordning_och_valjs_fore_generisk_mat(page):
    ready(page)
    result = page.evaluate('''() => ({
      a:suggestFoods('testfelix lasagne').map(x=>x.food.code),
      b:suggestFoods('lasagne testfelix').map(x=>x.food.code),
      unknown:parseFood('testfelix lasagne').unknown.length,
    })''')
    assert '7310000000001' in result['a'] and '7310000000001' in result['b']
    assert result['unknown'] == 1


def test_hel_forpackning_loggas_och_kallan_foljer_med(page):
    ready(page)
    go(page, 'kost'); add_to(page, 1)
    page.fill('#fname', 'testfelix lasagne')
    page.click('[data-fpick="0:0"]')
    page.click('[data-amtopen]')
    page.select_option('[data-d0="u"]', 'forp')
    page.fill('[data-d0="n"]', '1')
    page.click('#faddbtn')
    f = page.evaluate('day().food.at(-1)')
    assert f['kcal'] == 580 and f['protein'] == 30 and f['fat'] == 20.8
    assert f.get('fiber') is None
    assert f['amt']['code'] == '7310000000001' and f['amt']['unit'] == 'forp'
    page.reload()
    assert page.evaluate('day().food.at(-1).kcal') == 580


def test_ingen_natsokning_for_varje_tangenttryckning(page):
    calls = []
    page.context.route('https://proxy.test/functions/v1/driv-food-search', lambda r: (calls.append(r.request.url), r.fulfill(json={'hits': [PRODUCT]})))
    ready(page); go(page, 'kost'); add_to(page, 0)
    page.fill('#fname', 'testfelix lasagne')
    assert calls == []
    page.click('[data-productsearch]')
    page.wait_for_selector('[data-productpick]')
    assert len(calls) == 1 and calls[0] == 'https://proxy.test/functions/v1/driv-food-search'
    page.click('[data-productpick="0"]')
    assert page.locator('[data-drow]').count() == 1


def test_natsokning_visar_fel_utan_att_forlora_inmatningen(page):
    page.context.route('https://proxy.test/functions/v1/driv-food-search', lambda r: r.abort('failed'))
    ready(page); go(page, 'kost'); add_to(page, 0)
    page.fill('#fname', 'okänt märke')
    page.click('[data-productsearch]')
    page.wait_for_selector('#productresults [role="status"]')
    page.wait_for_function("document.querySelector('#productresults').textContent.includes('Kunde inte')")
    assert page.input_value('#fname') == 'okänt märke'
    assert page.evaluate('day().food.length') == 0


def test_lokala_markesvaror_fungerar_utan_nat(page):
    ready(page)
    page.context.set_offline(True)
    assert page.evaluate("suggestFoods('testfelix lasagne')[0].food.code") == '7310000000001'


def test_startdatabasen_har_flera_marken_och_kategorier(page):
    start(page)
    page.wait_for_function("typeof productsReady !== 'undefined'")
    result = page.evaluate('''async () => {
      await productsReady;
      const fs=FOODS.filter(f=>f.code);
      return {count:fs.length,brands:new Set(fs.map(f=>f.brand)).size,felix:fs.some(f=>/felix/i.test(f.brand)),ml:fs.some(f=>f.basis==='ml')};
    }''')
    assert result['count'] >= 150 and result['brands'] >= 20 and result['felix'] and result['ml']


def test_ny_produkt_med_med_i_namnet_blir_en_rad(page):
    p = {**PRODUCT, 'code':'7310000000003', 'product_name_sv':'Pasta med kyckling', 'brands':['Testmärke']}
    page.context.route('https://proxy.test/functions/v1/driv-food-search', lambda r: r.fulfill(json={'hits':[p]}))
    ready(page); go(page, 'kost'); add_to(page, 0)
    page.fill('#fname', 'testmärke kyckling'); page.click('[data-productsearch]')
    page.wait_for_selector('[data-productpick]'); page.click('[data-productpick="0"]')
    assert page.evaluate('foodDraft.length') == 1
    assert page.evaluate('!!foodDraft[0].amt')


def test_nyare_natdata_uppdaterar_valet_men_inte_gammal_logg(page):
    p = {**PRODUCT, 'last_modified_t':1800000000, 'nutriments':{'energy-kcal_100g':160,'proteins_100g':8}}
    page.context.route('https://proxy.test/functions/v1/driv-food-search', lambda r: r.fulfill(json={'hits':[p]}))
    ready(page)
    page.evaluate("day().food.push({name:'Gammal',kcal:580,protein:30,amt:{n:1,unit:'forp',k:145,p:7.5,u:{forp:400},code:'7310000000001'}});save()")
    go(page, 'kost'); add_to(page, 0)
    page.fill('#fname', 'testfelix lasagne'); page.click('[data-productsearch]')
    page.wait_for_selector('[data-productpick]'); page.click('[data-productpick="0"]')
    assert page.evaluate('foodDraft[0].amt.k') == 160
    assert page.evaluate('day().food[0].kcal') == 580


def test_okand_styckvikt_far_inte_gissas(page):
    ready(page)
    result = page.evaluate("() => parseFood('2 st '+FOODS.find(f=>f.code==='7310000000001').n[0]).unknown.length")
    assert result == 1


def test_mangd_med_decimalkomma_bevaras_i_produktnamnet(page):
    start(page)
    f = page.evaluate("p => offFood({...p,quantity:'1,5 l'})", PRODUCT)
    assert f['forp'] == 1500 and '1.5 l' in f['label']


def test_sent_svar_ersatter_inte_en_andrad_sokning(page):
    ready(page); go(page, 'kost'); add_to(page, 0)
    page.evaluate('''() => {
      const original=window.fetch;
      window.fetch=(url,opts)=>String(url).startsWith('https://proxy.test/functions/v1/driv-food-search')
        ? new Promise(resolve=>window.__late=()=>resolve(new Response(JSON.stringify({hits:[]})))) : original(url,opts);
    }''')
    page.fill('#fname', 'testfelix lasagne'); page.click('[data-productsearch]')
    page.wait_for_function('!!window.__late')
    page.fill('#fname', 'annan produkt')
    page.evaluate('window.__late()')
    assert page.input_value('#fname') == 'annan produkt'
    assert page.evaluate('productSearch.hits.length') == 0
    assert page.locator('[data-productpick]').count() == 0


def test_samma_sokning_anvander_cache(page):
    calls=[]
    page.context.route('https://proxy.test/functions/v1/driv-food-search',lambda r:(calls.append(r.request.url),r.fulfill(json={'hits':[PRODUCT]})))
    ready(page); go(page, 'kost'); add_to(page, 0)
    page.fill('#fname', 'testfelix lasagne'); page.click('[data-productsearch]')
    page.wait_for_selector('[data-productpick]')
    page.click('[data-productsearch]')
    assert len(calls)==1




@pytest.mark.parametrize('mode,width',[('light',320),('dark',390)])
def test_produktsokning_far_plats_och_har_kontrast(page,mode,width,tmp_path):
    page.set_viewport_size({'width':width,'height':844})
    page.emulate_media(color_scheme=mode)
    p={**PRODUCT,'product_name_sv':'Krämig pastagratäng med kyckling & soltorkade tomater','brands':['Testmärke']}
    page.context.route('https://proxy.test/functions/v1/driv-food-search',lambda r:r.fulfill(json={'hits':[p]}))
    ready(page); page.evaluate("setTheme('auto')"); go(page, 'kost'); add_to(page,0)
    page.fill('#fname','testmärke gratäng'); page.click('[data-productsearch]')
    page.wait_for_selector('[data-productpick]')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert page.locator('#app').evaluate(CONTRAST)==[]
    page.screenshot(path=str(tmp_path / f'products-{mode}-{width}.png'),full_page=True)
    page.click('[data-productpick="0"]'); page.click('#faddbtn')
    page.click('[data-fooditem="0"]')
    assert page.locator('#app').evaluate(CONTRAST)==[]
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')



def test_tva_lika_produktnamn_bevarar_vald_streckkod(page):
    ready(page)
    p={**PRODUCT,'code':'7310000000009','nutriments':{'energy-kcal_100g':200,'proteins_100g':9}}
    page.context.route('https://proxy.test/functions/v1/driv-food-search',lambda r:r.fulfill(json={'hits':[p]}))
    go(page,'kost'); add_to(page,0)
    page.fill('#fname','testfelix lasagne'); page.click('[data-productsearch]')
    page.wait_for_selector('[data-productpick]'); page.click('[data-productpick="0"]')
    assert page.evaluate('foodDraft[0].amt.code')=='7310000000009'
    assert page.evaluate('foodDraft[0].amt.k')==200


def test_befintliga_generiska_livsmedel_fortsatter_fungera(page):
    ready(page)
    result=page.evaluate('''() => ["keso","bregott","kalles","philadelphia","o\'boy","marabou","red bull","monster","pepsi max","coca-cola zero"].filter(q=>parseFood(q).unknown.length)''')
    assert result==[]


def test_kand_fetthalt_forsvinner_inte_nar_fibrer_saknas(page):
    ready(page)
    page.evaluate("logFood({name:'Produkt',amt:{n:1,unit:'forp',k:145,p:7.5,fa:5.2,u:{forp:400},code:'7310000000001'}},0);save();mealPage=0;tab='kost';render()")
    assert '21 /' in page.inner_text('.kmac.fat')
    assert page.evaluate('eaten().fat') == 20.8
    assert page.evaluate('eaten().known')==0
    page.click('[data-fooditem="0"]')
    assert page.locator('.rstats div').filter(has_text='fibrer').inner_text().startswith('–')


def test_andrad_forpackning_tar_bort_gamla_enheter(page):
    ready(page)
    result=page.evaluate("""p=>{
      addProducts([{...p,code:'7310000000010',quantity:'1 l',last_modified_t:100}]);
      addProducts([{...p,code:'7310000000010',quantity:'',last_modified_t:101}]);
      const f=FOODS.find(f=>f.code==='7310000000010');
      return {dl:f.dl||null,pack:f.forp||null};
    }""",PRODUCT)
    assert result=={'dl':None,'pack':None}


def test_soktraff_med_nytt_marke_far_inte_logga_generisk_gissning(page):
    p={**PRODUCT,'code':'7310000000011','product_name_sv':'Potatisgratäng','brands':['Nytttestmärke']}
    page.context.route('https://proxy.test/functions/v1/driv-food-search',lambda r:r.fulfill(json={'hits':[p]}))
    ready(page); go(page,'kost'); add_to(page,0)
    page.fill('#fname','nytttestmärke gratäng'); page.click('[data-productsearch]')
    page.wait_for_selector('[data-productpick]')
    assert page.locator('#faddbtn').is_disabled()
    page.click('[data-productpick="0"]')
    assert not page.locator('#faddbtn').is_disabled()
    assert page.evaluate('foodDraft[0].amt.code')=='7310000000011'


def test_byte_till_forpackning_bevarar_matmangden(page):
    ready(page)
    result=page.evaluate('''() => {
      const f=FOODS.find(f=>f.code==='7310000000001'),i=parseItem('100 g '+f.n[0]);
      const a=amtFromItem(i);setUnit(a,'forp');
      return {n:a.n,grams:amtGrams(a),text:amtText(a)};
    }''')
    assert result=={'n':0.25,'grams':100,'text':'0,25 förpackning'}
