/**
 * DRB PLUS — booking receiver (Google Sheet + Google Calendar + Email)
 * Paste into: Google Sheet → Extensions → Apps Script. See SETUP.md.
 */
const TOKEN = "PASTE-YOUR-SECRET-WORD-HERE"; // same as GOOGLE_SCRIPT_TOKEN on Vercel

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) return reply({ ok: false, error: "bad token" });
    const b = body.booking;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("Bookings") || ss.insertSheet("Bookings");
    if (sh.getLastRow() === 0) {
      sh.appendRow(["Booked at", "Booking ID", "Visit date", "Clinic", "Name", "Age", "Phone", "Email", "Reason", "Paid ₹", "Payment ID", "Order ID"]);
      sh.setFrozenRows(1);
    }
    // ignore a repeat of the same payment
    const ids = sh.getRange(1, 11, sh.getLastRow(), 1).getValues().flat();
    if (ids.indexOf(b.paymentId) !== -1) return reply({ ok: true, duplicate: true });

    sh.appendRow([new Date(b.bookedAt), b.bookingId, b.date, b.clinic, b.name, b.age, "'" + b.phone, b.email, b.reason, b.amount, b.paymentId, b.orderId]);

    // Calendar: all-day event on the visit date
    const p = b.date.split("-");
    const day = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    CalendarApp.getDefaultCalendar().createAllDayEvent(
      `${b.clinic}: ${b.name}${b.age ? " (" + b.age + ")" : ""} — ${b.bookingId}`,
      day,
      { description: `Phone: ${b.phone}\nReason: ${b.reason || "-"}\nPaid: ₹${b.amount} (${b.paymentId})` }
    );

    // Email to the doctor
    MailApp.sendEmail(body.doctorEmail,
      `New booking ${b.bookingId} — ${b.clinic}, ${b.date}`,
      `Name: ${b.name}\nAge: ${b.age || "-"}\nPhone: ${b.phone}\nClinic: ${b.clinic}\nDate: ${b.date}\nReason: ${b.reason || "-"}\nPaid: ₹${b.amount}\nPayment ID: ${b.paymentId}`);

    // Confirmation email to the patient, if they gave one
    if (b.email) {
      MailApp.sendEmail(b.email,
        `Your appointment ${b.bookingId} — DRB PLUS ${b.clinic}`,
        `Dear ${b.name},\n\nYour advance booking is confirmed.\n\nBooking ID: ${b.bookingId}\nClinic: ${b.clinic} — ${b.place}\nDate: ${b.date}\nTimings: ${b.timing}\nPaid: ₹${b.amount}\n\nPatients are seen in order of arrival. Please bring old prescriptions and reports.\nFor changes, WhatsApp +91 94351 66121 with your booking ID.\n\nDRB PLUS Neuro-Psychiatric Clinic\nhttps://drbplus.com`);
    }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
