/**
 * DRB PLUS — Online registration (token) system  v2
 * Google Sheet "DRB PLUS Bookings" → Extensions → Apps Script.
 *
 * Token format:  CLINIC-DDMM-NN   e.g. DGB-2011-11 = Digboi, 20 Nov, token 11
 * Serial starts at 11 for each clinic each day (1–10 kept for walk-ins).
 */
const TOKEN = "PASTE-YOUR-SECRET-WORD-HERE";   // same as GOOGLE_SCRIPT_TOKEN on Vercel
const FIRST_SERIAL = 11;
const CALENDAR_NAME = "DRB PLUS Appointments";
const TZ = "Asia/Kolkata";

// Days: 0 = Sunday … 6 = Saturday. start/end = 24h clock.
const CLINICS = {
  margherita: { code: "MGT", name: "Margherita", place: "Town Committee Building, Margherita", days: [0,1,2,3,4,5], start: 10, end: 14, colour: "PALE_BLUE" },
  digboi:     { code: "DGB", name: "Digboi", place: "Sanjivani Diagnostic, Itabhata, Digboi–Duliajan Road, opp. New Tank Farm (IOC)", days: [1,2,3,4,5], start: 15, end: 18, colour: "PALE_GREEN" },
  makum:      { code: "MKM", name: "Makum", place: "Bharat Clinic, near SBI, Makum", days: [6], start: 8, end: 14, colour: "ORANGE" },
};
// Holidays — doctor not available (YYYY-MM-DD). Bookings on these days are flagged for reschedule.
const HOLIDAYS = [
  // "2026-12-25",
];
const DOCTOR_EMAIL = "drbborthakur@gmail.com";
const CLINIC_WHATSAPP = "+91 94351 66121";

const HEAD = ["Booked at","Token","Visit date","Clinic","Serial","Name","Age","Phone","Email","Concern","Paid ₹","Payment ID","Status","Note"];

// ---------------------------------------------------------------- web entry
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) return out({ ok: false, error: "bad token" });
    if (body.action === "lookup") return out(lookup(body.paymentId));
    if (body.action === "track")  return out(track(body.phone));
    return out(record(body.booking));               // default: new booking
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// ---------------------------------------------------------------- core
function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("Registrations");
  if (!sh) {
    sh = ss.insertSheet("Registrations", 0);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight("bold").setBackground("#0C3359").setFontColor("#ffffff");
    sh.getRange("C:C").setNumberFormat("@");   // keep dates as text YYYY-MM-DD
    sh.getRange("H:H").setNumberFormat("@");
  }
  return sh;
}

function rows() {
  const sh = sheet();
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, HEAD.length).getValues().map((r, i) => ({ row: i + 2, v: r }));
}

function toObj(v) {
  return { token: v[1], date: String(v[2]), clinic: v[3], serial: v[4], name: v[5], age: v[6], phone: String(v[7]),
           email: v[8], concern: v[9], amount: v[10], paymentId: v[11], status: v[12], note: v[13] };
}

function clinicFor(text) {
  const s = String(text || "").toLowerCase();
  const id = Object.keys(CLINICS).find(k => s.indexOf(k) !== -1 || s.indexOf(CLINICS[k].code.toLowerCase()) !== -1);
  return id ? CLINICS[id] : null;
}

