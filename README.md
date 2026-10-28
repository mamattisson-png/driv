<img src="icons/icon-192.png" alt="Driv" width="96">

# Driv

**Ditt mål. Ditt driv.** Träning, mat och vanor – enkelt, på ett ställe. Hem visar dagens pass med alla övningar, dina dailys och dagens mat. Logga passet en övning i taget, håll koll på kalorierna och följ din utveckling i Historik. Inga beroenden och inget konto krävs: allt sparas i din webbläsare, och med ett gratis konto även tryggt i molnet.

**Öppna appen:** https://driv.driveify.se/

På mobilen kan du lägga den på hemskärmen: *Dela → Lägg till på hemskärmen* i Safari, eller *Installera app* i Chrome. Den fungerar sedan även utan nät.

## Funktioner

- **Upplägg:** elva program att söka bland, bland annat Push/Pull/Legs, Helkropp, Över/Underkropp, Calisthenics, Styrka 5×5, Styrkelyft, Arnold split, Hemma med hantlar och Rumpa & ben. Välj 1–7 pass i veckan, i ordning valfria dagar eller på fasta veckodagar.
- **Övningar:** drygt 45 övningar, var och en med en illustration och tips (animerad när du öppnar övningen). Förifyllt per upplägg, sökbart och utbytbart, med egna set och reps.
- **Under passet:** Träna visar passet med en rad per övning (mål och set klara); ett tryck öppnar fokusläget på den övningen. Fokusläget har en övning i taget, stora − och +-knappar för vikt och reps, förra gångens resultat på varje set och skärmen tänd så länge passet pågår. Bocka av ett set så startar vilotimern, och när övningen är klar visas nästa. Kroppsviktsövningar loggas i reps eller sekunder med valfri extra vikt. Flera pass samma dag går bra.
- **Utveckling:** förslag på vikt och reps för varje övning utifrån förra gången, besked när du slår PB och en graf per övning.
- **Historik:** en kalender med alla pass och dagar då alla dailys gjorts. Tryck på en dag för att ändra den: bocka dailys och väg dig i efterhand, eller öppna Träna eller Kost för den dagen och logga ett pass eller mat du glömt. Under kalendern jämförs veckan med veckan innan: bästa set per övning med + eller −, samt pass, dailys, löpning, kalorier och veckobrevet.
- **Dailys:** egna övningar, löpning eller promenad att bocka av direkt på Hem, med streaks och påminnelse i kalendern.
- **Vänner:** lägg till varandra med en vänkod eller länk, se när vänner kört ett pass och peppa dem 👏. Bara att ett pass är gjort delas – aldrig vikter, mat eller kroppsvikt – och delningen går att stänga av.
- **Fyra flikar:** Hem, Träna (med kommande pass), Kost och Historik. Profil och inställningar nås via kugghjulet.
- **Kost:** kalorimål och makron från ålder, längd, vikt, aktivitet och mål. Skriv vad du åt i fritext, till exempel "2 dl mjölk och 1 banan", så räknas kalorier, protein, fett och fibrer ut från drygt 2 800 livsmedel och rätter. Medan du skriver föreslår appen träffar, och felstavningar som "kottbullar" hittar rätt. Sidan visar en ruta per måltid (frukost, lunch, mellanmål, middag); *+ Lägg till* öppnar sök och snabbval för just den måltiden. Mängden styr: varje livsmedel får antal, gram, dl eller portioner som går att ändra, och kalorier och protein räknas fram. Favoriter, egna måltider och det du ätit nyligen ligger som snabbval, och samma snabbval två gånger blir två stycken. En måltid kan upprepas från förra gången med ett tryck, och flera saker kan sparas som en måltid. Logga även en måltid med ungefärliga kalorier eller skanna streckkoden på en vara.

### Märkesvaror

