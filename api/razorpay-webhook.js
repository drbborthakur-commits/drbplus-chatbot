import { CLINIC } from "../config/clinic.js";

// Razorpay calls this after a payment on pages.razorpay.com/drbplus.
// We never trust the incoming body: we take only the payment ID and fetch
// the payment from Razorpay with our own keys, then record it to the
// Google Sheet + Calendar + email via the Apps Script.
// Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, GOOGLE_SCRIPT_URL, GOOGLE_SCRIPT_TOKEN

const pick = (notes, ...words) => {
  const key = Object.keys(notes).find((k) => words.some((w) => k.toLowerCase().includes(w)));
  return key ? String(notes[key] ?? "").trim() : "";
};

function toIsoDate(v) {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); // DD-MM-YYYY
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(v);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}

function clinicName(v) {
  const s = (v || "").toLowerCase();
  const c = CLINIC.clinics.find((x) => s.includes(x.id));
  return c || { name: v || "Not stated", place: "", timing: "" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true, info: "DRB PLUS webhook" });

  try {
    const ev = req.body || {};
    const paymentId = ev?.payload?.payment?.entity?.id;
    if (!paymentId || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) return res.status(200).json({ ok: true, skipped: "no payment" });

    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    const auth = "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64");
    const r = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, { headers: { Authorization: auth } });
    const p = await r.json();
    if (!r.ok) return res.status(200).json({ ok: false, error: "could not verify payment" });
    if (p.status !== "captured") return res.status(200).json({ ok: true, skipped: p.status });

    const n = p.notes || {};
    const date = toIsoDate(pick(n, "date"));
    const clinic = clinicName(pick(n, "clinic"));
    const booking = {
      bookingId: `DRB-${(date || "").replace(/-/g, "").slice(2) || "000000"}-${paymentId.slice(-5).toUpperCase()}`,
      name: pick(n, "name") || "Not stated",
      age: pick(n, "age"),
      phone: String(p.contact || "").replace(/^\+91/, ""),
      email: p.email && !/void@razorpay/i.test(p.email) ? p.email : "",
      reason: pick(n, "concern", "reason"),
      clinic: clinic.name, place: clinic.place, timing: clinic.timing,
      date: date || new Date(p.created_at * 1000 + 5.5 * 3600e3).toISOString().slice(0, 10),
      amount: p.amount / 100, paymentId, orderId: p.order_id || "",
      bookedAt: new Date(p.created_at * 1000).toISOString(),
    };

    if (process.env.GOOGLE_SCRIPT_URL) {
      await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ token: process.env.GOOGLE_SCRIPT_TOKEN, booking, doctorEmail: CLINIC.email }),
        redirect: "follow",
      }).catch(() => {});
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false });
  }
}
