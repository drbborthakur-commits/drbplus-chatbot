import { useState, useRef, useEffect } from "react";

const CLINIC_DATA = {
  name: "DRBPLUS",
  doctor: "Dr. Biswadeep Borthakur",
  locations: ["Margherita", "Digboi"],
  services: ["Depression & Anxiety", "Bipolar Disorder", "Schizophrenia", "OCD", "ADHD", "Addiction & De-addiction", "Child & Adolescent Psychiatry", "Counselling & Psychotherapy"],
  fees: { consultation: "₹500 – ₹800 (varies by type)", followUp: "₹300 – ₹500" },
  booking: ["Practo", "DaySchedule", "WhatsApp"],
  whatsapp: "+91-XXXXXXXXXX",
  hours: "Mon–Sat: 10 AM – 6 PM",
  emergency: "If you are in crisis, please call iCall: 9152987821 or Vandrevala Foundation: 1860-2662-345"
};

const FLOW = {
  welcome: {
    message: `Hello! 👋 Welcome to *DRBPLUS* — the psychiatric clinic of ${CLINIC_DATA.doctor}.\n\nHow can I help you today?`,
    options: [
      { label: "📅 Book Appointment", next: "booking" },
      { label: "🏥 Clinic Info", next: "clinicInfo" },
      { label: "💊 Our Services", next: "services" },
      { label: "💰 Fees", next: "fees" },
      { label: "📍 Location", next: "location" },
      { label: "🆘 Crisis Support", next: "crisis" },
    ],
  },
  booking: {
    message: "We'd love to help you schedule a visit! You can book through any of these:",
    options: [
      { label: "📲 Book via WhatsApp", next: "bookWhatsApp" },
      { label: "🌐 Book via Practo/DaySchedule", next: "bookOnline" },
      { label: "🔙 Back to Menu", next: "welcome" },
    ],
  },
  bookWhatsApp: {
    message: `You can reach us directly on WhatsApp at *${CLINIC_DATA.whatsapp}*.\n\nSend us your name, preferred date, time, and location (Margherita or Digboi) and our team will confirm your slot. 😊`,
    options: [{ label: "🔙 Back to Menu", next: "welcome" }],
  },
  bookOnline: {
    message: "You can book your appointment online via:\n\n• **Practo** — search 'DRBPLUS'\n• **DaySchedule** — visit our profile link\n\nBoth platforms let you pick your preferred slot at Margherita or Digboi clinic.",
    options: [{ label: "🔙 Back to Menu", next: "welcome" }],
  },
  clinicInfo: {
    message: `**DRBPLUS Psychiatric Clinic**\nBy ${CLINIC_DATA.doctor}\n\n📍 Two locations: **Margherita** & **Digboi**, Assam\n🕐 ${CLINIC_DATA.hours}\n\nWe provide compassionate, evidence-based mental health care.`,
    options: [
      { label: "📍 See Locations", next: "location" },
      { label: "💊 Our Services", next: "services" },
      { label: "🔙 Back to Menu", next: "welcome" },
    ],
  },
  services: {
    message: `We offer comprehensive psychiatric care including:\n\n${CLINIC_DATA.services.map(s => `• ${s}`).join("\n")}\n\nAll consultations are confidential.`,
    options: [
      { label: "📅 Book Appointment", next: "booking" },
      { label: "🔙 Back to Menu", next: "welcome" },
    ],
  },
  fees: {
    message: `**Consultation Fees at DRBPLUS:**\n\n💼 New Consultation: *${CLINIC_DATA.fees.consultation}*\n🔁 Follow-up Visit: *${CLINIC_DATA.fees.followUp}*\n\nFees may vary. Contact us for exact details.`,
    options: [
      { label: "📅 Book Appointment", next: "booking" },
      { label: "🔙 Back to Menu", next: "welcome" },
    ],
  },
  location: {
    message: "We have two clinic locations in Upper Assam:",
    options: [
      { label: "📍 Margherita Clinic", next: "locationMargherita" },
      { label: "📍 Digboi Clinic", next: "locationDigboi" },
      { label: "🔙 Back to Menu", next: "welcome" },
    ],
  },
  locationMargherita: {
    message: "**DRBPLUS — Margherita**\n📍 Margherita, Tinsukia District, Assam\n🕐 Mon–Sat: 10 AM – 6 PM\n\nContact us on WhatsApp for exact directions.",
    options: [
      { label: "📅 Book Here", next: "booking" },
      { label: "🔙 Back", next: "location" },
    ],
  },
  locationDigboi: {
    message: "**DRBPLUS — Digboi**\n📍 Digboi, Tinsukia District, Assam\n🕐 Mon–Sat: 10 AM – 6 PM\n\nContact us on WhatsApp for exact directions.",
    options: [
      { label: "📅 Book Here", next: "booking" },
      { label: "🔙 Back", next: "location" },
    ],
  },
  crisis: {
    message: `🆘 **If you are in a mental health crisis, please reach out immediately:**\n\n📞 **iCall:** 9152987821\n📞 **Vandrevala Foundation:** 1860-2662-345 *(24/7)*\n📞 **Snehi:** 044-24640050\n\nYou are not alone. Help is available right now. 💙\n\nOur team has also been alerted and will reach out to you.`,
    options: [
      { label: "📅 Book with Dr. Borthakur", next: "booking" },
      { label: "🔙 Back to Menu", next: "welcome" },
    ],
    isCrisis: true,
  },
};