Matsökningen innehåller även en lokal startkatalog med 273 märkesvaror från 121 märken, inklusive 85 från Felix. Urvalet omfattar flera matkategorier: färdigrätter, mejeri, bröd, drycker, snacks, proteinprodukter och skafferivaror. Det är ett starturval, inte alla produkter på den svenska marknaden.

Skriv exempelvis `Felix paj` och välj en produkt. Namn, märke och förpackningsstorlek hjälper till att skilja träffarna åt. Ange gram eller ml, eller välj **förpackning** när vikten/volymen är känd. En förpackning antas inte vara en portion, och okänd fetthalt eller fiberhalt anges inte som noll.

Knappen **Sök märkesvaror på nätet** söker efter fler produkter hos Open Food Facts. Sökningen görs först när man trycker på knappen. Om tjänsten eller webbläsaren stoppar hämtningen finns en länk som öppnar samma sökning hos Open Food Facts. Den lokala katalogen, favoriter och loggning fungerar även utan nät.

Produktdata kommer från Open Food Facts och är användarbidrag som kan vara äldre än förpackningen. Kontrollera etiketten vid behov. Streckkod, näringsvärden och källans ändringstid sparas med en loggad produkt; en senare kataloguppdatering ändrar inte gamla loggars näringsvärden.

Katalogen kan uppdateras med `python tools/produkter.py --refresh` (ett litet starturval) eller `python tools/produkter.py --input FIL [FIL ...]` för sparade söksvar, JSONL eller Open Food Facts TSV-export. Stora datamängder ska hämtas som export. Importören skriver först en temporär fil och ersätter inte katalogen med ett tomt eller felaktigt svar.

### Restaurangmat

Katalogen innehåller 180 produkter och storlekar från McDonald’s Sverige, hämtade från deras officiella näringskalkylator. Sök exempelvis `big mac`, `donken pommes` eller `mcdonalds nuggets`. Näringsvärdena gäller en standardportion av vald produkt och storlek. Ange antal portioner; okänd portionsvikt omvandlas inte till gram eller ml. Lägg till burgare, pommes och dryck separat för en hel meny.

Källa och kontrolldatum sparas med loggningen. Restaurangdata ligger separat i `restauranger.json` och uppdateras med `python tools/mcdonalds.py`. Den lokala katalogen fungerar även utan nät.

## Data och integritet

Utan konto sparas allt bara i webbläsaren på den enhet du använder. Under *Profil → Data* kan du exportera en säkerhetskopia och importera den på en annan enhet.

Vid utloggning stängs den aktiva loggen. En lokal säkerhetskopia sparas separat för kontot och öppnas vid nästa inloggning med samma konto, så att ett annat konto på enheten inte får dina loggar.

Med konto (*Profil → Konto*, inloggning med e-post utan lösenord) sparas inställningar och logg även i en Supabase-databas, så att inget försvinner och samma data finns på alla dina enheter. Varje användare kan bara läsa och ändra sina egna rader. E-postadressen används bara för att logga in, aldrig för reklam eller utskick.

