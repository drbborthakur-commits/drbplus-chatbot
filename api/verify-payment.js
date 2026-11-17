import crypto from "crypto";
import { recordPayment } from "../lib/booking.js";

// In-app payment → check Razorpay signature → record once → return the patient's token.
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

  // Payment may still be "authorized" for a moment before Razorpay auto-captures it
  let out;
  for (let i = 0; i < 5; i++) {
    out = await recordPayment(razorpay_payment_id);
    if (out?.booking || out?.status !== "authorized") break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (!out?.booking) return res.status(202).json({ pending: true, paymentId: razorpay_payment_id });
  return res.status(200).json({ ok: true, paymentId: razorpay_payment_id });
}
