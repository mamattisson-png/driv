// Edge Function driv-push: skickar Drivs notiser. Körs var tionde minut av pg_cron (se notiser.sql).
// 1. Daglig påminnelse vid den tid användaren valt, bara när något återstår: ett pass som står på
//    schemat (eller som behövs för veckans mål) och dailys som inte är gjorda.
// 2. Peppningar från vänner, som ligger i kön driv_push_queue.
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY och CRON_SECRET. SUPABASE_URL och
// SUPABASE_SERVICE_ROLE_KEY finns redan i alla Edge Functions.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { dailyMessage, shift } from "./regler.js";

const env = (k: string) => Deno.env.get(k) ?? "";
webpush.setVapidDetails("mailto:driv@driveify.se", env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

type Sub = { endpoint: string; user_id: string; p256dh: string; auth: string; tz: string; remind_time: string; remind: boolean; kudos: boolean; last_daily: string | null };

// Datum (ÅÅÅÅ-MM-DD), klockslag (TT:MM) och veckodag (måndag = 0) i användarens tidszon
function localNow(tz: string) {
  const now = new Date();
  let zone = tz;
  try { new Intl.DateTimeFormat("sv-SE", { timeZone: tz }); } catch { zone = "Europe/Stockholm"; }
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const time = new Intl.DateTimeFormat("sv-SE", { timeZone: zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  const wd = (new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7;
  return { date, time, wd };
}

async function userState(userId: string, date: string) {
  const months = [...new Set([shift(date, -7).slice(0, 7), date.slice(0, 7)])].map(m => "m-" + m);
  const { data } = await db.from("driv_docs").select("id, data").eq("user_id", userId).in("id", ["settings", ...months]);
  const docs = Object.fromEntries((data ?? []).map(r => [r.id, r.data]));
  const log: Record<string, any> = {};
  for (const m of months) Object.assign(log, (docs[m] && docs[m].days) || {});
  return { s: docs.settings, log };
}

async function send(sub: Sub, msg: { title: string; body: string }) {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ ...msg, url: "/" }), { TTL: 3600 });
    return true;
  } catch (e: any) {
    // Telefonen har slutat prenumerera: ta bort den
    if (e && (e.statusCode === 404 || e.statusCode === 410)) await db.from("driv_push").delete().eq("endpoint", sub.endpoint);
    return false;
  }
}

// Mellanslag, radbrytningar och citattecken runt hemligheten räknas inte (vanligt vid inklistring)
const clean = (v: string | null) => (v ?? "").trim().replace(/^["']+|["']+$/g, "").trim();

Deno.serve(async req => {
  const want = clean(env("CRON_SECRET")), got = clean(req.headers.get("x-driv-cron"));
  // Felet säger vad som saknas eller skiljer, men aldrig själva hemligheten
  if (!want) return new Response("Nej: CRON_SECRET saknas bland funktionens Secrets", { status: 401 });
  if (!got) return new Response("Nej: anropet saknar headern x-driv-cron", { status: 401 });
  if (got !== want) return new Response(`Nej: fel hemlighet (${got.length} tecken skickades, ${want.length} väntades)`, { status: 401 });
  const { data: subs } = await db.from("driv_push").select("*");
  let daily = 0, kudos = 0;
  for (const sub of (subs ?? []) as Sub[]) {
    if (!sub.remind) continue;
    const { date, time, wd } = localNow(sub.tz);
    if (time < sub.remind_time || sub.last_daily === date) continue;
    await db.from("driv_push").update({ last_daily: date }).eq("endpoint", sub.endpoint);
    const { s, log } = await userState(sub.user_id, date);
    const msg = dailyMessage(s, log, date, wd);
    if (msg && await send(sub, msg)) daily++;
  }
  // Peppningar: bara det senaste dygnet, så att gamla inte skickas om någon slår på notiser senare
  const since = new Date(Date.now() - 86400000).toISOString();
  const { data: queue } = await db.from("driv_push_queue").select("*").is("sent_at", null).gte("created_at", since).limit(200);
  for (const q of queue ?? []) {
    for (const sub of ((subs ?? []) as Sub[]).filter(x => x.user_id === q.user_id && x.kudos)) if (await send(sub, q)) kudos++;
    await db.from("driv_push_queue").update({ sent_at: new Date().toISOString() }).eq("id", q.id);
  }
  return Response.json({ daily, kudos });
});