function record(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const all = rows();
    const dup = all.find(r => r.v[11] === b.paymentId);
    if (dup) return { ok: true, duplicate: true, booking: decorate(toObj(dup.v)) };

    const c = clinicFor(b.clinic);
    const date = String(b.date || "");
    const p = date.split("-").map(Number);
    const day = p.length === 3 ? new Date(p[0], p[1] - 1, p[2]) : null;

    // validity checks
    let status = "Confirmed", note = "";
    if (!c) { status = "Check"; note = "Clinic not recognised: " + b.clinic; }
    else if (!day || isNaN(day)) { status = "Check"; note = "Date not recognised"; }
    else if (c.days.indexOf(day.getDay()) === -1) { status = "Reschedule"; note = c.name + " is closed on " + Utilities.formatDate(day, TZ, "EEEE"); }
    else if (HOLIDAYS.indexOf(date) !== -1) { status = "Reschedule"; note = "Doctor on leave this day"; }
    else {
      const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
      if (date < today) { status = "Reschedule"; note = "Date is in the past"; }
    }

    let serial = "", tokenNo = "";
    if (status === "Confirmed") {
      const taken = all.filter(r => String(r.v[2]) === date && r.v[3] === c.name && r.v[12] === "Confirmed").length;
      serial = FIRST_SERIAL + taken;
      tokenNo = c.code + "-" + date.slice(8, 10) + date.slice(5, 7) + "-" + serial;
    } else {
      tokenNo = "PENDING-" + String(b.paymentId).slice(-5).toUpperCase();
    }

    sheet().appendRow([new Date(b.bookedAt || new Date()), tokenNo, date, c ? c.name : String(b.clinic || ""), serial,
      b.name, b.age, String(b.phone || ""), b.email || "", b.reason || "", b.amount, b.paymentId, status, note]);

    const bk = decorate({ token: tokenNo, date, clinic: c ? c.name : b.clinic, serial, name: b.name, age: b.age,
      phone: b.phone, email: b.email, concern: b.reason, amount: b.amount, paymentId: b.paymentId, status, note });

    try { addToCalendar(bk, c, day); } catch (e) {}
    try { notifyDoctor(bk); } catch (e) {}
    try { if (bk.email) notifyPatient(bk); } catch (e) {}
    return { ok: true, booking: bk };
  } finally {
    lock.releaseLock();
  }
}

function decorate(bk) {
  const c = clinicFor(bk.clinic);
  bk.place = c ? c.place : "";
  bk.timing = c ? fmtHour(c.start) + " – " + fmtHour(c.end) : "";
  bk.startHour = c ? c.start : null;
  return bk;
}
function fmtHour(h) { return (h % 12 || 12) + (h < 12 ? " AM" : " PM"); }

function lookup(paymentId) {
  const r = rows().find(r => r.v[11] === paymentId);
  return r ? { ok: true, booking: decorate(toObj(r.v)) } : { ok: true, booking: null };
}

function track(phone) {
  const d = String(phone || "").replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return { ok: false, error: "phone" };
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const list = rows().map(r => toObj(r.v))
    .filter(b => String(b.phone).replace(/\D/g, "").slice(-10) === d && (b.date >= today || b.status !== "Confirmed"))
    .map(b => { const x = decorate(b); return { token: x.token, date: x.date, clinic: x.clinic, timing: x.timing, place: x.place,
      status: x.status, note: x.note, name: x.name, age: x.age, serial: x.serial, paymentId: x.paymentId }; });
  return { ok: true, bookings: list };
}
function maskName(n) { n = String(n || ""); return n ? n.split(" ").map(w => w[0] + "*".repeat(Math.max(0, w.length - 1))).join(" ") : ""; }

// ---------------------------------------------------------------- calendar
function calendar() {
  const list = CalendarApp.getCalendarsByName(CALENDAR_NAME);
  if (list.length) return list[0];
  return CalendarApp.createCalendar(CALENDAR_NAME, { timeZone: TZ, color: "#0C3359" });
}

