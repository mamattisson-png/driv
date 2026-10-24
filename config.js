"use strict";
// Inställningar för den publika versionen. Fyll i Supabase-projektets adress och publika nyckel
// (Project Settings → API) för att slå på konton. Den publika nyckeln får ligga här: tabellen
// skyddas av radnivåsäkerhet så att varje användare bara når sina egna rader.
window.DRIV_CONFIG = {
  supabaseUrl: "https://zepugwoostphckstyrqf.supabase.co",
  supabaseAnonKey: "sb_publishable_CrXRGbR383ujiIptdZrhdQ_1gUNckS8",
  // Publik nyckel för notiser (Web Push). Den privata halvan finns bara bland Supabase-funktionens secrets.
  vapidPublicKey: "BHM13dgfWzzKV4NL9-b37Q0bkn2xOHwGUU6UYkGpbs1OdH1btJsNwBNQZI2-5Fv7uNDZyH7Knp2fYL5kDlRtzuA",
};
