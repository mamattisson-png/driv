"""Regressionsfall för kontoisolering och samtidiga ändringar från flera enheter."""
from conftest import start
from test_app import SB_CONFIG, SUPABASE_MOCK, login


def connected(page):
    page.context.route("**/config.js", lambda r: r.fulfill(body=SB_CONFIG, content_type="application/javascript"))
    start(page, SUPABASE_MOCK)
    login(page)


def test_kontobyte_delar_inte_foregaende_persons_logg(page):
    connected(page)
    page.evaluate("day().food.push({name:'Privat måltid',kcal:400}); save()")
    page.wait_for_function("!cloud.pushing && window.__db['m-' + TODAY.slice(0,7)]")
    page.evaluate("signOut()")
    page.evaluate("""async () => {
      window.__db = {};
      account.sb.auth.session = {user:{id:'u2',email:'annan@exempel.se'}};
      await connectSupabase();
      if (cloud.pushing) await cloud.pushing;
    }""")
    assert page.evaluate("JSON.stringify(window.__db).includes('Privat måltid')") is False
    assert page.evaluate("JSON.stringify(S).includes('Privat måltid')") is False
    # Originalets lokala säkerhetskopia finns kvar även utan molnkontakt.
    page.evaluate("signOut()")
    page.evaluate("""async () => {
      window.__db = {};
      account.sb.auth.session = {user:{id:'u1',email:'test@exempel.se'}};
      await connectSupabase();
      if (cloud.pushing) await cloud.pushing;
    }""")
    assert page.evaluate("S.log[TODAY].food[0].name") == "Privat måltid"


def test_tva_enheters_nya_maltider_och_pass_bevaras(page):
    start(page)
    result = page.evaluate("""() => {
      day().food.push({name:'Gröt',kcal:300}); save();
      const base = JSON.parse(JSON.stringify(S));
      day().food.push({name:'Lunch',kcal:500});
      day().workouts.push({dayId:'mobil',done:true,sets:{}}); save();
      const a = JSON.parse(JSON.stringify(S.log[TODAY]));
      S = base; stamp(true);
      day().food.push({name:'Middag',kcal:600});
      day().workouts.push({dayId:'dator',done:true,sets:{}}); save();
      return mergeParts(a, S.log[TODAY]);
    }""")
    assert sorted(f["name"] for f in result["food"]) == ["Gröt", "Lunch", "Middag"]
    assert sorted(w["dayId"] for w in result["workouts"]) == ["dator", "mobil"]


def test_borttagen_maltid_aterkommer_inte_vid_synk(page):
    start(page)
    result = page.evaluate("""() => {
      day().food.push({name:'Ta bort',kcal:1},{name:'Behåll',kcal:2}); save();
      const old = JSON.parse(JSON.stringify(S.log[TODAY]));
      day().food.splice(0,1); save();
      return mergeParts(S.log[TODAY],old).food;
    }""")
    assert [f["name"] for f in result] == ["Behåll"]


def test_samtidiga_molnskrivningar_bevarar_bada_enheternas_logg(page):
    connected(page)
    result = page.evaluate("""async () => {
      const id = 'm-2026-01', date = '2026-01-05';
      const base = {days:{[date]:{food:[],workouts:[],dailies:{},_t:{}}}};
      window.__db[id] = JSON.parse(JSON.stringify(base));
      const a = {days:{[date]:{food:[{name:'Lunch',_id:'food-a',_ts:10}],workouts:[],dailies:{},_t:{food:10}}}};
      const b = {days:{[date]:{food:[],workouts:[{dayId:'pass-b',_id:'workout-b',_ts:20}],dailies:{},_t:{workouts:20}}}};
      const ca = supabaseCollection(account.sb,'u1'), cb = supabaseCollection(account.sb,'u1');
      await Promise.all([ca.doc(id).set(a,base),cb.doc(id).set(b,base)]);
      return window.__db[id].days[date];
    }""")
    assert [f["name"] for f in result["food"]] == ["Lunch"]
    assert [w["dayId"] for w in result["workouts"]] == ["pass-b"]