Streckkodsskannern och märkesvarusökningen hämtar produktdata från [Open Food Facts](https://world.openfoodfacts.org). Den separata [produktkatalogen](produkter.json) och ändringar av dess data delas under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Den innehåller inte privata loggar. Kameran används bara medan skannern är öppen.

Kalorivärden och kalorimål är uppskattningar och ersätter inte råd från vården.

Näringsvärden kommer delvis från [Livsmedelsverkets livsmedelsdatabas](https://www.livsmedelsverket.se/livsmedelsdatabasen), licens CC BY 4.0.

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Sidan och stilarna |
| `app.js` | Appen: upplägg, pass, dailys, Hem, Profil, synk och händelser |
| `fokus.js`, `kost.js`, `historik.js` | Fokusläget och passlistan, Kost med recept, Historik och Utveckling |
| `aktivitet.js`, `social.js`, `notiser.js` | Aktiviteter (padel, vandring …), vänner och notiser |
| `konto.js`, `vila.js`, `skanner.js` | Konto via Supabase och Tyck till, vilotimern, streckkodsskannern |
| `ovningar.js` | Övningsbiblioteket med instruktioner och poser |
| `figur.js` | Ritar de animerade övningsbilderna som SVG |
| `produkter.js`, `produkter.json` | Märkesvaror: normalisering, lokal ODbL-katalog och uttrycklig nätsökning. Import: `tools/produkter.py`. |
| `mat.js` | Egna livsmedel med portionsstorlekar, tolkning av fritext, förslag och felstavning |
| `livsmedel.js` | Livsmedelsverkets livsmedelsdatabas (namn, kcal, protein, fett och fibrer per 100 g); laddas efter appen. Byggs om med `python3 tools/livsmedel.py` |
| `config.js` | Supabase-projektets adress, publika nyckel och publika nyckel för notiser |
| `supabase/` | SQL för tabeller och funktioner, och Edge Function `driv-push` som skickar notiser |
| `supabase/schema.sql` | Tabell och åtkomstregler i Supabase |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation på hemskärmen och offlinestöd |

## Slå på konton (Supabase)

1. Skapa ett gratis projekt på [supabase.com](https://supabase.com).
2. Öppna *SQL Editor*, klistra in innehållet i [`supabase/schema.sql`](supabase/schema.sql) och kör det.
3. Under *Authentication → URL Configuration*: sätt *Site URL* till appens adress, till exempel `https://driv.driveify.se/`, och lägg till samma adress under *Redirect URLs*.
4. Under *Authentication → Email Templates → Magic Link*: klistra in `supabase/mejl-inloggning.html` (ämne: Din inloggningskod till Driv). Mejlet har koden `{{ .Token }}` att skriva in i appen. Det behövs i en installerad app på iPhone, där länken öppnas i webbläsaren i stället för i appen.
5. Fyll i *Project URL* och *anon public key* (under *Project Settings → API*) i [`config.js`](config.js).

### Vänner

Kör även [`supabase/vanner.sql`](supabase/vanner.sql) i SQL Editor. Den skapar tabellerna för profiler, vänner, delade pass och peppningar, samt funktionerna appen använder. Tabellerna kan inte läsas direkt; funktionerna kontrollerar själva vem som frågar. Där finns också funktionen som raderar ett konto med allt som hör till det. Kör filen igen när den ändrats; den kan köras flera gånger. Vännernas veckosiffror och senaste pass kommer därifrån, med äldre funktioner räknas de ur flödet i stället.

## Tester

Webbläsartesterna i [`tests/`](tests) går igenom upplägg, pass och veckojämförelse, dagens mål, vilotimer, dailys, vikt, påminnelser, kost, streckkod, lagring, synk mellan enheter och start utan nät. Externa tjänster (Supabase, Open Food Facts) simuleras. De körs automatiskt i GitHub vid varje push, och lokalt med:

```bash
pip install -r tests/requirements.txt
python -m playwright install chromium
PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 python -m pytest tests
```

## Ny version

Appen startar från filer som service workern (`sw.js`) har sparat. När filerna ändras måste versionen i `sw.js` uppdateras, annars får användarna inte den nya versionen. Kör:

```bash
python tools/sw-version.py
```

Testerna larmar om versionen inte stämmer med filerna.

## Design

Färgerna ligger som variabler överst i `index.html`, för ljust och mörkt läge. Text och knappar har egna, mörkare toner (`--accent-strong`, `--accent-text`, `--ok-text`, `--bad-text`, `--on-color`) så att kontrasten når WCAG AA (4,5:1); `--accent` och `--ok` används för staplar, prickar och ramar. `tests/test_design.py` går igenom all synlig text i varje vy och fönster i båda lägena och kontrollerar kontrasten, och att inget sticker ut utanför skärmen i 320 och 390 px bredd.

## Publicera

Appen är statiska filer. Med GitHub Pages: *Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`*.
