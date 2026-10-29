# Publicera DRIV Test med Cloudflare Pages

Använd ett **separat** Cloudflare Pages-projekt. Ändra inte DNS eller Pages-projektet för `driv.driveify.se`.

1. Gå till Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Välj GitHub-repot `mamattisson-png/driv` och skapa ett nytt projekt, exempelvis `driv-test`.
3. Production branch: `main`.
4. Framework preset: `None`.
5. Build command: `node tools/build-staging.cjs`.
6. Build output directory: `dist-staging`.
7. Environment variables (Production): `DRIV_TEST_PUBLISHABLE_KEY` = **Publishable key** från Supabase-projektet DRIV Test. Lägg in den via Cloudflares miljövariabler; den behöver inte kopieras till källkoden.
8. Deploy. Öppna adressen som Cloudflare ger projektet (namnet `driv-test.pages.dev` är bara ett exempel och kan vara upptaget).

**Säkerhet:** Byggskriptet skapar en separat `config.js` med URL för DRIV Test (`ujnfbjisrhudvnzvmniq`), inte produktion (`zepugwoostphckstyrqf`). Använd aldrig service-role/secret key i klienten. Supabase Publishable key är avsedd för klienten, men RLS måste fortfarande skydda varje rad.

**Obs:** `?test` i appen är ett separat lokalt läge som stänger av Supabase-synk. Testa den publicerade staging-adressen **utan** `?test`.

**Verifiering efter deploy:** Kontrollera att sidan laddas och att testkonto kan logga in, skapa ett set, ladda om och se samma set. Kör därefter tvåklient- och offlinetesterna i `docs/testmiljo.md`.

Om Cloudflare rapporterar byggfel, öppna Deployments → senaste deployment → Build log och dela felraden.
