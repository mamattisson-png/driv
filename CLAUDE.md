# Driv – arbetsregler

- Inför större förändringar (ny design av en vy, omskrivningar, ny datastruktur): spara en kopia av nuvarande version
  innan main ändras: en gren `kopia/ÅÅÅÅ-MM-DD-<kort namn>` på den commit som ligger ute, pushad till GitHub.
  (Taggar går inte att pusha från molnmiljön, därför grenar.) Att gå tillbaka: återställ main till kopians innehåll
  med en vanlig commit, aldrig force-push.
- Visuella förändringar byggs på en egen gren; skicka skärmdumpar och vänta på "kör" innan main ändras.
- Kör `python3 tools/sw-version.py` efter varje ändring av appens filer, och testerna
  (`CHROMIUM_PATH=/opt/pw-browsers/chromium python3 -m pytest tests -q`) före push.
- main publiceras direkt till https://driv.driveify.se (GitHub Pages).