def test_misslyckad_lasning_skriver_inte_over_molnet(page):
    start(page)
    result = page.evaluate("""async () => {
      let writes = 0;
      cloud.col = {getMany:async()=>{throw Error('tillfälligt nätfel')},doc:()=>({set:async()=>writes++})};
      day().food.push({name:'Lunch'}); save(); clearTimeout(cloud.timer);
      pushCloud(); await cloud.pushing;
      return {writes,status:cloud.status};
    }""")
    assert result == {"writes": 0, "status": "error"}


def test_dailys_fran_tva_enheter_bevaras(page):
    start(page)
    result = page.evaluate("""() => {
      day(); stamp(true); const base = JSON.parse(JSON.stringify(S));
      day().dailies.plankan = true; save();
      const a = JSON.parse(JSON.stringify(S.log[TODAY]));
      S = base; stamp(true); day().dailies.promenad = true; save();
      return mergeParts(a,S.log[TODAY]).dailies;
    }""")
    assert result == {"plankan": True, "promenad": True}


def test_aldre_maltider_far_samma_id_oavsett_json_nyckelordning(page):
    start(page)
    result = page.evaluate("""() => mergeParts(
      {food:[{name:'Lunch',kcal:500}],_t:{food:1}},
      {food:[{kcal:500,name:'Lunch'}],_t:{food:1}}
    ).food.length""")
    assert result == 1


def test_full_lagring_far_inte_markera_gammal_logg_som_annans(page):
    connected(page)
    page.evaluate("day().food.push({name:'Privat',kcal:400}); save()")
    page.wait_for_function("!cloud.pushing && window.__db['m-' + TODAY.slice(0,7)]")
    result = page.evaluate("""async () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k,v) {
        if (k === KEY) throw new DOMException('Fullt','QuotaExceededError');
        return original.call(this,k,v);
      };
      window.__db = {};
      account.sb.auth.session = {user:{id:'u2',email:'annan@exempel.se'}};
      await connectSupabase();
      Storage.prototype.setItem = original;
      return {owner:localOwner(),status:cloud.status};
    }""")
    assert result == {"owner": "u1", "status": "error"}



def test_aldre_daily_tidsstamplar_bevaras_vid_uppgradering(page):
    start(page)
    result = page.evaluate("""() => mergeParts(
      {dailies:{plankan:false},_t:{dailies:20}},
      {dailies:{plankan:true},_t:{dailies:10}}
    ).dailies.plankan""")
    assert result is False


def test_gammalt_vansvar_kan_inte_oppna_utloggad_profil(page):
    connected(page)
    result = page.evaluate("""async () => {
      const original = account.sb.rpc;
      let resolveProfile;
      account.sb.rpc = async name => name === 'driv_profile_get'
        ? new Promise(resolve => { resolveProfile = resolve; }) : original.call(account.sb,name);
      const pending = loadSocial();
      while (!resolveProfile) await Promise.resolve();
      await signOut();
      resolveProfile({data:{name:'Förra användaren',code:'ABC123',sharing:true},error:null});
      await pending;
      return social.profile;
    }""")
    assert result is None


def test_aldre_listors_overlevande_post_dubbleras_inte_efter_omordning(page):
    start(page)
    names = page.evaluate("""() => mergeParts(
      {food:[{name:'Frukost'},{name:'Lunch'}],_t:{food:1}},
      {food:[{name:'Lunch'}],_t:{food:2}}
    ).food.map(f=>f.name)""")
    assert names.count("Lunch") == 1



def test_samtidigt_skapad_manad_bevarar_bada_enheternas_logg(page):
    connected(page)
    result = page.evaluate("""async () => {
      const id = 'm-2025-01', date = '2025-01-05';
      const a = {days:{[date]:{food:[{name:'Lunch',_id:'a',_ts:10}],workouts:[],_t:{food:10}}}};
      const b = {days:{[date]:{food:[{name:'Middag',_id:'b',_ts:20}],workouts:[],_t:{food:20}}}};
      const ca = supabaseCollection(account.sb,'u1'), cb = supabaseCollection(account.sb,'u1');
      await Promise.all([ca.doc(id).set(a),cb.doc(id).set(b)]);
      return window.__db[id].days[date].food.map(f=>f.name).sort();
    }""")
    assert result == ["Lunch", "Middag"]