function parseMessage(text) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: text.slice(last, m.index) });
    if (m[1]) parts.push({ type: "bold", content: m[1] });
    else if (m[2]) parts.push({ type: "italic", content: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", content: text.slice(last) });
  return parts;
}

function BubbleText({ text }) {
  return (
    <span>
      {text.split("\n").map((line, i, arr) => (
        <span key={i}>
          {parseMessage(line).map((p, j) =>
            p.type === "bold" ? <strong key={j}>{p.content}</strong>
            : p.type === "italic" ? <em key={j}>{p.content}</em>
            : <span key={j}>{p.content}</span>
          )}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}

export default function DRBPlusChatbot() {
  const [messages, setMessages] = useState([]);
  const [currentNode, setCurrentNode] = useState("welcome");
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addBotMessage = (node, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { from: "bot", node, id: Date.now() }]);
      setCurrentNode(node);
    }, delay);
  };

  const handleStart = () => {
    setStarted(true);
    addBotMessage("welcome", 600);
  };

  const handleOption = (opt) => {
    setMessages(prev => [...prev, { from: "user", text: opt.label, id: Date.now() }]);
    addBotMessage(opt.next, 900);
  };

  const node = FLOW[currentNode];
  const lastBotIdx = [...messages].reverse().findIndex(m => m.from === "bot");
  const lastBotId = lastBotIdx >= 0 ? messages[messages.length - 1 - lastBotIdx].id : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #091520 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      padding: "16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        height: "92vh",
        maxHeight: "780px",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        background: "#ECE5DD",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #075E54, #128C7E)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: "bold", color: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            flexShrink: 0,
          }}>🧠</div>
          <div>
            <div style={{ color: "#fff", fontWeight: "bold", fontSize: 15, fontFamily: "Georgia, serif", letterSpacing: 0.3 }}>DRBPLUS</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "Arial, sans-serif" }}>Dr. Biswadeep Borthakur • Psychiatry</div>
          </div>
          <div style={{
            marginLeft: "auto",
            width: 8, height: 8, borderRadius: "50%",
            background: "#25D366",
            boxShadow: "0 0 0 2px rgba(37,211,102,0.3)",
          }} />
        </div>

        {/* Chat background pattern */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b0bec5' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}>
          {!started && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 16,
              padding: "40px 20px",
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #075E54, #25D366)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36,
                boxShadow: "0 8px 24px rgba(7,94,84,0.35)",
              }}>🧠</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#075E54", fontFamily: "Georgia, serif" }}>DRBPLUS</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4, fontFamily: "Arial, sans-serif" }}>Psychiatric & Mental Wellness Clinic</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2, fontFamily: "Arial, sans-serif" }}>Margherita & Digboi, Assam</div>
              </div>
              <button
                onClick={handleStart}
                style={{
                  marginTop: 8,
                  background: "linear-gradient(135deg, #075E54, #128C7E)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 24,
                  padding: "12px 32px",
                  fontSize: 14,
                  fontWeight: "bold",
                  fontFamily: "Arial, sans-serif",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(7,94,84,0.4)",
                  letterSpacing: 0.5,
                }}
              >
                Start Chat 💬
              </button>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
              flexDirection: "column",
              alignItems: msg.from === "user" ? "flex-end" : "flex-start",
              gap: 6,
            }}>
              <div style={{
                maxWidth: "82%",
                background: msg.from === "user" ? "#DCF8C6" : "#fff",
                borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "10px 14px",
                fontSize: 13,
                fontFamily: "Arial, sans-serif",
                lineHeight: 1.55,
                color: "#1a1a1a",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                ...(msg.node === "crisis" ? { borderLeft: "3px solid #e53935" } : {}),
              }}>
                <BubbleText text={msg.from === "user" ? msg.text : FLOW[msg.node]?.message || ""} />
                {msg.node === "crisis" && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#e53935", fontWeight: "bold" }}>
                    ⚠️ Staff alert sent
                  </div>
                )}
              </div>

              {/* Options only on last bot message */}
              {msg.from === "bot" && msg.id === lastBotId && !isTyping && FLOW[msg.node]?.options && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: "90%", marginTop: 2 }}>
                  {FLOW[msg.node].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOption(opt)}
                      style={{
                        background: "#fff",
                        border: "1.5px solid #128C7E",
                        borderRadius: 16,
                        padding: "7px 13px",
                        fontSize: 12,
                        color: "#075E54",
                        fontWeight: "600",
                        fontFamily: "Arial, sans-serif",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = "#128C7E";
                        e.target.style.color = "#fff";
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = "#fff";
                        e.target.style.color = "#075E54";
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                background: "#fff",
                borderRadius: "18px 18px 18px 4px",
                padding: "12px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                display: "flex",
                gap: 5,
                alignItems: "center",
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#128C7E",
                    animation: "bounce 1.2s infinite",
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div style={{
          background: "#f0f0f0",
          padding: "8px 16px",
          textAlign: "center",
          fontSize: 10,
          color: "#999",
          fontFamily: "Arial, sans-serif",
          flexShrink: 0,
          borderTop: "1px solid #ddd",
        }}>
          DRBPLUS • Powered by AI • For emergencies call 112
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
