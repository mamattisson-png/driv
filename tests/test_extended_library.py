"""Utökat innehåll ska fungera i befintlig väljare, dailys och träningslogg."""
import pytest
from conftest import start,go


def test_biblioteket_laddas_med_flera_hundra_nya_ovningar(page):
    start(page)
    result=page.evaluate('''() => ({total:Object.keys(EX).length,strength:EXTRA_STRENGTH_IDS.length,
      stretch:EXTRA_STRETCH_IDS.length,missing:Object.keys(EX).filter(id=>!figure(id).includes('<svg')||
        (EX[id].cat!=='cardio'&&!mwUrl(id)))})''')
    assert result['total']>=500
    assert result['strength']>=200 and result['stretch']>=80
    assert result['missing']==[]


def test_ny_stretch_kan_laggas_till_som_daily_och_bevaras(page):
    start(page)
    exercise=page.evaluate("EXTRA_STRETCH_IDS.find(id=>isTimed(id))")
    go(page,'pass');page.click('[data-trsheet=dailys]');page.click('[data-dedit]')
    page.click('[data-openpick="daily"]');page.select_option('[data-areasel]','stretch')
    page.fill('#exsearch',page.evaluate('id=>EX[id].name',exercise))
    page.click(f'[data-add="{exercise}"]');page.click('[data-dedit]')
    page.click(f'[data-dcheck="{exercise}"]')
    assert page.evaluate('id=>dailyDone(TODAY,id)',exercise)
    page.reload()
    assert page.evaluate('id=>S.daily.some(e=>e.id===id)&&dailyDone(TODAY,id)',exercise)


@pytest.mark.parametrize('kind',['strength','static_stretch','dynamic_stretch'])
def test_utokad_ovning_kan_valjas_och_loggas_i_pass(page,kind):
    start(page)
    exercise=page.evaluate('''kind => kind==='strength' ? EXTRA_STRENGTH_IDS.find(id=>!isTimed(id)) :
      EXTRA_STRETCH_IDS.find(id=>isTimed(id)===(kind==='static_stretch'))''',kind)
    assert exercise
    go(page,'pass');page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    page.click('[data-edit]');page.click('[data-openpick]')
    page.select_option('[data-areasel]',page.evaluate('id=>areaOf(id)',exercise))
    page.fill('#exsearch',page.evaluate('id=>EX[id].name',exercise));page.click(f'[data-add="{exercise}"]')
    page.evaluate('editing=false;render()');page.click('[data-focusstart]')
    page.evaluate('id=>{focus.idx=S.plan.days[0].ex.findIndex(e=>e.id===id);render()}',exercise)
    if kind.endswith('stretch'):
        assert page.locator(f'[data-set="{exercise}"][data-f="kg"]').count()==0
    value=30 if kind=='static_stretch' else 10
    page.fill(f'[data-set="{exercise}"][data-i="0"][data-f="reps"]',str(value))
    page.click(f'[data-ok="{exercise}"][data-i="0"]')
    page.reload()
    assert page.evaluate('id=>workoutsOn(TODAY)[0].sets[id][0].ok',exercise)
    assert page.evaluate('id=>workoutsOn(TODAY)[0].sets[id][0].reps',exercise)==value


def test_utokade_kataloger_fungerar_offline(page):
    start(page)
    page.context.set_offline(True)
    assert page.evaluate('EXTRA_STRENGTH_IDS.every(id=>EX[id])&&EXTRA_STRETCH_IDS.every(id=>EX[id])')
    go(page,'pass');page.click('[data-trsheet=dailys]');page.click('[data-dedit]')
    page.click('[data-openpick="daily"]');page.select_option('[data-areasel]','stretch')
    assert page.locator('.pick:not([hidden])').count()>=100


def test_utokade_kataloger_finns_kvar_vid_omstart_utan_nat(browser,base_url):
    ctx=browser.new_context(service_workers='allow')
    ctx.add_init_script('window.__swTest=true')
    try:
        pg=ctx.new_page();pg.goto(base_url)
        pg.evaluate('navigator.serviceWorker.ready');pg.reload()
        pg.wait_for_function('!!navigator.serviceWorker.controller')
        ctx.set_offline(True);pg.reload()
        assert pg.evaluate('EXTRA_STRENGTH_IDS.length>=200&&EXTRA_STRETCH_IDS.length>=80')
        assert pg.evaluate('figure(EXTRA_STRETCH_IDS[0]).includes("<svg")')
    finally:
        ctx.close()
