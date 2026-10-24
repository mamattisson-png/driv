// Reglerna för den dagliga påminnelsen, i vanlig JavaScript så att appens tester kan köra dem.
export const shift = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

// Samma regler som appen: ett pass är gjort när det sparats eller har avbockade set
export function dailyMessage(s, log, date, wd) {
  if (!s || !s.plan) return null;
  const today = log[date] || { workouts: [], dailies: {} };
  const did = (w) => w.done || Object.values(w.sets || {}).some((a) => (a || []).some((x) => x && x.ok));
  const trained = (today.workouts || []).some(did);
  let week = 0;
  for (let i = 0; i <= wd; i++) week += ((log[shift(date, i - wd)] || {}).workouts || []).filter((w) => w.done).length;
  const plan = s.plan, fixed = plan.mode === "fixed";
  const due = !trained && (fixed ? (plan.weekdays || []).includes(wd) : week < plan.count);
  const dailyDone = (id) => { const v = (today.dailies || {})[id]; return v === true || !!(v && (v.km || v.min)); };
  const daily = s.daily || [], left = daily.filter((e) => !dailyDone(e.id)).length;
  const dailyText = left ? `${left} av ${daily.length} dailys kvar idag.` : "";
  if (due) {
    const day = fixed ? plan.days[(plan.weekdays || []).indexOf(wd)] : null;
    return { title: "Dags att träna 💪", body: [fixed && day ? `${day.name} står på schemat idag.` : `${week} av ${plan.count} pass den här veckan.`, dailyText].filter(Boolean).join(" ") };
  }
  if (left) return { title: "Dailys kvar ✓", body: dailyText };
  return null;
}

