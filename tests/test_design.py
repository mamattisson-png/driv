"""Design: all synlig text ska ha tillräcklig kontrast (WCAG AA) i ljust och mörkt läge,
och inget får sticka ut utanför skärmen i mobilbredd."""
import datetime

import pytest

from conftest import finish_setup, go, open_app

# Räknar ut kontrasten för varje synlig text mot närmaste bakgrund och returnerar de som är för låga.
# Vanlig text kräver 4,5:1; stor text (24 px, eller 18,7 px fet) 3:1. Inaktiva knappar räknas inte.
CONTRAST = r"""
(root) => {
  const parse = c => (c.match(/[\d.]+/g) || []).map(Number);
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const mix = (top, bottom, a) => top.map((v, i) => v * a + bottom[i] * (1 - a));
  const bgOf = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const p = parse(getComputedStyle(e).backgroundColor);
      if (p.length === 3) { layers.push([p, 1]); break; }
      if (p[3] > 0) layers.push([p.slice(0, 3), p[3]]);
    }
    let c = layers.length && layers[layers.length - 1][1] === 1 ? layers.pop()[0] : [255, 255, 255];
    for (const [p, a] of layers.reverse()) c = mix(p, c, a);
    return c;
  };
  const bad = [];
  for (const el of root.querySelectorAll("*")) {
    if (!el.getClientRects().length || el.closest("svg, [disabled], :disabled, [hidden], option, select")) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden") continue;
    let op = 1;
    for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const bg = bgOf(el);
    let fg = parse(cs.color);
    fg = mix(fg.slice(0, 3), bg, (fg.length > 3 ? fg[3] : 1) * op);
    const a = lum(fg), b = lum(bg), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    if (r < need) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).trim().replace(/\s+/g, ".")} "${el.textContent.trim().slice(0, 30)}" ${r.toFixed(2)} < ${need}`);
  }
  return bad;
}
"""


