"""Träningsformer går att söka på (synonymer och felstavningar) och har kcal."""
from conftest import start


def test_search_finds_synonyms_and_typos(page):
    start(page)
    hits = page.evaluate("""['ems', 'jogga', 'spin', 'thai', 'pingis', 'simmning', 'längd'].map(q => actSearch(q)[0])""")
    assert hits == ["EMS", "Löpning", "Spinning", "Kickboxning", "Bordtennis", "Simning", "Skidor"]
    assert page.evaluate("ACTIVITIES.length") >= 80
    assert page.evaluate("ACTIVITIES.every(a => a.met.length === 3 && a.met.every(m => m > 1 && m < 15))")
    # 20 min EMS, medel, 80 kg: runt 120 kcal
    assert 100 <= page.evaluate("S.profile.weight = 80, actKcal({name: 'EMS', min: 20, int: 2})") <= 160


def test_search_in_sheet_and_own_name(page):
    start(page)
    page.evaluate("S.tourAsked = true; openAct(TODAY, null, ''); render()")
    page.fill("#actq", "ems")
    assert page.evaluate("document.activeElement.id") == "actq"
    page.click("[data-actpick='EMS']")
    page.click("[data-actsave]")
    assert page.evaluate("actsOn(TODAY)[0].name") == "EMS"
    page.evaluate("openAct(TODAY, null, ''); render()")
    page.fill("#actq", "Gokart")
    page.click("[data-actown]")
    assert page.evaluate("[actSheet.name, actSheet.custom]") == ["Gokart", True]
