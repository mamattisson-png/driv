# DRIV – Kommande förbättringar

Senast uppdaterad: 2026-10-29. Källa: gemensam förbättringslista i ChatGPT. Denna fil är en planeringslista, inte en bekräftelse på att funktioner har implementerats. Status 1–3 har markerats klara av användaren.

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

## Arbetsregler

- Ändra inte appens implementation utan användarens uttryckliga godkännande.
- Bevara befintlig design, DRIV-logga och övningsfigurer om inte annan ändring godkänns.
- Undvik dubbla funktioner: kontrollera befintlig kod innan nyutveckling.
- Uppdatera status här när användaren bekräftar framsteg.