def views(page):
    """Går igenom appens vyer och fönster; ger (namn, rotelement) för varje."""
    page.clock.install(time=datetime.datetime(2026, 10, 25, 12, 0))   # en söndag, så att veckobrevet syns
    open_app(page)
    page.evaluate("setTheme('auto')")   # följer färgschemat som testet väljer
    yield "Välkommen", "#app"
    for step, name in [(1, "Steg 1, program"), (2, "Steg 2, pass och dagar"), (3, "Steg 3, mål")]:
        page.click(f'[data-onb="{step}"]')
        if step == 2:
            page.click('[data-mode="fixed"]')
        yield name, "#app"
    page.evaluate("document.getElementById('app').insertAdjacentHTML('beforeend', `<div id='inl'>${loginView()}</div>`)")
    yield "Logga in", "#inl"
    page.evaluate("account.step = 'code'; account.email = 'a@b.se'; document.getElementById('inl').innerHTML = loginView(); account.step = 'email'")
    yield "Logga in, kod", "#inl"
    page.evaluate("document.getElementById('inl').remove()")
    finish_setup(page)
    page.evaluate("""() => { const D = S.plan.days;
      for (const [o, k] of [[-1, 0], [-3, 1], [-5, 2], [-8, 0], [-10, 1]]) S.log[shift(TODAY, o)] = {workouts: [{dayId: D[k].id, done: true,
        sets: {bankpress: [{kg: 80, reps: 8, ok: true}], marklyft: [{kg: 120, reps: 5, ok: true}]}}], dailies: {plankan: true, lop: {km: 5}},
        food: [{name: 'Gröt', kcal: 300, protein: 10, meal: 0, amt: {n: 1, unit: 'portion', k: 70, p: 2.5, u: {portion: 250}}}]};
      S.weights[shift(TODAY, -8)] = 81; S.weights[shift(TODAY, -1)] = 80.4;
      day().dailies.plankan = true; day().food.push({name: 'Ägg', kcal: 154, protein: 13, meal: 1}); save(); render(); }""")
    yield "Idag", "#app"
    go(page, "pass")
    yield "Träna", "#app"
    page.click("[data-trsheet=dailys]")
    yield "Dailys", ".sheet"
    page.click(".sheet [data-trsheet='']")
    page.click(f'[data-pick="{page.evaluate("S.plan.days[0].id")}"]')
    yield "Passet", "#app"
    page.evaluate("chosenDay = S.plan.days[0].id; window.__ex = S.plan.days[0].ex; S.plan.days[0].ex = [{ id: 'kabelflyes', sets: 3, reps: '12', ss: true }, { id: 'lutande_hantelpress', sets: 3, reps: '10', warm: 2 }]; editing = true; render()")
    yield "Ändra övningar", "#app"
    page.click('[data-exsheet="1"]')
    yield "Övningens blad", ".sheet"
    page.evaluate("S.plan.days[0].ex = window.__ex; S.plan.days[0].ex[0].warm = 1; exSheet = null; editing = false; render()")
    page.click("[data-focusstart]")
    yield "Fokusläge, uppvärmning", "body"
    page.click('[data-ok=bankpress][data-w][data-i="0"]')
    page.click('[data-ok=bankpress][data-i="0"]:not([data-w])')
    yield "Fokusläge", "body"
    page.click("[data-fend]")
    yield "Avsluta passet", ".sheet"
    page.click(".sheet [data-fendclose]")
    page.click("[data-restskip]")
    page.evaluate("openAct(TODAY, null, 'Padel'); render()")
    yield "Logga aktivitet", ".sheet"
    page.evaluate("actSheet = null; render()")
    # Pass klart, och vännernas rutor (vänner kräver Supabase, så de ritas direkt här)
    page.evaluate("passDone = { dayId: S.plan.days[0].id, date: TODAY }; render()")
    yield "Pass klart", "#app"
    page.evaluate("""() => { passDone = null; social.profile = { name: 'Anna', code: 'ANNA01', sharing: true };
      const now = new Date().toISOString(), feed = [{ id: 1, day: TODAY, pass: 'Pull', name: 'Bo', kudos: 0, kudoed: false, created: now },
        { id: 2, day: TODAY, pass: 'Ben', name: 'Sara', kudos: 1, kudoed: true, created: now }];
      document.getElementById('app').innerHTML = `<section class="card friendsbox"><button class="fbhead">${avatars(['Bo', 'Sara', 'Erik', 'Lisa'])}
        <span class="grow"><b>2 vänner</b> <span class="muted">har tränat idag</span></span><span class="muted small fball">Alla</span></button>
        ${feed.map(feedEvent).join('')}${myKudosEvent({ day: TODAY, pass: 'Push', kudos: 2 })}</section>
        <button class="card fday">${avatars(['Jonas', 'Lisa'], 2)}<span class="grow">Jonas och Lisa</span></button>${inviteMarkup()}`; }""")
    yield "Vänner", "#app"
    page.evaluate("render()")
    go(page, "kost")
    yield "Kost", "#app"
    page.click("[data-addto]")
    page.click('[data-sheetmeal="1"]')
    page.fill("#fname", "bolognese och 2 ägg")
    page.click(".sheet h2")
    yield "Lägg till mat", ".sheet"
    page.evaluate("recipeEdit = { idx: null, name: 'Lasagne', portions: 4, items: [{ name: 'Nötfärs', text: '500 g nötfärs', kcal: 1100, protein: 95 }], msg: 'Känns inte igen: x' }; render()")
    yield "Recept", ".sheet"
    page.evaluate("recipeEdit = null; S.recipes = [{ name: 'Lasagne', portions: 4, items: [{ name: 'Nötfärs', text: '500 g', kcal: 1100, protein: 95 }] }]; recipeList = true; render()")
    yield "Dina recept", ".sheet"
    page.evaluate("recipeList = false; render()")
    page.click("#faddbtn")
    page.click('[data-fooditem="0"]')
    yield "Ändra mat", ".sheet"
    page.click(".sheet [data-itemclose].primary")
    go(page, "historik")
    yield "Historik", "#app"
    page.click(f'[data-histday="{page.evaluate("shift(TODAY, -1)")}"]')
    yield "Dag i historiken", ".sheet"
    page.click(".sheet [data-hclose].wide")
    page.click("[data-letter]")
    yield "Veckobrev", ".sheet"
    page.evaluate("modal = null; histView = 'utveckling'; render()")
    yield "Utveckling", "#app"
    page.evaluate("histView = 'kalender'")
    go(page, "profil")
    yield "Profil", "#app"
    page.evaluate("document.querySelector('[data-psec=kalori]').click()")
    yield "Profil, kalorimål", "#app"
    page.evaluate("document.querySelector('[data-psec=konto]').click()")
    yield "Profil, konto", "#app"
    page.evaluate("setupFrom = 'pass'; tab = 'upplagg'; daysOpen = true; render()")
    yield "Upplägg", "#app"
    yield "Flikar", "#nav"


@pytest.mark.parametrize("scheme", ["light", "dark"])
def test_kontrast_i_alla_vyer(page, scheme):
    page.emulate_media(color_scheme=scheme)
    problems = []
    for name, root in views(page):
        for p in page.evaluate(CONTRAST, page.query_selector(root)):
            problems.append(f"{name}: {p}")
    assert not problems, "För låg kontrast:\n" + "\n".join(problems)


@pytest.mark.parametrize("width", [320, 390])
def test_inget_sticker_ut_i_mobilbredd(page, width):
    page.set_viewport_size({"width": width, "height": 800})
    problems = []
    for name, _ in views(page):
        over = page.evaluate("document.documentElement.scrollWidth") - width
        if over > 0:
            who = page.evaluate("[...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 3).map(e => e.tagName.toLowerCase() + '.' + String(e.className).replace(/ /g, '.') + ' ' + e.textContent.trim().slice(0, 25))")
            problems.append(f"{name}: sidan är {over} px för bred ({', '.join(who)})")
    assert not problems, "\n".join(problems)
