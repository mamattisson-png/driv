# Svenska märkesvaror

Mål: alla matkategorier ska stödjas i Drivs matsökning. Befintliga generiska livsmedel och personliga loggar ska fungera oförändrat.

Val: en lokal startdatabas från Open Food Facts, plus uttrycklig nätsökning i deras Search-a-licious-tjänst. Bara lokal data ger för smalt sortiment; enbart nätsökning förlorar offlinestödet. Användarens besked ”Allt” gäller samtliga matkategorier.

- [x] Importera en reproducerbar, källmärkt startdatabas med svenska märkesvaror från flera kategorier. Publicera datan separat under ODbL och dokumentera åtkomst och begränsningar.
- [x] Lägg till produktnormalisering med validering av näringsvärden, gram/ml, förpackning och portionsvikt. Testa avsaknade värden, multipack och orimliga data innan implementation.
- [x] Integrera lokala produkter i samma sökning, med ordoberoende märkesmatchning och utan att generiska livsmedel väljs när användaren sökt ett känt märke.
- [x] Lägg till nätsökning på uttryckligt tryck, begränsade sökfrågor, timeout, cache och skydd mot sena svar. Testa nätfel, tomma svar och ändrad söktext.
- [x] Gör resultat och loggning tydliga: produkt, märke, förpackning, källa och valbar mängd i rätt enhet. Bevara källinformation vid loggning och upprepning.
- [x] Kör hela testsviten, testa mobilbredd/kontrast och offlinestart. Uppdatera service workern och skapa en separat PR.

Filer: nya produkter.js (normalisering, katalog, nätsökning), produkter.json (ODbL-data), tools/produkter.py (reproducerbar import), tests/test_products.py; ändringar i mat.js, kost.js, index.html, sw.js, README.md.

Begränsningar: källan är användarbidragen. Näringsvärden kan vara äldre än förpackningen. En förpackning är inte automatiskt en portion. Volymdata ska inte presenteras som uppmätt vikt. En okänd fetthalt eller fiberhalt får inte bli noll. Nätsökningen sker aldrig för varje tangenttryckning och ersätter aldrig ett redan loggat näringsvärde.


Verifierat före slutkörningen: 273 källposter, 121 märken, 85 Felix-produkter; 23 produkttester passerar före sista enhetskontrollen. Separat kodgranskning genomförd. Fynd om streckkodsidentitet, befintliga generiska namn, delvis saknade näringsvärden och uppdaterade förpackningar återskapades i tester och rättades.

Beslut: använd ett litet lokalt urval och en uttrycklig nätsökning med reservlänk till källans söksida. Det vanliga produkt-API:t svarade 503 och klienthämtning kunde inte verifieras mot den externa tjänsten i testwebbläsaren. Reservlänken och felhanteringen gör att katalog och loggning fortsätter fungera när externa hämtningar misslyckas. Hela marknaden ingår inte i starturvalet.

Enhetskontroll: byte från 100 g till förpackning ska visa 0,25 av en 400 g-förpackning och behålla samma näringsvärden. Det tidigare halvstegsavrundningen för portioner används därför inte för förpackningar. Återskapad i test före rättning.

Slutverifiering: `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 python -m pytest tests -q` → 135 passerade tester, inklusive 24 produkttester. Syntaxkontroller och git diff --check godkända. Mobilvyerna verifierade vid 320 px ljust läge och 390 px mörkt läge, inklusive kontrast och horisontell bredd.
