import { useEffect, useState } from "react";
import { CLINIC } from "../config/clinic.js";

// Confirmation screen — Razorpay sends the patient here after paying.
function paymentIdFromUrl() {
  const q = new URLSearchParams(window.location.search);
  for (const [, v] of q) if (/^pay_[A-Za-z0-9]+$/.test(v)) return v;
  return "";
}
const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};
const pad = (n) => String(n).padStart(2, "0");

function calendarLink(b) {
  const [y, m, d] = b.date.split("-");
  const h = b.startHour ?? 10;
  const start = `${y}${m}${d}T${pad(h)}0000`, end = `${y}${m}${d}T${pad(h + 1)}0000`;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `Dr. Borthakur — token ${b.token}`,
    dates: `${start}/${end}`,
    ctz: "Asia/Kolkata",
    location: `${CLINIC.name}, ${b.place}`,
    details: `Token ${b.token}. Bring old prescriptions and reports. Help: WhatsApp ${CLINIC.phone}`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export default function Booked() {
  const pid = paymentIdFromUrl();
  const [b, setB] = useState(null);
  const [err, setErr] = useState(pid ? "" : "We couldn't find your payment ID in the link.");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!pid || b) return;
    let stop = false;
    (async () => {
      try {
        const r = await fetch(`/api/booking?pid=${encodeURIComponent(pid)}`);
        const j = await r.json();
        if (stop) return;
        if (j.ok) return setB(j.booking);
        if (tries < 10) setTimeout(() => setTries((t) => t + 1), 3000);
        else setErr("Your payment is received, but your token is taking longer than usual. Please WhatsApp us your payment ID.");
      } catch {
        if (!stop && tries < 10) setTimeout(() => setTries((t) => t + 1), 3000);
      }
    })();
    return () => { stop = true; };
  }, [pid, tries, b]);

  const wa = (text, to = CLINIC.whatsapp) => `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
  const msg = b && `Online registration — DRB PLUS\nToken: ${b.token}\nName: ${b.name}${b.age ? ` (${b.age})` : ""}\nClinic: ${b.clinic}\nDate: ${b.date}\nPayment ID: ${b.paymentId}`;
  const ok = b && b.status === "Confirmed";

  return (
    <div className="app page">
      <header className="top">
        <img src="/logo-light.png" alt="DRB PLUS" className="logo" />
        <div className="who"><div className="dr">{CLINIC.doctor}</div><div className="sub">{CLINIC.credentials} · Online registration</div></div>
      </header>
      <main className="thread">
        {!b && !err && (
          <div className="card center"><div className="spinner" /><h3>Generating your token…</h3><p className="muted">Payment received. Please keep this page open.</p></div>
        )}
        {err && (
          <div className="card alert"><h3>Almost done</h3><p>{err}</p>
            {pid && <p className="muted">Payment ID: <strong>{pid}</strong></p>}
            <a className="btn wa" href={wa(`Hello, I paid for an appointment. Payment ID: ${pid}`)}>💬 WhatsApp the clinic</a></div>
        )}
        {b && ok && (
          <>
            <div className="ticket">
              <div className="t-label">YOUR TOKEN</div>
              <div className="t-no">{b.token}</div>
              <div className="t-serial">Serial <strong>{b.token.split("-").pop()}</strong> · {b.clinic}</div>
              <div className="t-row"><span>Patient</span><strong>{b.name}{b.age ? ` (${b.age})` : ""}</strong></div>
              <div className="t-row"><span>Date</span><strong>{fmtDate(b.date)}</strong></div>
              <div className="t-row"><span>Timing</span><strong>{b.timing}</strong></div>
              <div className="t-row"><span>Clinic</span><strong>{b.place}</strong></div>
              <div className="t-row"><span>Paid</span><strong>₹{b.amount} · {b.paymentId}</strong></div>
            </div>
            <p className="muted center">📸 Take a screenshot. Show this token at reception. Patients are called in token order; please arrive by the clinic start time and bring old prescriptions and reports.</p>
            <a className="btn wa" href={wa(msg)}>💬 Send my token to the clinic (WhatsApp)</a>
            <a className="btn" href={calendarLink(b)} target="_blank" rel="noreferrer">⏰ Add reminder to my calendar</a>
            <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(msg + "\nTrack: https://drbplus-chatbot.vercel.app/track")}`}>Save / share on WhatsApp</a>
            <a className="btn ghost" href={(CLINIC.clinics.find((c) => c.name === b.clinic) || {}).maps} target="_blank" rel="noreferrer">📍 Directions</a>
          </>
        )}
        {b && !ok && (
          <div className="card alert">
            <h3>Payment received — new date needed</h3>
            <p>{b.note || "We couldn't confirm this date."} Your ₹{b.amount} is safe.</p>
            <p className="muted">Reference: <strong>{b.token}</strong> · {b.paymentId}</p>
            <a className="btn wa" href={wa(`Hello, I need to choose a new date. ${b.note}. Payment ID: ${b.paymentId}`)}>💬 WhatsApp to pick a new date or refund</a>
          </div>
        )}
        <a className="link center" href="/track">Track my token later →</a>
      </main>
    </div>
  );
}
