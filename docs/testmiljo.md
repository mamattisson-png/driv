# DRIV – testmiljö och acceptanstest

## Miljöer

- **Produktion:** Supabase `zepugwoostphckstyrqf`. Får inte användas för testdata.
- **Databastest:** Supabase `ujnfbjisrhudvnzvmniq` (DRIV Test, eu-west-1).
- **Viktigt:** DRIV:s befintliga `?test`-läge är ett **lokalt utvecklarläge**. I `konto.js` stänger `window.DRIV_TEST` av Supabase-konton och synk. Det kan därför **inte** användas för tvåklientstest mot DRIV Test.
- Den publika `config.js` pekar på produktion. Ändra inte den filen för att testa staging. Bygg och publicera först en **separat testdistribution** med egen `config.js`, egen origin och egen service-worker-cache. Kopiera aldrig produktionsdata dit.
- Använd endast Supabases publika publishable key i klienten; aldrig service_role eller annan hemlig nyckel.
- En separat testdistribution är **ännu inte publicerad**. Testkonton via riktiga Auth-sessioner har **inte** verifierats.

## Automatiska kontroller

- `node --test tests/sync.test.cjs` – merge av träningsposter, Dailys, borttagningar och inställningar.
- `python -m unittest discover -s tests -p 'test_release_safety.py' -v` – befintliga releasekontroller.
- `tests/supabase-rls.sql` – kör enbart i **DRIV Test** i SQL Editor. Testet körs i `BEGIN`/`ROLLBACK` och lämnar inte kvar testdata.
- CI: `.github/workflows/release-safety.yml`. Kontrollera status i GitHub Actions; verifierad grön körning krävs före lansering.

## Tvåklientstest när staging finns

1. Skapa ett särskilt testkonto i DRIV Test. Logga in med samma konto i två separata webbläsarprofiler/enheter.
2. Enhet A lägger till ett träningsset. Enhet B synkar och ska se samma set.
3. Koppla ned B från nätet. Lägg till ett annat set på B; lägg till ett tredje på A.
4. Återanslut B, synka båda klienterna och ladda om. Alla tre set ska finnas kvar.
5. Registrera två olika Dailys samma dag på A och B. Båda ska finnas kvar efter synk.
6. Ta bort ett set på A medan B har en äldre kopia. Efter synk får setet inte återkomma.
7. Upprepa med kostposter, inställningar, kontobyte och appomstart.
8. Kontrollera i DRIV Test att inga andra kontons data kan läsas eller ändras.
9. Mät antal förfrågningar, överförda byte och lagringsökning per användarscenario innan belastningstest.

**Godkännandekrav:** ingen dataförlust, inga korsanvändarläckor, inga oväntade fel och bekräftad grön CI-körning.

## Kostnad och säkerhet

Använd gratisnivån. Aktivera inte betalfunktioner, extra projekt eller större belastning utan separat kostnadskontroll och godkännande.
