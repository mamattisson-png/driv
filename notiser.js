"use strict";
// ---------- Notiser (Web Push) ----------
// Telefonen prenumererar via webbläsaren och prenumerationen sparas i Supabase (supabase/notiser.sql).
// Edge Function driv-push skickar en daglig påminnelse vid vald tid och en notis när en vän peppar.
// Fungerar på Android och dator, och på iPhone när Driv ligger på hemskärmen.
// Laddas före app.js; anropas först när appen ritas.

const push = { on: false, busy: false, msg: "", checked: false };
const canPush = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!(window.DRIV_CONFIG || {}).vapidPublicKey;
const pushPrefs = () => Object.assign({ time: "18:00", remind: true, kudos: true }, S.push);

function vapidKey() {
  const b64 = window.DRIV_CONFIG.vapidPublicKey.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64 + "=".repeat((4 - b64.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
async function pushSub(create) {
  // ready väntar tills appens service worker är igång; utan den (t.ex. första sekunderna) ges ett tydligt fel
  const reg = await Promise.race([navigator.serviceWorker.ready,
    new Promise((_, no) => setTimeout(() => no(new Error("Appen startar fortfarande. Vänta en stund och försök igen.")), 8000))]);
  const sub = await reg.pushManager.getSubscription();
  return sub || (create ? reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey() }) : null);
}
// Vid start: finns redan en prenumeration på den här enheten?
async function checkPush() {
  if (push.checked || !canPush()) return;
  push.checked = true;
  try { push.on = !!(await pushSub(false)) && Notification.permission === "granted"; } catch (e) { push.on = false; }
  render();
}
async function savePush() {
  const sub = await pushSub(true), j = sub.toJSON(), p = pushPrefs();
  await socialRpc("driv_push_save", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth,
    p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Stockholm", p_time: p.time, p_remind: p.remind, p_kudos: p.kudos });
}
async function setPush(on) {
  push.busy = true; push.msg = ""; render();
  try {
    if (on) {
      if (await Notification.requestPermission() !== "granted") throw new Error("Notiser är blockerade för Driv. Tillåt dem i telefonens eller webbläsarens inställningar.");
      await savePush();
      push.on = true;
    } else {
      const sub = await pushSub(false);
      if (sub) { await socialRpc("driv_push_delete", { p_endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); }
      push.on = false;
    }
  } catch (e) { push.msg = (e && e.message) || "Det gick inte just nu. Försök igen."; }
  push.busy = false;
  render();
}

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
function pushSummary() {
  if (!canPush()) return "Stöds inte här";
  if (account.step !== "in") return "Kräver ett konto";
  return push.on ? `På · kl. ${esc(pushPrefs().time)}` : "Av";
}
function pushBody() {
  if (!canPush()) return `<div class="muted">${isIOS() && !standalone()
    ? "På iPhone fungerar notiser när Driv ligger på hemskärmen: tryck på Dela i Safari och välj Lägg till på hemskärmen. Öppna sedan Driv därifrån."
    : "Den här webbläsaren kan inte ta emot notiser."}</div>`;
  if (account.step !== "in") return `<div class="muted">Notiser kräver ett konto, eftersom de skickas från servern.</div>
    <button class="small" style="margin-top:8px" data-gokonto>Skapa konto eller logga in</button>`;
  const p = pushPrefs();
  // Själva strömbrytaren ligger i raden i Profil
  return `${push.on ? `<div class="pushopts">
      <label class="row"><input type="checkbox" data-pushopt="remind" ${p.remind ? "checked" : ""}><span>Påminn mig om pass och dailys</span></label>
      ${p.remind ? `<label class="field" style="margin:6px 0 0 30px">Klockan<input type="time" id="pushtime" value="${esc(p.time)}"></label>` : ""}
      <label class="row" style="margin-top:8px"><input type="checkbox" data-pushopt="kudos" ${p.kudos ? "checked" : ""}><span>När en vän peppar mitt pass</span></label>
      <div class="muted small" style="margin-top:6px">Påminnelsen kommer bara när något återstår: ett pass som står på tur, eller dailys som inte är gjorda.</div></div>` : `<div class="muted small">Slå på för påminnelser om pass och dailys, och när en vän peppar dig.</div>`}
    ${push.msg ? `<div class="muted small warntext" style="margin-top:6px">${esc(push.msg)}</div>` : ""}`;
}

document.addEventListener("change", ev => {
  const t = ev.target, ds = t.dataset || {};
  if (ds.pushtoggle !== undefined) { setPush(t.checked); return; }
  if (ds.pushopt || t.id === "pushtime") {
    S.push = Object.assign(pushPrefs(), ds.pushopt ? { [ds.pushopt]: t.checked } : { time: t.value || "18:00" });
    save(); render();
    if (push.on) savePush().catch(() => { push.msg = "Kunde inte spara inställningen just nu."; render(); });
  }
});
