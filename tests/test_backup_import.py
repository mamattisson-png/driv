"""Regressioner för import av en säkerhetskopia via Min profil."""
import json

from conftest import go, start
from test_sync import connected


def import_backup(page, backup):
    page.locator("#importfile").set_input_files({
        "name": "driv-backup.json",
        "mimeType": "application/json",
        "buffer": json.dumps(backup).encode(),
    })


def test_aldre_sakerhetskopia_bevarar_nyare_manad_i_molnet(page):
    connected(page)
    backup = page.evaluate("""() => {
      const backup = JSON.parse(JSON.stringify(S));
      backup.log['2020-01-06'] = {food:[{name:'Äldre måltid',kcal:300}]};
      return backup;
    }""")
    page.evaluate("""() => {
      day('2020-02-06').food.push({name:'Nyare måltid',kcal:500});
      save();
    }""")
    page.wait_for_function("!cloud.pushing && window.__db['m-2020-02']")
    go(page, "minprofil")
    import_backup(page, backup)
    page.wait_for_function("!cloud.pushing && window.__db['m-2020-01']")
    assert page.evaluate("S.log['2020-02-06']?.food.map(f => f.name)") == ["Nyare måltid"]
    assert page.evaluate("window.__db['m-2020-02']?.days['2020-02-06'].food.map(f => f.name)") == ["Nyare måltid"]
    assert page.evaluate("window.__db['m-2020-01'].days['2020-01-06'].food.map(f => f.name)") == ["Äldre måltid"]


def test_aldre_sakerhetskopia_skriver_inte_over_eller_aterupplivar_maltider(page):
    start(page)
    backup = page.evaluate("""() => {
      day().food.push({name:'Frukost',kcal:300},{name:'Borttagen',kcal:100});
      save();
      const backup = JSON.parse(JSON.stringify(S));
      day().food[0].kcal = 400;
      day().food.pop();
      save();
      return backup;
    }""")
    go(page, "minprofil")
    import_backup(page, backup)
    page.get_by_text("Importerat.", exact=True).wait_for()
    assert page.evaluate("day().food.map(f => [f.name, f.kcal])") == [["Frukost", 400]]


def test_okand_backupversion_avvisas_utan_att_andra_loggen(page):
    start(page)
    page.evaluate("day().food.push({name:'Behåll',kcal:300}); save()")
    go(page, "minprofil")
    import_backup(page, {"v": 99, "log": {}})
    page.wait_for_function("importMsg !== ''")
    assert page.get_by_text("Kunde inte läsa filen.", exact=False).is_visible()
    assert page.evaluate("day().food.map(f => f.name)") == ["Behåll"]


def test_v1_backup_kan_importeras_igen_utan_dubbla_pass(page):
    start(page)
    go(page, "minprofil")
    backup = {
        "v": 1,
        "program": {"push": [{"id": "bp", "name": "Bänkpress"}]},
        "log": {"2020-01-06": {
            "workout": {"day": "push", "done": True, "sets": {"bp": [{"kg": 60, "reps": 8}]}},
        }},
    }
    import_backup(page, backup)
    page.get_by_text("Importerat.", exact=True).wait_for()
    page.evaluate("importMsg = ''; render()")
    import_backup(page, backup)
    page.get_by_text("Importerat.", exact=True).wait_for()
    assert page.evaluate("S.log['2020-01-06'].workouts.map(w => w.sets.bankpress[0].kg)") == [60]


def test_skadad_backup_lamnar_aktiv_och_sparad_logg_ororda(page):
    start(page)
    backup = page.evaluate("""() => {
      day().food.push({name:'Behåll',kcal:300}); save();
      const backup = JSON.parse(JSON.stringify(S));
      backup.log['2020-01-06'] = {food:[], dailies:{}, workouts:[], acts:[null]};
      return backup;
    }""")
    go(page, "minprofil")
    before = page.evaluate("JSON.stringify([S, localStorage.getItem(KEY)])")
    import_backup(page, backup)
    page.get_by_text("Kunde inte läsa filen.", exact=False).wait_for()
    assert page.evaluate("JSON.stringify([S, localStorage.getItem(KEY)])") == before


def test_import_bevarar_ordningen_pa_befintliga_pass_samma_dag(page):
    start(page)
    backup = page.evaluate("""() => {
      day().workouts.push(
        {dayId:'fritt',sets:{bankpress:[{kg:60,reps:8}]}},
        {dayId:'fritt',sets:{bankpress:[{kg:70,reps:8}]}}
      );
      save();
      const backup = JSON.parse(JSON.stringify(S));
      backup.log[TODAY].workouts.shift();
      return backup;
    }""")
    go(page, "minprofil")
    import_backup(page, backup)
    page.get_by_text("Importerat.", exact=True).wait_for()
    assert page.evaluate("day().workouts.map(w => w.sets.bankpress[0].kg)") == [60, 70]


def test_aldre_installningar_kan_aterstallas_pa_ny_enhet(page):
    start(page)
    backup = page.evaluate("""() => {
      const backup = JSON.parse(JSON.stringify(S));
      backup.profile.age = 47;
      backup.profileSet = true;
      delete backup._t;
      return backup;
    }""")
    go(page, "minprofil")
    import_backup(page, backup)
    page.get_by_text("Importerat.", exact=True).wait_for()
    assert page.evaluate("JSON.parse(localStorage.getItem(KEY)).profile.age") == 47
