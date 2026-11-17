import { callScript } from "../lib/booking.js";

// POST /api/track { phone } → upcoming tokens for that mobile (names masked)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const phone = String(req.body?.phone || "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) return res.status(400).json({ ok: false, error: "Enter a 10-digit mobile number" });
  try {
    const out = await callScript({ action: "track", phone });
    return res.status(200).json({ ok: true, bookings: out?.bookings || [] });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Please try again" });
  }
}