function addToCalendar(bk, c, day) {
  const cal = calendar();
  const desc = "Token: " + bk.token + "\nPatient: " + bk.name + (bk.age ? " (" + bk.age + ")" : "") +
    "\nPhone: " + bk.phone + "\nConcern: " + (bk.concern || "-") + "\nPaid: ₹" + bk.amount + " (" + bk.paymentId + ")" +
    (bk.note ? "\nNOTE: " + bk.note : "");
  let ev;
  if (bk.status === "Confirmed" && c && day) {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), c.start, 0);
    const end = new Date(start.getTime() + 15 * 60000);
    ev = cal.createEvent(c.code + "-" + bk.serial + " " + bk.name + (bk.age ? " (" + bk.age + ")" : ""), start, end,
      { description: desc, location: c.place });
    ev.setColor(CalendarApp.EventColor[c.colour]);
  } else {
    const when = day && !isNaN(day) ? day : new Date();
    ev = cal.createAllDayEvent("⚠ RESCHEDULE: " + bk.name + " — " + (bk.note || bk.status), when, { description: desc });
    ev.setColor(CalendarApp.EventColor.RED);
  }
  ev.removeAllReminders();
}

// ---------------------------------------------------------------- email
function notifyDoctor(bk) {
  const subj = bk.status === "Confirmed"
    ? "New booking " + bk.token + " — " + bk.name
    : "⚠ Booking needs reschedule — " + bk.name + " (" + bk.paymentId + ")";
  MailApp.sendEmail(DOCTOR_EMAIL, subj,
    "Token: " + bk.token + "\nStatus: " + bk.status + (bk.note ? " — " + bk.note : "") +
    "\nClinic: " + bk.clinic + "\nDate: " + bk.date + "\nName: " + bk.name + "\nAge: " + (bk.age || "-") +
    "\nPhone: " + bk.phone + "\nConcern: " + (bk.concern || "-") + "\nPaid: ₹" + bk.amount + "\nPayment ID: " + bk.paymentId);
}

function notifyPatient(bk) {
  if (bk.status === "Confirmed") {
    MailApp.sendEmail(bk.email, "Your token " + bk.token + " — DRB PLUS " + bk.clinic,
      "Dear " + bk.name + ",\n\nYour online registration is confirmed.\n\nTOKEN: " + bk.token +
      "\nClinic: " + bk.clinic + " — " + bk.place + "\nDate: " + bk.date + "\nTimings: " + bk.timing +
      "\n\nShow this token at the reception. Please bring old prescriptions and reports.\nTrack your token: https://drbplus-chatbot.vercel.app/track\nFor changes, WhatsApp " + CLINIC_WHATSAPP + ".\n\nDRB PLUS Neuro-Psychiatric Clinic\nhttps://drbplus.com");
  } else {
    MailApp.sendEmail(bk.email, "Your DRB PLUS booking needs a new date",
      "Dear " + bk.name + ",\n\nWe received your payment of ₹" + bk.amount + " (" + bk.paymentId + "), but " + bk.note +
      ".\nPlease WhatsApp " + CLINIC_WHATSAPP + " with your payment ID to choose a new date or get a refund.\n\nDRB PLUS Neuro-Psychiatric Clinic");
  }
}

function morningList() {
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const list = rows().map(r => toObj(r.v)).filter(b => b.date === today && b.status === "Confirmed");
  if (!list.length) return;
  let text = "Online registrations for " + today + "\n";
  Object.keys(CLINICS).forEach(k => {
    const c = CLINICS[k];
    const l = list.filter(b => b.clinic === c.name).sort((a, b) => a.serial - b.serial);
    if (!l.length) return;
    text += "\n" + c.name.toUpperCase() + " (" + fmtHour(c.start) + "–" + fmtHour(c.end) + ")\n";
    l.forEach(b => { text += "  " + b.serial + ". " + b.name + (b.age ? " (" + b.age + ")" : "") + " — " + b.phone + (b.concern ? " — " + b.concern : "") + "\n"; });
  });
  MailApp.sendEmail(DOCTOR_EMAIL, "Today's token list — " + list.length + " patient(s)", text);
}

// Run ONCE from the editor (select "setup" → Run) to create the calendar and the 7 AM email.
function setup() {
  sheet();
  calendar();
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "morningList").forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("morningList").timeBased().atHour(7).everyDays(1).inTimezone(TZ).create();
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
