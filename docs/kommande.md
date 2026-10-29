# DRIV – Kommande förbättringar

Senast uppdaterad: 2026-10-30. Källa: gemensam förbättringslista i ChatGPT. Denna fil är en planeringslista, inte en bekräftelse på att funktioner har implementerats. Status 1–3 har markerats klara av användaren. Punkt 17 är färdigställd och godkänd för publicering.

| Nr | Förbättring | Kategori | Prioritet | Status |
|---|---|---|---|---|
| 1 | Nästa set-knappen alltid synlig | Bugg | Hög | Klar |
| 2 | Kompaktare avslutade set | Träning | Hög | Klar |
| 3 | Skalbar träningsvy | Träning | Hög | Klar |
| 4 | Facelift av hemskärmen | Design | Hög | Väntar på Claude |
| 5 | Tillskott och hälsorutiner i Dailys | Dailys | Medel | Ej påbörjad |
| 6 | Interaktiv stretchguide | Dailys | Medel | Ej påbörjad |
| 7 | Tydligare övningsfigurer och animationer | Design | Hög | Ej påbörjad |
| 8 | Smart grönmarkering av måltider | Kost | Medel | Ej påbörjad |
| 9 | Tydligare avklarade aktiviteter | Design | Hög | Ej påbörjad |
| 10 | Körbara tränings-Dailys | Dailys | Hög | Ej påbörjad |
| 11 | Frivillig appguide | Ny funktion | Medel | Ej påbörjad |
| 12 | Enhetlig profil- och inställningsikon | Design | Medel | Ej påbörjad |
| 13 | Färdigställ uppvärmningsset | Träning | Medel | Ej påbörjad |
| 14 | Lägg till övning under pågående pass | Träning | Hög | Ej påbörjad |
| 15 | Tydligare Historik och Utveckling | Historik | Hög | Ej påbörjad |
| 16 | Numeriskt tangentbord för alla sifferfält | UX | Hög | Under arbete |
| 17 | Ingen inloggningsblinkning vid uppdatering | Bugg | Hög | Klar |
| 18 | Sista steget i Kom igång: konto eller fortsätt utan | Onboarding | Hög | Ej påbörjad |
| 19 | Tydligare e-postadress när inloggningskod inväntas | Konto | Medel | Klar |
| 20 | Enhetliga DRIV-mejl med kod, länk och original-logga | Konto | Hög | Påbörjad |
| 21 | Bekräfta viktinmatning med OK istället för att avsluta set | Träning | Hög | Ej påbörjad |
| 22 | Tydlig återkoppling när set avslutas och nästa öppnas | Träning | Hög | Ej påbörjad |
| 23 | Spara genomfört pass som namngiven passmall | Träning | Hög | Ej påbörjad |

## Detaljer och acceptanskriterier

1. **Nästa set-knappen alltid synlig (Klar enligt användaren):** Knappen får aldrig döljas bakom nedre navigationsfältet.
2. **Kompaktare avslutade set (Klar enligt användaren):** Visa avklarade set kompakt och behåll alla befintliga övningsikoner upptill. Inga nya gröna knappar.
3. **Skalbar träningsvy (Klar enligt användaren):** Även långa pass, exempelvis tio set, ska visa nödvändiga kontroller.
4. **Facelift av hemskärmen:** Förenkla och förtydliga enligt tidigare designplan. Bevara DRIV-logga och befintliga övningsfigurer. Väntar på Claude-krediter.
5. **Tillskott och hälsorutiner i Dailys:** Kreatin, vitaminer, omega-3, vatten och egna återkommande vanor. Separera från träningsövningar.
6. **Interaktiv stretchguide:** Välj stel kroppsdel, få relevanta övningar med demonstration och möjlighet att lägga till i Dailys eller pass.
7. **Tydligare övningsfigurer och animationer:** Förbättra befintlig stil, liten ikon och förstorat läge, i både ljust och mörkt tema. Ändra inte loggan.
8. **Smart grönmarkering av måltider:** Markera måltider när rekommenderat kalorimål nåtts. Om totalt dagsmål nås kan registrerade måltider markeras gröna trots annan fördelning.
9. **Tydligare avklarade aktiviteter:** Grön check eller annan diskret, tydlig återkoppling för genomförda träningspass och Dailys.
10. **Körbara tränings-Dailys:** Exempel plankan 3×45 s med timer, vila, nästa set och automatiskt avslut; använd befintlig träningslogik där möjligt.
11. **Frivillig appguide:** Startas via info-knapp, visar verkliga UI-element, kan avslutas och startas om. Aldrig obligatorisk vid första besöket.
12. **Enhetlig profil- och inställningsikon:** Samma ikon, placering och beteende på Hem och Historik; föredra initialavatar.
13. **Färdigställ uppvärmningsset:** Det finns delar av kod/styling men ingen verifierad väg att lägga till dem. Lägg till valfria uppvärmningsset per övning, egna kg/reps, separerade från arbetsset, rekord och träningsvolym. Testa hela flödet innan markering som klar.
14. **Lägg till övning under pågående pass:** Visa diskret '+ Övning' i befintlig knapprad. Välj befintlig eller skapa egen, ange set/reps och lägg till i passet och övningsikonerna. Välj om ändringen endast gäller dagens session (standard) eller sparas i programmet. Pågående set, vila och loggar får inte störas.

