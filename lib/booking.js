import { CLINIC } from "../config/clinic.js";

// Shared: verify a Razorpay payment with our own keys and record it once in the Google Sheet.
const pick = (notes, ...words) => {
  const key = Object.keys(notes).find((k) => words.some((w) => k.toLowerCase().includes(w)));
  return key ? String(notes[key] ?? "").trim() : "";
};

export function toIsoDate(v) {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = String(v).match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); // DD-MM-YYYY
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(v);
  return isNaN(d) ? "" : new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
}

export async function callScript(payload) {
  if (!process.env.GOOGLE_SCRIPT_URL) return { ok: false, error: "no script" };
  const r = await fetch(process.env.GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ token: process.env.GOOGLE_SCRIPT_TOKEN, ...payload }),
    redirect: "follow",
  });
  return r.json().catch(() => ({ ok: false, error: "script reply" }));
}

export async function fetchPayment(paymentId) {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const r = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64") },
  });
  return r.ok ? r.json() : null;
}

export async function fetchOrder(orderId) {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const r = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64") },
  });
  return r.ok ? r.json() : null;
}

/** Returns { ok, booking } or { ok:false, status } */
export async function recordPayment(paymentId) {
  if (!/^pay_[A-Za-z0-9]{6,}$/.test(paymentId || "")) return { ok: false, status: "bad id" };
  const p = await fetchPayment(paymentId);
  if (!p) return { ok: false, status: "not found" };
  if (p.status !== "captured") return { ok: false, status: p.status };
  let n = p.notes || {};
  // In-app payments carry the patient details on the order, not the payment
  if (p.order_id && !Object.keys(n).some((k) => /name|clinic|date/i.test(k))) {
    const o = await fetchOrder(p.order_id);
    if (o?.notes) n = o.notes;
  }
  const booking = {
    name: pick(n, "name") || "Not stated",
    age: pick(n, "age"),
    phone: (pick(n, "phone") || String(p.contact || "")).replace(/\D/g, "").slice(-10),
    email: pick(n, "email") || (p.email && !/void@razorpay/i.test(p.email) ? p.email : ""),
    reason: pick(n, "concern", "reason"),
    clinic: pick(n, "clinic"),
    date: toIsoDate(pick(n, "date")),
    amount: p.amount / 100,
    paymentId,
    bookedAt: new Date(p.created_at * 1000).toISOString(),
  };
  return callScript({ booking });
}

export { CLINIC };
