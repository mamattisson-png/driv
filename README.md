<img src="icons/icon-192.png" alt="Driv" width="96">

# Driv

**Hitta ditt driv.** Träning, dailys och kost i en app, med plus eller minus mot förra veckan så att du ser att du blir bättre. Inga konton och inga beroenden: allt sparas i din webbläsare.

**Öppna appen:** https://mamattisson-png.github.io/driv/

På mobilen kan du lägga den på hemskärmen: *Dela → Lägg till på hemskärmen* i Safari, eller *Installera app* i Chrome. Den fungerar sedan även utan nät.

## Funktioner

- **Upplägg:** tio program att söka bland, bland annat Push/Pull/Legs, Helkropp, Över/Underkropp, Calisthenics, Styrka 5×5, Styrkelyft, Arnold split, Hemma med hantlar och Rumpa & ben. Välj 2–6 pass i veckan, i ordning valfria dagar eller på fasta veckodagar.
- **Övningar:** drygt 45 övningar, var och en med en animerad illustration och tips. Förifyllt per upplägg, sökbart och utbytbart, med egna set och reps.
- **Under passet:** logga vikt och reps per set, eller reps/sekunder och valfri extra vikt för kroppsviktsövningar. Bocka av set eller hela övningen; tomma fält får förra gångens värden.
- **Slå förra veckan:** dagens mål på varje övning, besked när du slår pers, hur många övningar som gått upp den här veckan och en graf per övning.
- **Vecka för vecka:** bästa set per övning jämfört med förra veckan, med + eller −, samt pass, dailys, löpning och kalorier.
- **Dailys:** egna övningar, löpning eller promenad att bocka av varje dag, med streaks och påminnelse i kalendern.
- **Kost:** kalorimål och makron från ålder, längd, vikt, aktivitet och mål. Skriv vad du åt i fritext, till exempel "2 dl mjölk och 1 banan", så räknas kalorier och protein ut från drygt 2 800 livsmedel och rätter. Medan du skriver föreslår appen träffar, och felstavningar som "kottbullar" hittar rätt. Logga även en måltid med ungefärliga kalorier, välj bland det du ätit tidigare eller skanna streckkoden på en vara.

## Data och integritet

Utan konto sparas allt bara i webbläsaren på den enhet du använder. Under *Profil → Data* kan du exportera en säkerhetskopia och importera den på en annan enhet.

Med konto (*Profil → Konto*, inloggning med e-post utan lösenord) sparas inställningar och logg även i en Supabase-databas, så att inget försvinner och samma data finns på alla dina enheter. Varje användare kan bara läsa och ändra sina egna rader.

Streckkodsskannern hämtar produktdata från [Open Food Facts](https://world.openfoodfacts.org) (ODbL). Kameran används bara medan skannern är öppen.

Kalorivärden och kalorimål är uppskattningar och ersätter inte råd från vården.

Näringsvärden kommer delvis från [Livsmedelsverkets livsmedelsdatabas](https://www.livsmedelsverket.se/livsmedelsdatabasen), licens CC BY 4.0.

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Sidan och stilarna |
| `app.js` | Appen: upplägg, pass, dailys, kost, veckovy och lagring |
| `ovningar.js` | Övningsbiblioteket med instruktioner och poser |
| `figur.js` | Ritar de animerade övningsbilderna som SVG |
| `mat.js` | Egna livsmedel med portionsstorlekar, tolkning av fritext, förslag och felstavning |
| `livsmedel.js` | Livsmedelsverkets livsmedelsdatabas (namn, kcal och protein per 100 g) |
| `config.js` | Supabase-projektets adress och publika nyckel |
| `supabase/schema.sql` | Tabell och åtkomstregler i Supabase |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation på hemskärmen och offlinestöd |

## Slå på konton (Supabase)

1. Skapa ett gratis projekt på [supabase.com](https://supabase.com).
2. Öppna *SQL Editor*, klistra in innehållet i [`supabase/schema.sql`](supabase/schema.sql) och kör det.
3. Under *Authentication → URL Configuration*: sätt *Site URL* till appens adress, till exempel `https://mamattisson-png.github.io/driv/`, och lägg till samma adress under *Redirect URLs*.
4. Under *Authentication → Email Templates → Magic Link*: lägg till `{{ .Token }}` i mejlet, så får användaren en kod att skriva in i appen. Det behövs i en installerad app på iPhone, där länken öppnas i webbläsaren i stället för i appen.
5. Fyll i *Project URL* och *anon public key* (under *Project Settings → API*) i [`config.js`](config.js).

## Publicera

Appen är statiska filer. Med GitHub Pages: *Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`*.
