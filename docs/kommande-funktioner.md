# Kommande funktioner

Inställningar → Appen → Kommande funktioner visar en gemensam lista, även utan konto. Användarna kan läsa listan; den ingår inte i personlig träningsdata eller kontosynk.

Ändra `UPCOMING_FEATURES` i `kommande.js` för att lägga till, uppdatera eller ta bort en punkt. Varje punkt har `title`, `description` och `status`:

- `idea`: Idé
- `planned`: Planerat
- `working`: Under arbete

Lägg bara till överenskomna funktioner och ange inte ett lanseringsdatum utan beslut. Ta bort punkten när funktionen är lanserad. Kör `python tools/sw-version.py` och testerna före publicering. Listan följer appens vanliga uppdatering och fungerar offline.

Första punkten är den tidigare diskuterade Stretch guiden. Själva guiden implementeras separat av Claude.
