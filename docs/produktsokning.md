# Märkesvaror på nätet

Knappen i Kost anropar `driv-food-search` i samma Supabase-projekt som `DRIV_CONFIG.supabaseUrl`.
Webbläsaren skickar projektets publika nyckel som `apikey`, utan inloggningskrav.
Direkta webbläsaranrop till OFF:s söktjänst fungerar inte eftersom svaret saknar CORS-tillåtelse.

Serverfunktionen gör egen kontroll av den publika nyckeln och tillåter endast origin
`https://driv.driveify.se`. Deploya med **verify_jwt: false**: den publika nyckeln är inte en JWT.
Detta ger åtkomst till offentlig produktdata, inte till användarnas dagböcker.
Inga hemliga nycklar ska skrivas i källkod eller appens konfiguration.

Kör `supabase/produktsokning.sql` före första deploymenten. Två tabeller i ett privat schema
delar söksvar (24 timmar) och sökbudget mellan alla funktionsinstanser. Endast service_role
har tillgång till tabellerna och deras två invoker-RPC:er. Inga befintliga tabeller ändras.
En ny extern sökning tillåts var sjätte sekund, högst 1 500 om dagen totalt.
Cacheträffar använder inte den externa sökbudgeten. Appen cachar även i fem minuter.
Begränsade anrop returnerar 429 och Retry-After; appen visar när man kan försöka igen.

Endast den fasta adressen `https://search.openfoodfacts.org/search` får anropas.
Servern bygger en sanerad fråga med Sverige som land och begär högst 15 träffar.
Extern hämtning avbryts efter 12 sekunder; appens timeout är 25 sekunder.
Produktdatans befintliga validering, källhänvisningar och ODbL gäller fortsatt.

Verifiering: `node tests/test_search_proxy.cjs`, webbläsartesterna samt ett faktiskt anrop
från Drivs origin som söker, väljer och loggar en produkt. Driftkostnaden beror på
projektets samlade kvoter; ingen betald plan eller ny betald tjänst krävs av denna ändring.
