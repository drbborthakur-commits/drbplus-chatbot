import { useState, useRef, useEffect } from "react";
import { CLINIC, availableDates } from "../config/clinic.js";
import { LANGS, T } from "./i18n.js";
import { SCREENERS, bandFor } from "./screeners.js";

const openBooking = () => window.open(CLINIC.bookingUrl, "_blank", "noopener");
const waLink = (text) => `https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(text)}`;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

export default function App() {
  const [lang, setLang] = useState(() => store.get("drb_lang") || "en");
  const t = T[lang] || T.en;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(null); // "book" | "check" | null
  const endRef = useRef(null);

  useEffect(() => { store.set("drb_lang", lang); }, [lang]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const push = (m) => setMessages((prev) => [...prev, m]);

  async function ask(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const history = next.filter((m) => !m.kind).map(({ role, content }) => ({ role, content }));
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "error");
      let reply = data.text || "";
      const actions = [];
      if (reply.includes("[[BOOK]]")) actions.push("book");
      if (reply.includes("[[CHECK]]")) actions.push("check");
      reply = reply.replace(/\[\[(BOOK|CHECK)\]\]/g, "").trim();
      push({ role: "assistant", content: reply, actions });
    } catch {
      push({ role: "assistant", kind: "note", content: `Sorry, I couldn't connect just now. Please try again, or WhatsApp ${CLINIC.phone}.` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <img src="/logo-light.png" alt="DRB PLUS" className="logo" />
        <div className="who">
          <div className="dr">{CLINIC.doctor}</div>
          <div className="sub">{CLINIC.credentials} · {t.subtitle}</div>
        </div>
        <div className="langs" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.id} className={lang === l.id ? "on" : ""} onClick={() => setLang(l.id)}>{l.label}</button>
          ))}
        </div>
      </header>

      <nav className="chips">
        <button className="chip primary" onClick={openBooking}>📅 {t.book} · ₹{CLINIC.feeRupees}</button>
        <button className="chip" onClick={() => setSheet("check")}>📝 {t.check}</button>
        <button className="chip" onClick={() => push({ role: "assistant", kind: "timings" })}>📍 {t.timings}</button>
        <a className="chip" href={waLink("Hello, I have a query for DRB PLUS clinic.")} target="_blank" rel="noreferrer">💬 {t.call}</a>
      </nav>

      <main className="thread">
        <Bubble role="assistant">{t.greeting}</Bubble>
        {messages.map((m, i) => {
          if (m.kind === "timings") return <Timings key={i} t={t} />;
          if (m.kind === "confirm") return <Confirm key={i} t={t} b={m.booking} recorded={m.recorded} />;
          if (m.kind === "result") return <Result key={i} t={t} r={m.result} onBook={openBooking} />;
          return (
            <Bubble key={i} role={m.role} note={m.kind === "note"}>
              {m.content}
              {m.actions?.length > 0 && (
                <div className="acts">
                  {m.actions.includes("book") && <button onClick={openBooking}>{t.bookNow}</button>}
                  {m.actions.includes("check") && <button onClick={() => setSheet("check")}>{t.startCheck}</button>}
                </div>
              )}
            </Bubble>
          );
        })}
        {loading && <div className="bubble bot typing"><span /><span /><span /></div>}
        <div ref={endRef} />
      </main>

      <footer className="composer">
        <form onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <textarea
            rows={1} value={input} placeholder={t.placeholder} maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
          />
          <button type="submit" disabled={!input.trim() || loading} aria-label={t.send}>➤</button>
        </form>
        <p className="fine">{t.disclaimer} · <a href={CLINIC.website} target="_blank" rel="noreferrer">drbplus.com</a></p>
      </footer>

      {sheet === "book" && (
        <BookingSheet t={t} onClose={() => setSheet(null)}
          onDone={(booking, recorded) => { setSheet(null); push({ role: "assistant", kind: "confirm", booking, recorded }); }} />
      )}
      {sheet === "check" && (
        <CheckSheet t={t} onClose={() => setSheet(null)}
          onDone={(result) => { setSheet(null); push({ role: "assistant", kind: "result", result }); }} />
      )}
    </div>
  );
}

