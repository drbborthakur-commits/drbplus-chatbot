import crypto from "crypto";

// Short-lived signed pass proving the patient verified this phone number.
const key = () => crypto.createHash("sha256").update("drb-otp|" + (process.env.OTP_SECRET || process.env.RAZORPAY_KEY_SECRET || "dev")).digest();

export function signPass(phone, minutes = 30) {
  const exp = Date.now() + minutes * 60000;
  const body = `${phone}.${exp}`;
  const sig = crypto.createHmac("sha256", key()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function checkPass(pass, phone) {
  const [p, exp, sig] = String(pass || "").split(".");
  if (!p || p !== phone || Number(exp) < Date.now()) return false;
  const want = crypto.createHmac("sha256", key()).update(`${p}.${exp}`).digest("base64url");
  return sig && want.length === sig.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}
// 2Factor.in session ids are signed too, so a client can't swap in someone else's
export function signSession(phone, session) {
  return session + "~" + crypto.createHmac("sha256", key()).update(phone + "|" + session).digest("base64url").slice(0, 16);
}
export function openSession(phone, signed) {
  const [session, sig] = String(signed || "").split("~");
  const want = crypto.createHmac("sha256", key()).update(phone + "|" + session).digest("base64url").slice(0, 16);
  return session && sig === want ? session : null;
}
export const otpEnabled = () => !!(process.env.TWOFACTOR_API_KEY || "").trim();
