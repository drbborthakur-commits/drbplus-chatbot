import { CLINIC } from "../config/clinic.js";

const tel = CLINIC.phone.replace(/\s/g, "");

export default function Policies() {
  return (
    <div className="app policies">
      <header className="top">
        <a href="/" className="brand" style={{ color: "inherit", textDecoration: "none" }}>
          <strong>{CLINIC.name}</strong>
        </a>
      </header>
      <main style={{ padding: "16px", maxWidth: 760, margin: "0 auto", lineHeight: 1.6 }}>
        <h1>Policies &amp; Contact</h1>
        <p>This booking service is operated by <strong>{CLINIC.company}</strong> for {CLINIC.name}, {CLINIC.doctor} ({CLINIC.credentials}).</p>

        <h2 id="contact">Contact us</h2>
        <p>
          Phone / WhatsApp: <a href={`tel:${tel}`}>{CLINIC.phone}</a><br />
          Email: <a href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a><br />
          Website: <a href={CLINIC.website}>drbplus.com</a>
        </p>
        <ul>
          {CLINIC.clinics.map((c) => (
            <li key={c.id}><strong>{c.name}</strong> – {c.place}. {c.timing}</li>
          ))}
        </ul>

        <h2 id="terms">Terms &amp; conditions</h2>
        <ul>
          <li>The ₹{CLINIC.feeRupees} payment is the consultation fee for one visit with {CLINIC.doctor} at the chosen clinic on the chosen date. It is not charged again at the clinic.</li>
          <li>After payment you receive a registration number (token). Please arrive within clinic hours on your visit date and show the token at the reception.</li>
          <li>The AI assistant and self-checks give general information only. They are not a diagnosis or treatment. In an emergency call 112 or go to the nearest hospital.</li>
          <li>Medicines and treatment are decided only by the doctor after an in-person consultation.</li>
        </ul>

        <h2 id="refund">Cancellation &amp; refund policy</h2>
        <ul>
          <li>You can cancel or change your date by WhatsApp or call to {CLINIC.phone} with your registration number, at least 2 hours before clinic opening on your visit date.</li>
          <li>On cancellation in time, the full amount is refunded to the original payment method. Refunds are processed within 5–7 working days.</li>
          <li>If the doctor is unavailable on your booked date, you can choose a full refund or a free new date.</li>
          <li>Missed appointments without notice are not refunded, but you may request one free reschedule within 30 days.</li>
          <li>No physical goods are shipped; this service is a consultation booking only, so there is no shipping or delivery.</li>
        </ul>

        <h2 id="privacy">Privacy policy</h2>
        <ul>
          <li>We collect your name, age, mobile number, email (optional), main concern, chosen clinic and date only to manage your appointment.</li>
          <li>Payments are handled by Razorpay. We do not see or store your card, UPI or bank details.</li>
          <li>Your booking details are stored securely and seen only by the clinic. We do not sell or share them with anyone else.</li>
          <li>Chat questions are sent to an AI service to generate answers and are not used to identify you. Avoid sharing details you do not want to type.</li>
          <li>To see or delete your data, contact us at {CLINIC.email}.</li>
        </ul>

        <p><a href="/">← Back to the app</a></p>
      </main>
    </div>
  );
}
