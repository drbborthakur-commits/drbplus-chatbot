import { useState } from "react";
import { CLINIC } from "../config/clinic.js";

export default function Track() {
  const [phone, setPhone] = useState("");
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go(e) {
    e.preventDefault();
    setErr(""); setBusy(true); setList(null);
    try {
      const r = await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setList(j.bookings);
    } catch (ex) { setErr(ex.message || "Please try again"); }
    setBusy(false);
  }

  return (
    <div className="app page">
      <header className="top">
        <img src="/logo-light.png" alt="DRB PLUS" className="logo" />
        <div className="who"><div className="dr">Track my token</div><div className="sub">{CLINIC.name}</div></div>
      </header>
      <main className="thread">
        <form className="card form" onSubmit={go}>
          <h3>Find your online registration</h3>
          <input inputMode="tel" placeholder="Mobile number used for payment" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <button className="btn" disabled={busy}>{busy ? "Searching…" : "Show my token"}</button>
          {err && <p className="err">{err}</p>}
        </form>
        {list && !list.length && <div className="card"><p>No upcoming bookings found for this number.</p>
          <a className="btn" href={CLINIC.bookingUrl}>📅 Book an appointment · ₹{CLINIC.feeRupees}</a></div>}
        {list && list.map((b) => (
          <div key={b.token} className={`ticket ${b.status !== "Confirmed" ? "warn" : ""}`}>
            <div className="t-label">{b.status === "Confirmed" ? "TOKEN" : "NEEDS NEW DATE"}</div>
            <div className="t-no">{b.token}</div>
            <div className="t-row"><span>Patient</span><strong>{b.name}</strong></div>
            <div className="t-row"><span>Date</span><strong>{b.date}</strong></div>
            <div className="t-row"><span>Clinic</span><strong>{b.clinic} · {b.timing}</strong></div>
            {b.note && <div className="t-row"><span>Note</span><strong>{b.note}</strong></div>}
          </div>
        ))}
        <p className="muted center">Need help? WhatsApp <a href={`https://wa.me/${CLINIC.whatsapp}`}>{CLINIC.phone}</a></p>
      </main>
    </div>
  );
}
