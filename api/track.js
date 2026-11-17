import { callScript } from "../lib/booking.js";
import { checkPass, otpEnabled } from "../lib/otp.js";

// POST /api/track { phone, pass }        (OTP mode)
//              or { phone, last4 }       (fallback: last 4 characters of a payment ID)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const phone = String(req.body?.phone || "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) return res.status(400).json({ ok: false, error: "Enter a 10-digit mobile number" });

  const viaOtp = checkPass(req.body?.pass, phone);
  const last4 = String(req.body?.last4 || "").trim().toUpperCase();
  if (!viaOtp && (otpEnabled() || last4.length !== 4))
    return res.status(401).json({ ok: false, error: otpEnabled() ? "Please verify your mobile with OTP" : "Enter the last 4 characters of your payment ID" });

  try {
    const out = await callScript({ action: "track", phone });
    let list = out?.bookings || [];
    if (!viaOtp) {
      if (!list.some((b) => String(b.paymentId || "").toUpperCase().endsWith(last4)))
        return res.status(200).json({ ok: true, bookings: [] });
    }
    list = list.map(({ paymentId, ...b }) => ({ ...b, ref: String(paymentId || "").slice(-4) }));
    return res.status(200).json({ ok: true, bookings: list });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Please try again" });
  }
}
