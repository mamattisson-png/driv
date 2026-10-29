from conftest import start,go


def test_search_uses_driv_server_without_login_or_direct_off_request(page):
    calls=[]
    page.context.route('**/config.js',lambda r:r.fulfill(body='window.DRIV_CONFIG={supabaseUrl:"https://proxy.test",supabaseAnonKey:"public-test"}',content_type='application/javascript'))
    page.context.route('https://proxy.test/functions/v1/driv-food-search',lambda r:(calls.append(r.request),r.fulfill(json={'hits':[]})))
    page.context.route('https://search.openfoodfacts.org/**',lambda r:r.abort())
    start(page);go(page,'kost');page.click('[data-addto="1"]')
    page.fill('#fname','100 g ramen');page.click('[data-productsearch]')
    page.wait_for_function("productSearch.status==='empty'")
    assert len(calls)==1
    assert calls[0].method=='POST' and calls[0].post_data_json=={'q':'ramen'}
    assert calls[0].headers['apikey']=='public-test'
    assert 'authorization' not in calls[0].headers
    assert page.evaluate('day().food.length')==0
