import { CLINIC, isValidBooking } from "../config/clinic.js";

// Creates a Razorpay order for the advance fee.
// Needs Vercel env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, phone, age, clinic, date, email, reason } = req.body || {};
  const digits = String(phone || "").replace(/\D/g, "").slice(-10);

  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: "Please enter the patient's name." });
  if (digits.length !== 10) return res.status(400).json({ error: "Please enter a 10-digit mobile number." });
  if (!isValidBooking(clinic, date)) return res.status(400).json({ error: "That date is not available for this clinic. Please pick another." });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return res.status(500).json({ error: "Online payment is not set up yet. Please WhatsApp the clinic." });

  const clip = (v, n) => String(v || "").slice(0, n);
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: CLINIC.feeRupees * 100,
      currency: "INR",
      receipt: `drb_${Date.now()}`,
      // Razorpay keeps these with the order; the server reads them back after payment
      notes: {
        name: clip(name, 80), phone: digits, age: clip(age, 3), clinic, date,
        email: clip(email, 80), reason: clip(reason, 200),
      },
    }),
  });
  const order = await r.json();
  if (!r.ok) return res.status(502).json({ error: order?.error?.description || "Could not start payment." });
  return res.status(200).json({ orderId: order.id, amount: order.amount, keyId });
}
