"""Nya övningar ska gå att hitta, lägga till och logga med rätt utrustning."""
import pytest
from conftest import start, go


@pytest.mark.parametrize('exercise,area,gear',[
    ('broststodd_rodd','rygg','db'),
    ('smith_knaboj','ben','machine'),
    ('armhavningar_kna','brost','bw'),
])
def test_ny_ovning_kan_valjas_och_loggas(page,exercise,area,gear):
    start(page);go(page,'pass')
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    page.click('[data-edit]');page.click('[data-openpick]')
    page.select_option('[data-areasel]',area)
    page.select_option('[data-gearsel]',gear)
    page.fill('#exsearch',page.evaluate('id=>EX[id].name',exercise))
    page.click(f'[data-add="{exercise}"]')
    page.evaluate('editing=false; render()')
    assert page.evaluate('id=>S.plan.days[0].ex.some(e=>e.id===id)',exercise)
    page.click('[data-focusstart]')
    index=page.evaluate('id=>S.plan.days[0].ex.findIndex(e=>e.id===id)',exercise)
    page.evaluate('i=>{focus.idx=i;render()}',index)
    page.fill(f'[data-set="{exercise}"][data-i="0"][data-f="reps"]','10')
    page.click(f'[data-ok="{exercise}"][data-i="0"]')
    assert page.evaluate('id=>workoutsOn(TODAY)[0].sets[id][0].ok',exercise)
    page.reload()
    assert page.evaluate('id=>workoutsOn(TODAY)[0].sets[id][0].reps',exercise)==10


def test_framifran_kan_visa_benens_rorelse_utan_att_andra_gamla_figurer(page):
    start(page)
    result=page.evaluate('''() => {
      const pose={h:[60,60],a:[80,50],leg:[[80,76],[90,95],[94,95]]};
      return {leg:frontJoints(pose).leg, defaultLeg:frontJoints({h:[60,60],a:[80,50]}).leg};
    }''')
    assert result['leg']==[[65,60],[80,76],[90,95],[94,95]]
    assert result['defaultLeg']==[[65,60],[66,81],[67,95],[71,95]]


def test_knana_stannar_pa_golvet_vid_armahavningar(page):
    start(page)
    knees=page.evaluate('() => [EX.armhavningar_kna.A,EX.armhavningar_kna.B].map(p=>sideJoints(p).leg[1][1])')
    assert all(abs(y-95)<0.1 for y in knees)


def test_skulderovningen_behaller_raka_armbagar(page):
    start(page)
    lengths=page.evaluate('''() => [EX.skulder_armhavningar.A,EX.skulder_armhavningar.B].map(p=>{
      const a=sideJoints(p).arm;return Math.hypot(a[2][0]-a[0][0],a[2][1]-a[0][1]);
    })''')
    assert all(length>=30.9 for length in lengths)


def test_vadpress_benpress_visar_fotplattan(page):
    start(page)
    assert page.evaluate('EX.vadpress_benpress.plate')==[6,8]