15. **Tydligare Historik och Utveckling:** Utveckla befintliga vyer i `historik.js`, utan att skapa parallella system. **Historik:** kalenderdagar ska ge en tydlig, lättläst sammanfattning av genomförda pass (övningar, set, vikter, reps, passlängd när data finns), Dailys och kost; visa personbästa och jämförelse med föregående motsvarande pass, med detaljer vid tryck. **Utveckling:** visa relevanta och begripliga nyckeltal och grafer över styrkeutveckling per övning, träningsfrekvens och kontinuitet, med valbar tidsperiod. Lyft fram verifierade framsteg, till exempel +5 kg i bänkpress eller antal pass under månaden. Bevara kalender, veckojämförelse, befintliga grafer och möjligheten att redigera tidigare dagar. Gör mobilvyn luftig, lätt att skanna och utan onödigt många kort. Hantera saknade data och nya användare korrekt. Granska aktuell implementation och föreslå design innan kodändring.

16. **Numeriskt tangentbord för alla sifferfält:** Gå igenom samtliga fält där användaren anger tal, exempelvis set, reps, sekunder, vikt, kalorier, portioner, kroppsvikt och mål. Visa numeriskt tangentbord på mobil med korrekt `inputmode` (`numeric` för heltal, `decimal` för decimaltal) och lämplig `type`, `step` och validering. Behåll möjlighet att skriva decimaler där det behövs och hantera svensk decimalavskiljare. Undvik att ändra fält för fritext, datum eller annan icke-numerisk information. Testa på Android och iPhone, även i modaler och redigeringsvyer. Bildexempel: redigering av Dailys i Historik öppnar felaktigt ett tangentbord med bokstäver och symboler.

17. **Ingen inloggningsblinkning vid uppdatering**: Appen väntar tills den sparade sessionen och profilen har lästs innan kontoläget visas. Inloggade ska inte tillfälligt få uppmaningen att skapa konto. Vid nätfel behålls lokala loggar utan påstående om utloggning.

18. **Sista steget i Kom igång: konto eller fortsätt utan:** Efter nuvarande steg 3 (Ditt mål), visa ett avslutande steg 4 med två tydliga val: **Skapa konto / Logga in** och **Fortsätt utan konto**. Förklara kort att träningsdata som bara lagras lokalt kan gå förlorad om användaren rensar webbläsardata, byter enhet eller avinstallerar appen. Konto möjliggör säkerhetskopiering/synkronisering när den fungerar. Inloggning ska vara frivillig och inte hindra direkt användning av appen. Bevara ifyllda onboardingval vid båda vägarna. Undvik att lova att data alltid är skyddade och ändra inte befintliga konto- eller synkflöden utan test.\n\n19. **Tydligare e-postadress när inloggningskod inväntas:** Visa den e-postadress som koden skickades till tydligt och beständigt direkt ovanför kodfältet, exempelvis **Kod skickad till: adress@example.com**. Behåll synlig **Byt e-postadress**. Undvik att adressen bara framgår i löpande statusmeddelande eller försvinner vid uppdatering. Testa mobil och dator.\n\n20. **Enhetliga DRIV-mejl:** Granska Supabase Auth-mallarna (Magic Link, bekräftelse, återställning, byte av e-postadress). Visa sexsiffrig kod med `{{ .Token }}` och fungerande länk i relevanta mallar. Återanvänd exakt befintlig DRIV-logga, inte en nyritad variant; loggans offentliga URL måste vara tillgänglig för e-postklienter. Håll utseendet mobilvänligt och använd avsändaren DRIV <noreply@driveify.se>. Testa först med Supabase DRIV Test och Brevo; flytta till produktion endast efter verifiering och uttryckligt godkännande.\n\n21. **OK vid manuell viktinmatning:** När användaren skriver in vikt i ett set och det numeriska tangentbordet är öppet, ska en tydlig **OK**-åtgärd bekräfta värdet och stänga tangentbordet utan att markera setet som färdigt. Knappen **Klar med set** ska inte dominera eller riskera att tryckas av misstag under inmatning. Bevara möjligheten att slutföra set efteråt; kontrollera även andra sifferfält och mobilens tangentbord.\n\n22. **Tydlig övergång till nästa set:** När användaren trycker **Klar med set**, ge omedelbar men diskret visuell återkoppling att setet registrerats (t.ex. kort bockmarkering eller lätt animation) och gör nästa aktiva set tydligt genom mjuk övergång/fokus. Användaren ska direkt förstå att setnumret har ändrats utan att behöva leta. Behåll befintliga övningsikoner högst upp, knapplayout och stöd för supersets; undvik stora popups eller störande animationer. Kontrollera även tillgänglighet och inställning för reducerad rörelse.\n\nPunkt 16: tangentbordsinställningar är införda; kontroll av decimalavskiljare och inmatning av nya repsintervall på Android och iPhone återstår.

23. **Spara genomfört pass som namngiven passmall:** Efter avslutat träningspass erbjud ett diskret frivilligt val **Spara som passmall?** med möjlighet att ange ett eget namn, t.ex. *Jobbet*, *Gymmet* eller *Hemma*. Spara övningar, ordning och relevanta upplägg (set/reps), men inte själva träningsresultatet som ny mall. Gör det möjligt att starta ett nytt pass från en sparad mall, samt byta namn, redigera och ta bort mallar. Användaren ska kunna ha flera varianter beroende på träningsplats och kunna avsluta utan att spara. Kontrollera befintliga pass-/favoritfunktioner innan implementation så att inga dubbla system skapas.\n\n## Arbetsregler

- Ändra inte appens implementation utan användarens uttryckliga godkännande.
- Bevara befintlig design, DRIV-logga och övningsfigurer om inte annan ändring godkänns.
- Undvik dubbla funktioner: kontrollera befintlig kod innan nyutveckling.
- Uppdatera alltid listan när en ändring är klar och publiceras. Markera bara verifierat färdiga punkter som Klar; lägg till en avslutad punkt om ändringen saknas i listan.
