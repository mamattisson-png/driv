# Stretch guiden — lämnas till Claude

Användaren vill senare ha en sektion på Hem med namnet **Stretch guiden**. Den ska öppna en kropp med klickbara muskler. Ett muskelval ska visa relevanta stretchövningar som går att lägga till i dailys eller valfritt träningspass. Designen görs separat av Claude enligt användarens uttryckliga instruktion; ingen sådan funktion eller hemskärmssektion ingår i denna ändring.

Det utökade biblioteket laddas i `index.html` efter `ovningar.js`, från `styrka-extra.js` och `stretch-extra.js`. Alla poster finns i vanliga `EX`; nya id:n finns i `EXTRA_STRENGTH_IDS` respektive `EXTRA_STRETCH_IDS`. Stretchposter använder `cat: "stretch"` och `stretchTargets` som beskrivande muskeletiketter för framtida filtrering. Varje post har instruktioner, standardmängd, SVG-pose och MuscleWiki-länk i `MW`. Statiska positioner håller en tid; dynamisk rörlighet använder repetitioner.

Befintlig modell: `exEntry(id)` skapar en post med id/set/reps; `S.daily` innehåller dailys och `S.plan.days[*].ex` passövningar. `exList(target)` används i befintlig väljare; `save()` bevarar och synkar ändringar. Respektera befintliga id:n och loggar. De befintliga kroppsfigurerna för muskelöversikten finns i `app.js` (`FIG_FRONT`, `FIG_BACK`, `muscleFigure`); de är inte en färdig klickbar stretchguide.

Muskelmetadata omfattar också `MUSCLE_GROUPS.insida_lar` för adduktionsövningar; det ändrar inte hemskärmen eller inför någon guide. En del anatomiska små-/vridrörelser visas med startposition eftersom den befintliga figuren inte har oberoende ledrotation för dessa.
