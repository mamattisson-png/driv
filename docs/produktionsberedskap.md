# DRIV - Produktionsberedskap

Datum: 2026-10-29. Kodgranskning, inte genomfört belastningstest.

## Befintlig grund
- Supabase med ägarstyrd RLS för användardokument.
- Inställningar och månadsvisa träningsloggar.
- Revisionskontroll och sammanfogning vid synkkonflikter.
- Offlinecache och automatiska kontroller via GitHub Actions.

## Återstående tester
1. Synk mellan två testkonton och två enheter, även offline.
2. Import, export och återställning av syntetisk träningshistorik.
3. Test av lagringsgränser och felhantering vid nätavbrott.
4. Mätning av datastorlek, synkfrekvens och svarstid.
5. Kapacitetstester i separat testmiljö för 500, 5 000 och 50 000 registrerade användare.
6. Kontroll av driftlarm, säkerhetskopiering och åtkomstregler.
7. Kontroll av automatisk uppdatering av service worker-cacheversion.

## Mätetal
Rapportera p95 svarstid, felfrekvens, genomsnittlig och största datastorlek per konto, synkförsök per användare och konfliktfrekvens.

## Viktigt
Inga kapacitetsgränser är verifierade ännu. Belasta inte produktionsmiljön och använd inte riktiga användaruppgifter i testerna.
