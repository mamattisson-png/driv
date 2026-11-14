# Slå på inloggning med Google, Microsoft och Facebook

Inloggningssidan har knappar för Google, Microsoft och Facebook. Varje knapp fungerar när tjänsten är påslagen i Supabase.
Tills dess får man ett vänligt besked och kan logga in med e-postkoden som vanligt. Samma e-post ger samma konto.

Gemensamt för alla tre:
- Omdirigeringsadress (redirect/callback URI): `https://zepugwoostphckstyrqf.supabase.co/auth/v1/callback`
- I Supabase → **Authentication → URL Configuration**: Site URL `https://driv.driveify.se`, och under Redirect URLs `https://driv.driveify.se/**` (och `https://*.driv-test.pages.dev/**` för förhandsvisningar).
- Hemligheter (client secret / app secret) klistras bara in i Supabase, aldrig i appen eller i en chatt.

## Google (gratis)
1. https://console.cloud.google.com/ → skapa projekt "Driv".
2. **APIs & Services → OAuth consent screen**: External, appnamn Driv, support-e-post, domän `driveify.se`, länk till integritetssidan `https://driv.driveify.se/integritet.html`. Publicera (In production).
3. **Credentials → Create credentials → OAuth client ID**: Web application. JavaScript origin `https://driv.driveify.se`, redirect URI enligt ovan.
4. Supabase → **Authentication → Sign In / Providers → Google**: slå på, klistra in Client ID och Client secret.

## Microsoft (gratis)
1. https://portal.azure.com/ → **Microsoft Entra ID → App registrations → New registration**.
   - Namn: Driv
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts** (så att Outlook/Hotmail fungerar)
   - Redirect URI: Web, adressen ovan
2. Kopiera **Application (client) ID**.
3. **Certificates & secrets → New client secret** → kopiera *Value* (syns bara en gång).
4. Supabase → **Providers → Azure**: slå på, klistra in Client ID och secret-värdet. Lämna Azure Tenant URL tom (då fungerar personliga konton).

## Facebook (gratis)
1. https://developers.facebook.com/ → **My Apps → Create app** → användningsfall *Authenticate and request data from users with Facebook Login*.
2. **Facebook Login → Settings**: Valid OAuth Redirect URIs = adressen ovan.
3. **App settings → Basic**:
   - App domains: `driveify.se`
   - Privacy policy URL: `https://driv.driveify.se/integritet.html`
   - User data deletion: Instructions URL `https://driv.driveify.se/integritet.html#radera`
4. Slå appen till **Live** (överst i Meta-panelen).
5. Kopiera **App ID** och **App secret** till Supabase → **Providers → Facebook**, slå på.

## Bra att veta
- På iPhone med appen på hemskärmen kan inloggningen öppnas i Safari. Logga då in med e-postkoden i appen i stället.
- Läs igenom `integritet.html` innan Facebook slås på; Meta granskar att sidan finns.