// Light formatting for AI replies: **bold**, "- " / "* " bullets, stray markdown removed
function fmt(text) {
  if (typeof text !== "string") return text;
  const lines = text.replace(/^#+\s*/gm, "").split("\n");
  return lines.map((line, i) => {
    const bullet = /^\s*[-*•]\s+/.test(line);
    const body = line.replace(/^\s*[-*•]\s+/, "");
    const parts = body.split(/\*\*(.+?)\*\*/g).map((p, k) => (k % 2 ? <strong key={k}>{p}</strong> : p));
    return (
      <span key={i}>
        {bullet ? "• " : ""}{parts}
        {i < lines.length - 1 && "\n"}
      </span>
    );
  });
}

function Bubble({ role, note, children }) {
  const kids = Array.isArray(children) ? children : [children];
  return (
    <div className={`bubble ${role === "user" ? "me" : "bot"} ${note ? "note" : ""}`}>
      {kids.map((c, i) => (typeof c === "string" ? <span key={i}>{fmt(c)}</span> : c))}
    </div>
  );
}

function Timings({ t }) {
  return (
    <div className="card">
      <h3>{t.timingsTitle}</h3>
      {CLINIC.clinics.map((c) => (
        <div key={c.id} className="row">
          <div>
            <strong>{c.name}</strong> — {c.timing}
            <div className="muted">{c.place}{c.phone ? ` · ☎ ${c.phone}` : ""}</div>
          </div>
          <a href={c.maps} target="_blank" rel="noreferrer">{t.directions}</a>
        </div>
      ))}
      <div className="muted">☎ {CLINIC.phone} · ₹{CLINIC.feeRupees}</div>
    </div>
  );
}

function Confirm({ t, b, recorded }) {
  const msg = `Booking ${b.bookingId}\nName: ${b.name}${b.age ? ` (${b.age})` : ""}\nPhone: ${b.phone}\nClinic: ${b.clinic}\nDate: ${b.date}\nPaid: ₹${b.amount} (Razorpay ${b.paymentId})`;
  return (
    <div className="card ok">
      <h3>✅ {t.confirmTitle}</h3>
      <div className="big">{t.bookingId}: <strong>{b.bookingId}</strong></div>
      <div>{b.name} · {b.clinic} · {b.date}</div>
      <div className="muted">{b.place} · {b.timing}</div>
      <p className="muted">{t.bring}</p>
      <a className="btn wa" href={waLink(msg)} target="_blank" rel="noreferrer">💬 {t.sendWA}</a>
      {!recorded && <p className="muted small">If WhatsApp doesn't open, send a screenshot of this card to {CLINIC.phone}.</p>}
    </div>
  );
}

function Result({ t, r, onBook }) {
  return (
    <div className={`card ${r.safety ? "alert" : ""}`}>
      <h3>{r.name} — {r.topic}</h3>
      <div className="big">{t.score}: <strong>{r.total}</strong> / {r.max} · {r.band}</div>
      {r.safety && (
        <p><strong>You mentioned thoughts of being better off dead or hurting yourself.</strong> You don't have to face this alone. Please talk to someone you trust right now, and call <a href="tel:112">112</a> or go to the nearest hospital emergency if you feel unsafe. You can also call or WhatsApp Dr. Borthakur's clinic at <a href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}>{CLINIC.phone}</a>.</p>
      )}
      <p className="muted">
        {r.total >= r.consultFrom
          ? "Your answers suggest it would help to see the doctor for a proper assessment."
          : "Your answers don't suggest a major concern right now. If things worsen or worry you, a consultation can still help."}
        {" "}This is a screening, not a diagnosis.
      </p>
      <button className="btn" onClick={onBook}>📅 {t.book}</button>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="sheet" role="dialog" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function BookingSheet({ t, onClose, onDone }) {
  const [clinic, setClinic] = useState("");
  const [date, setDate] = useState("");
  const [f, setF] = useState({ name: "", age: "", phone: "", email: "", reason: "" });
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const dates = clinic ? availableDates(clinic) : [];
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function pay(e) {
    e.preventDefault();
    setErr("");
    setBusy(t.paying);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load Razorpay. Check your internet and try again.");
      const r = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, clinic, date }),
      });
      const o = await r.json();
      if (!r.ok) throw new Error(o.error);

      const rzp = new window.Razorpay({
        key: o.keyId, amount: o.amount, currency: "INR", order_id: o.orderId,
        name: "DRB PLUS", description: `Advance booking — ${clinic}, ${date}`,
        image: "/apple-touch-icon.png",
        prefill: { name: f.name, contact: "+91" + f.phone.replace(/\D/g, "").slice(-10), email: f.email || undefined },
        theme: { color: "#0C3359" },
        modal: { ondismiss: () => { setBusy(""); setErr(t.cancelled); } },
        handler: async (resp) => {
          setBusy(t.verifying);
          try {
            const v = await fetch("/api/verify-payment", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp),
            });
            const out = await v.json();
            if (!v.ok) throw new Error(out.error);
            onDone(out.booking, out.recorded);
          } catch (ex) {
            setBusy("");
            setErr(`${ex.message || "Could not confirm."} Payment ID: ${resp.razorpay_payment_id} — please WhatsApp this to ${CLINIC.phone}.`);
          }
        },
      });
      rzp.on("payment.failed", (resp) => { setBusy(""); setErr(resp.error?.description || t.cancelled); });
      rzp.open();
    } catch (ex) {
      setBusy("");
      setErr(ex.message || "Something went wrong.");
    }
  }

  return (
    <Sheet title={t.bookTitle} onClose={onClose}>
      <form onSubmit={pay} className="form">
        <label className="step">1 · {t.step1}</label>
        <div className="pick">
          {CLINIC.clinics.map((c) => (
            <button type="button" key={c.id} className={clinic === c.id ? "on" : ""} onClick={() => { setClinic(c.id); setDate(""); }}>
              <strong>{c.name}</strong><span>{c.timing}</span>
            </button>
          ))}
        </div>

        {clinic && (
          <>
            <label className="step">2 · {t.step2}</label>
            {dates.length ? (
              <div className="dates">
                {dates.map((d) => (
                  <button type="button" key={d.iso} className={date === d.iso ? "on" : ""} onClick={() => setDate(d.iso)}>{d.label}</button>
                ))}
              </div>
            ) : <p className="muted">{t.noDates}</p>}
          </>
        )}

        {date && (
          <>
            <label className="step">3 · {t.step3}</label>
            <input required placeholder={t.name} value={f.name} onChange={set("name")} autoComplete="name" />
            <div className="two">
              <input placeholder={t.age} value={f.age} onChange={set("age")} inputMode="numeric" maxLength={3} />
              <input required placeholder={t.phone} value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" />
            </div>
            <input type="email" placeholder={t.email} value={f.email} onChange={set("email")} autoComplete="email" />
            <input placeholder={t.reason} value={f.reason} onChange={set("reason")} maxLength={200} />
            {err && <p className="err">{err}</p>}
            <button className="btn pay" disabled={!!busy}>{busy || t.pay.replace("{fee}", CLINIC.feeRupees)}</button>
            <p className="muted small">🔒 {t.payNote}</p>
          </>
        )}
      </form>
    </Sheet>
  );
}

