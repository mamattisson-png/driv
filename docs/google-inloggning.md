# Slå på inloggning med Google

Appen har knappen "Fortsätt med Google". Den fungerar när Google är påslaget i Supabase. Tills dess får man ett vänligt besked och kan logga in med e-post som vanligt.

## 1. Google Cloud (gratis)
1. Gå till https://console.cloud.google.com/ och skapa ett projekt, t.ex. "Driv".
2. **APIs & Services → OAuth consent screen**: välj *External*, fyll i appnamn (Driv), support-e-post och logga om du vill. Lägg till domänen `driveify.se`. Publicera (status *In production*).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: *Web application*
   - Authorized JavaScript origins: `https://driv.driveify.se`
   - Authorized redirect URIs: `https://zepugwoostphckstyrqf.supabase.co/auth/v1/callback`
4. Kopiera **Client ID** och **Client secret**.

## 2. Supabase
1. **Authentication → Sign In / Providers → Google**: slå på, klistra in Client ID och Client secret, spara.
2. **Authentication → URL Configuration**:
   - Site URL: `https://driv.driveify.se`
   - Redirect URLs: lägg till `https://driv.driveify.se/**` och, för förhandsvisningar, `https://*.driv-test.pages.dev/**`

Client secret är hemlig: den klistras bara in i Supabase, aldrig i appen eller i en chatt.

## Bra att veta
- Samma e-post som tidigare (kod via e-post) ger samma konto: Supabase kopplar ihop dem.
- På iPhone med appen på hemskärmen kan Google-inloggningen öppnas i Safari. Logga då in med e-postkoden i appen i stället.
