import { recordPayment } from "../lib/booking.js";

// Razorpay → after each payment on pages.razorpay.com/drbplus.
// Only the payment ID is taken from the body; everything else is re-fetched from Razorpay.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true, info: "DRB PLUS webhook" });
  try {
    const id = req.body?.payload?.payment?.entity?.id;
    if (id) await recordPayment(id);
  } catch (e) {}
  return res.status(200).json({ ok: true });
}
