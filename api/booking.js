import { recordPayment, callScript } from "../lib/booking.js";

// GET /api/booking?pid=pay_xxx → the patient's token (records it if the webhook hasn't yet)
export default async function handler(req, res) {
  const pid = String(req.query.pid || "");
  if (!/^pay_[A-Za-z0-9]{6,}$/.test(pid)) return res.status(400).json({ ok: false, error: "Invalid payment ID" });
  try {
    let out = await callScript({ action: "lookup", paymentId: pid });
    if (!out?.booking) out = await recordPayment(pid);
    if (!out?.booking) return res.status(202).json({ ok: false, pending: true, status: out?.status || "processing" });
    const b = out.booking;
    return res.status(200).json({ ok: true, booking: {
      token: b.token, status: b.status, note: b.note, clinic: b.clinic, place: b.place, timing: b.timing,
      startHour: b.startHour, date: b.date, name: b.name, age: b.age, amount: b.amount, paymentId: b.paymentId,
    } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Please try again" });
  }
}
