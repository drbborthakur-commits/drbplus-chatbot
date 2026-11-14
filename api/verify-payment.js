import crypto from "crypto";
import { CLINIC } from "../config/clinic.js";

// Checks the Razorpay signature, then records the booking
// (Google Sheet + Google Calendar + email) through your Google Apps Script.
// Env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, GOOGLE_SCRIPT_URL, GOOGLE_SCRIPT_TOKEN
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  const secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !secret)
    return res.status(400).json({ error: "Missing payment details." });

  const expected = crypto.createHmac("sha256", secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const ok = expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!ok) return res.status(400).json({ error: "Payment could not be verified." });

  // Read the booking details from Razorpay itself (not from the browser)
  const auth = "Basic " + Buffer.from(`${(process.env.RAZORPAY_KEY_ID || "").trim()}:${secret}`).toString("base64");
  const r = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, { headers: { Authorization: auth } });
  const order = await r.json();
  if (!r.ok) return res.status(502).json({ error: "Paid, but could not read the order. Please WhatsApp the clinic with your payment ID." });

  const n = order.notes || {};
  const clinic = CLINIC.clinics.find((c) => c.id === n.clinic) || { name: n.clinic, place: "", timing: "" };
  const booking = {
    bookingId: `DRB-${n.date.replace(/-/g, "").slice(2)}-${razorpay_payment_id.slice(-5).toUpperCase()}`,
    name: n.name, age: n.age, phone: n.phone, email: n.email, reason: n.reason,
    clinic: clinic.name, place: clinic.place, timing: clinic.timing, date: n.date,
    amount: order.amount_paid / 100, paymentId: razorpay_payment_id, orderId: razorpay_order_id,
    bookedAt: new Date().toISOString(),
  };

  let recorded = false;
  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      const g = await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // Apps Script prefers plain text bodies
        body: JSON.stringify({ token: process.env.GOOGLE_SCRIPT_TOKEN, booking, doctorEmail: CLINIC.email }),
        redirect: "follow",
      });
      const out = await g.json().catch(() => ({}));
      recorded = !!out.ok;
    } catch (e) { recorded = false; }
  }
  return res.status(200).json({ booking, recorded });
}
