<img src="icons/icon-192.png" alt="Driv" width="96">

# Driv

**Hitta ditt driv.** Träning, dailys och kost i en app, med plus eller minus mot förra veckan så att du ser att du blir bättre. Inga konton och inga beroenden: allt sparas i din webbläsare.

**Öppna appen:** https://mamattisson-png.github.io/driv/

På mobilen kan du lägga den på hemskärmen: *Dela → Lägg till på hemskärmen* i Safari, eller *Installera app* i Chrome. Den fungerar sedan även utan nät.

## Funktioner

- **Upplägg:** tio program att söka bland, bland annat Push/Pull/Legs, Helkropp, Över/Underkropp, Calisthenics, Styrka 5×5, Styrkelyft, Arnold split, Hemma med hantlar och Rumpa & ben. Välj 2–6 pass i veckan, i ordning valfria dagar eller på fasta veckodagar.
- **Övningar:** drygt 45 övningar, var och en med en animerad illustration och tips. Förifyllt per upplägg, sökbart och utbytbart, med egna set och reps.
- **Under passet:** logga vikt och reps per set, eller reps/sekunder och valfri extra vikt för kroppsviktsövningar. Bocka av set eller hela övningen; tomma fält får förra gångens värden.
- **Vecka för vecka:** bästa set per övning jämfört med förra veckan, med + eller −, samt pass, dailys, löpning och kalorier.
- **Dailys:** egna övningar, löpning eller promenad att bocka av varje dag, med streaks.
- **Kost:** kalorimål och makron från ålder, längd, vikt, aktivitet och mål. Skriv vad du åt i fritext, till exempel "2 dl mjölk och 1 banan", så räknas kalorier och protein ut från drygt 260 livsmedel och rätter. Logga även en måltid med ungefärliga kalorier eller välj bland det du ätit tidigare.

## Data och integritet

Allt du loggar sparas bara i webbläsaren på den enhet du använder. Inget skickas till någon server. Under *Profil → Data* kan du exportera en säkerhetskopia och importera den på en annan enhet.

Kalorivärden och kalorimål är uppskattningar och ersätter inte råd från vården.

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Sidan och stilarna |
| `app.js` | Appen: upplägg, pass, dailys, kost, veckovy och lagring |
| `ovningar.js` | Övningsbiblioteket med instruktioner och poser |
| `figur.js` | Ritar de animerade övningsbilderna som SVG |
| `mat.js` | Livsmedelstabellen och tolkningen av fritext |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation på hemskärmen och offlinestöd |

## Publicera

Appen är statiska filer. Med GitHub Pages: *Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`*.
