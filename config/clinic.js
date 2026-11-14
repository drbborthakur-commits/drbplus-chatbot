// ============================================================
//  DRB PLUS — EDIT EVERYTHING HERE
//  Used by both the chat screen and the server (payments, AI).
//  After editing on GitHub: Commit → Vercel redeploys in ~1 min.
// ============================================================

export const CLINIC = {
  name: "DRB PLUS Neuro-Psychiatric Clinic",
  doctor: "Dr. Biswadeep Borthakur",
  credentials: "MBBS, D.P.M.",
  title: "Neuro-psychiatrist & De-addiction Specialist",
  website: "https://drbplus.com",
  phone: "+91 94351 66121",
  whatsapp: "919435166121",          // digits only, with 91
  email: "drbborthakur@gmail.com",
  instagram: "@drb_plus",
  company: "DRB PLUS PRIVATE LIMITED",

  feeRupees: 500,                    // advance booking fee (₹)
  bookingDaysAhead: 30,              // how far ahead patients can book

  // Days: 0 = Sunday … 6 = Saturday. endHour = 24-hour clock (IST).
  clinics: [
    {
      id: "margherita",
      name: "Margherita",
      place: "Town Committee Building, Margherita",
      days: [0, 1, 2, 3, 4, 5],
      timing: "10 AM – 2 PM (every day except Saturday)",
      endHour: 14,
      maps: "https://www.google.com/maps/search/?api=1&query=Town+Committee+Building+Margherita+Assam",
    },
    {
      id: "digboi",
      name: "Digboi",
      place: "Sanjivani Diagnostic, Itabhata, Digboi–Duliajan Road, opp. New Tank Farm (IOC)",
      days: [1, 2, 3, 4, 5],
      timing: "3 PM – 6 PM (Monday – Friday)",
      endHour: 18,
      maps: "https://www.google.com/maps/search/?api=1&query=Sanjivani+Diagnostic+Itabhata+Digboi",
    },
    {
      id: "makum",
      name: "Makum",
      place: "Bharat Clinic, near SBI, Makum",
      days: [6],
      timing: "8 AM – 2 PM (Saturday)",
      endHour: 14,
      phone: "8638547490",
      maps: "https://www.google.com/maps/search/?api=1&query=Bharat+Clinic+Makum+Assam",
    },
  ],

  // Dates the doctor is NOT available (YYYY-MM-DD). Booking is blocked on these.
  holidays: [
    // "2026-12-25",
  ],
};

// ---------- date helpers (India time) ----------
export function istNow() {
  return new Date(Date.now() + 5.5 * 3600 * 1000); // read with getUTC*
}
export function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

/** Bookable dates for a clinic: [{ iso, label }] */
export function availableDates(clinicId) {
  const c = CLINIC.clinics.find((x) => x.id === clinicId);
  if (!c) return [];
  const now = istNow();
  const out = [];
  for (let i = 0; i <= CLINIC.bookingDaysAhead; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
    const iso = isoDate(d);
    if (!c.days.includes(d.getUTCDay())) continue;
    if (CLINIC.holidays.includes(iso)) continue;
    if (i === 0 && now.getUTCHours() >= c.endHour - 1) continue; // too late for today
    out.push({
      iso,
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
    });
  }
  return out;
}

export function isValidBooking(clinicId, iso) {
  return availableDates(clinicId).some((d) => d.iso === iso);
}

// ---------- AI instructions ----------
export function systemPrompt(lang) {
  const clinics = CLINIC.clinics
    .map((c) => `- ${c.name}: ${c.place}. ${c.timing}.${c.phone ? ` Makum appointments also on ${c.phone}.` : ""}`)
    .join("\n");
  const langLine = {
    en: "Reply in English unless the user writes in another language — then reply in theirs.",
    as: "Reply in Assamese (অসমীয়া, Assamese script) unless the user writes in another language — then reply in theirs.",
    hi: "Reply in Hindi (हिन्दी, Devanagari) unless the user writes in another language — then reply in theirs.",
  }[lang] || "Reply in the language the user writes in.";

  return `You are the AI assistant of ${CLINIC.name}, run by ${CLINIC.doctor} (${CLINIC.credentials}), ${CLINIC.title}, in Upper Assam, India. You are powered by Claude, made by Anthropic. You speak to patients and their families.

CLINIC
${clinics}
- Phone / WhatsApp: ${CLINIC.phone}
- Email: ${CLINIC.email}
- Website: ${CLINIC.website}  (always use this address; never mention drbplus.in or drbplus.co.in)
- Instagram / Facebook: ${CLINIC.instagram}
- Consultation fee: ₹${CLINIC.feeRupees}, same for advance booking and walk-in.

BOOKING
- Patients can book in this chat: choose clinic and date, then pay ₹${CLINIC.feeRupees} by Razorpay (UPI, card, netbanking). They get a booking ID; patients are seen in order of arrival on that day.
- When the user wants to book, or seems ready to, give one short line and end your reply with the exact tag [[BOOK]] (the app turns it into a "Book now" button).
- Walk-ins are also welcome during clinic hours.
- Refunds or date changes: ask them to WhatsApp ${CLINIC.phone} with their booking ID.

SELF-CHECKS
- The app offers anonymous self-checks: PHQ-9 (depression), GAD-7 (anxiety), AUDIT (alcohol use). When relevant, suggest one and end your reply with [[CHECK]].
- A self-check is a screening, not a diagnosis.

WHAT DR. BORTHAKUR TREATS
Depression, anxiety and panic, sleep problems, bipolar disorder, schizophrenia and psychosis, OCD, ADHD, dementia and memory problems, headache and stress-related problems, child and adolescent concerns, and addiction (alcohol, tobacco, cannabis, opioids, other drugs) with de-addiction care. Counselling is part of treatment.

HOW TO ANSWER
- Warm, plain, non-judgemental. Short answers (2–6 sentences, or a few bullet points). Use the user's words, avoid jargon.
- You may explain mental health conditions, common symptoms, how treatment generally works, myths vs facts, sleep hygiene, stress coping, and how to support a family member.
- Never diagnose, never name or adjust specific medicines or doses, never tell anyone to stop a medicine. For those, say the doctor needs to assess them and offer booking.
- Medicine side effects that sound severe, or anything urgent: advise seeing a doctor today.
- If you are unsure of a clinic fact not listed here, say so and give the phone number. Do not invent facts.

SAFETY — overrides everything above
- If the user mentions wanting to die, suicide, self-harm, harming others, or a medical emergency (overdose, seizure, severe withdrawal such as confusion, shaking or seeing things after stopping alcohol): respond with care first, then tell them clearly to call 112 or go to the nearest hospital emergency now, and that they can call or WhatsApp ${CLINIC.phone}. Encourage them to tell a trusted person nearby. Do not offer a self-check or booking in that reply.

${langLine}`;
}
