"""Övningsfigurerna (höjdkurvor): alla övningar ritas, rörelsen är jämn och små bilder står stilla."""
from conftest import start


def test_alla_ovningar_ritas_utan_ogiltiga_tal(page):
    start(page)
    bad = page.evaluate("""() => { const out = [];
      for (const id of Object.keys(EX)) {
        const still = figure(id), anim = EX[id].B ? figure(id, 'big', true) : '';
        if (!still.includes('<svg') || /NaN|undefined|Infinity/.test(still + anim)) out.push(id);
        if (still.includes('<animate')) out.push(id + ': stilla bild animeras');
      }
      return out; }""")
    assert bad == []


def test_armar_och_ben_behaller_sin_langd_genom_rorelsen(page):
    # Händer och fötter rör sig i bågar runt lederna, så överarm, underarm, lår och smalben
    # har samma längd i varje läge (utom där leden byter böjriktning och glider mellan lägena)
    start(page)
    worst = page.evaluate("""() => { let worst = 0;
      const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
      for (const id of ['knaboj', 'bankpress', 'sidolyft', 'utfall', 'kabelflyes', 'marklyft', 'militarpress']) {
        const e = EX[id];
        for (let k = 0; k <= 1; k += 0.05) {
          const J = figureJoints(e, k);
          for (const [l, a, b] of [[J.arm, BODY.ua, BODY.fa], [J.leg, BODY.th, BODY.sh]]) {
            worst = Math.max(worst, Math.abs(len(l[0], l[1]) - a), Math.abs(len(l[1], l[2]) - b));
          }
        }
      }
      return worst; }""")
    assert worst < 0.5


def test_ben_som_bara_finns_i_slutlaget_ror_sig(page):
    start(page)
    moved = page.evaluate("""() => { const e = EX.hoftabduktion_kabel;
      const a = figureJoints(e, 0).leg2[2], b = figureJoints(e, 1).leg2[2];
      return Math.hypot(a[0] - b[0], a[1] - b[1]); }""")
    assert moved > 5


def test_musklerna_kommer_fran_ovningens_huvudmuskler(page):
    start(page)
    # Knäböj tränar framsida lår: bilden har en orange muskel. Stretch saknar huvudmuskel: ingen orange.
    assert 'var(--accent)' in page.evaluate("figure('knaboj')")
    stretch = page.evaluate("Object.keys(EX).find(id => EX[id].cat === 'stretch' && !(EX[id].prim || []).length)")
    assert 'var(--accent)' not in page.evaluate("id => figure(id)", stretch)
