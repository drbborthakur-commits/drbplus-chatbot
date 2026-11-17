import { signSession, openSession, signPass, otpEnabled } from "../lib/otp.js";

// POST {action:"send", phone}            → {session}
// POST {action:"verify", phone, session, code} → {pass}
// GET                                    → {otp: true|false}
export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ otp: otpEnabled() });
  if (req.method !== "POST") return res.status(405).end();
  const key = (process.env.TWOFACTOR_API_KEY || "").trim();
  if (!key) return res.status(503).json({ error: "OTP not set up" });
  const { action, session, code } = req.body || {};
  const phone = String(req.body?.phone || "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) return res.status(400).json({ error: "Enter a 10-digit mobile number" });

  try {
    if (action === "send") {
      const tpl = process.env.TWOFACTOR_TEMPLATE ? "/" + encodeURIComponent(process.env.TWOFACTOR_TEMPLATE) : "";
      const r = await fetch(`https://2factor.in/API/V1/${key}/SMS/+91${phone}/AUTOGEN${tpl}`);
      const j = await r.json();
      if (j.Status !== "Success") return res.status(502).json({ error: "Could not send OTP. Try again in a minute." });
      return res.status(200).json({ session: signSession(phone, j.Details) });
    }
    if (action === "verify") {
      const s = openSession(phone, session);
      if (!s || !/^\d{4,6}$/.test(String(code || ""))) return res.status(400).json({ error: "Wrong OTP" });
      const r = await fetch(`https://2factor.in/API/V1/${key}/SMS/VERIFY/${s}/${code}`);
      const j = await r.json();
      if (j.Status !== "Success" || !/match/i.test(j.Details || "")) return res.status(400).json({ error: "Wrong or expired OTP" });
      return res.status(200).json({ pass: signPass(phone) });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    return res.status(500).json({ error: "Please try again" });
  }
}