function CheckSheet({ t, onClose, onDone }) {
  const [s, setS] = useState(null);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState([]);

  function choose(score) {
    const a = [...ans]; a[i] = score;
    let next = i + 1;
    // AUDIT: if the person never drinks, skip to questions 9 and 10
    if (s.id === "audit" && i === 0 && score === 0) {
      for (let k = 1; k <= 7; k++) a[k] = 0;
      next = 8;
    }
    setAns(a);
    if (next < s.items.length) return setI(next);
    const total = a.reduce((x, y) => x + (y || 0), 0);
    onDone({
      name: s.name, topic: s.topic, total, max: s.max, band: bandFor(s, total),
      consultFrom: s.consultFrom, safety: s.safety ? s.safety(a) : false,
    });
  }
  function back() {
    if (s.id === "audit" && i === 8 && ans[0] === 0) return setI(0);
    i > 0 ? setI(i - 1) : setS(null);
  }

  return (
    <Sheet title={t.checkTitle} onClose={onClose}>
      {!s ? (
        <div className="form">
          <p className="muted">{t.checkIntro}</p>
          {SCREENERS.map((x) => (
            <button key={x.id} className="pickrow" onClick={() => { setS(x); setI(0); setAns([]); }}>
              <strong>{x.topic}</strong><span>{x.name} · {x.items.length} questions</span>
            </button>
          ))}
          {t.englishNote && <p className="muted small">{t.englishNote}</p>}
        </div>
      ) : (
        <div className="form">
          <div className="progress"><div style={{ width: `${(i / s.items.length) * 100}%` }} /></div>
          <p className="muted small">{s.name} · {t.q} {i + 1} {t.of} {s.items.length}</p>
          <p className="muted">{s.stem}</p>
          <h3 className="qtext">{s.items[i].text}</h3>
          {s.items[i].options.map((o) => (
            <button key={o.label} className={`opt ${ans[i] === o.score ? "on" : ""}`} onClick={() => choose(o.score)}>{o.label}</button>
          ))}
          <button className="link" onClick={back}>← {t.back}</button>
        </div>
      )}
    </Sheet>
  );
}
