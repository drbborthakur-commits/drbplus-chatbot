import { useState, useRef, useEffect } from "react";

const CLINIC_CONTEXT = `You are the friendly AI assistant for DRBPLUS Neuropsychiatric Clinic, run by Dr. Biswadeep Borthakur in Assam, India.

CLINIC INFO:
- Doctor: Dr. Biswadeep Borthakur (Psychiatrist)
- Locations: Margherita (NH 315, Margherita 786181, Assam) and Digboi, Assam
- Hours: Monday to Saturday, 10 AM to 6 PM (Sunday closed)
- Phone/WhatsApp: +91 94351 66121
- Email: drbborthakur@gmail.com
- Instagram: @drb_plus
- Facebook: DRB PLUS Neuro-Psychiatric Clinic
- Booking: Via WhatsApp (+91 94351 66121), Practo (search DRBPLUS), or DaySchedule

SERVICES:
Depression & Anxiety, Bipolar Disorder, Schizophrenia, OCD, ADHD, Addiction & De-addiction, Child & Adolescent Psychiatry, Counselling & Psychotherapy

FEES:
- New Consultation: Rs 500 to 800
- Follow-up: Rs 300 to 500

CRISIS HELPLINES (always share in crisis):
- iCall: 9152987821
- Vandrevala Foundation: 1860-2662-345 (24/7)
- Snehi: 044-24640050

RULES:
- Be warm, empathetic, and professional
- Never diagnose or prescribe medication
- For crisis or suicidal thoughts, always share helplines immediately
- For appointments, direct to WhatsApp +91 94351 66121
- Keep responses concise and helpful
- Respond in the same language the patient uses (English, Hindi, or Assamese)`;

const QUICK_OPTIONS = [
  { label: "📅 Book Appointment", text: "I want to book an appointment" },
  { label: "💊 Services", text: "What services do you offer?" },
  { label: "💰 Fees", text: "What are the consultation fees?" },
  { label: "📍 Location", text: "Where are your clinics located?" },
  { label: "🕐 Timings", text: "What are your clinic timings?" },
  { label: "🆘 Crisis Help", text: "I need urgent mental health support" },
];

function BubbleText({ text }) {
  return (
    <span>
      {text.split("\n").map((line, i, arr) => (
        <span key={i}>
          {line.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**"))
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            if (part.startsWith("*") && part.endsWith("*"))
              return <em key={j}>{part.slice(1, -1)}</em>;
            return <span key={j}>{part}</span>;
          })}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}

export default function DRBPlusChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { from: "bot", text, id: Date.now() }]);
  };

  const handleStart = () => {
    setStarted(true);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage("Hello! Welcome to DRBPLUS — the neuropsychiatric clinic of Dr. Biswadeep Borthakur.\n\nI am your AI assistant. You can type anything or use the quick options below. How can I help you today?");
    }, 800);
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setShowOptions(false);
    setInput("");
    setMessages(prev => [...prev, { from: "user", text, id: Date.now() }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 500,
          system: CLINIC_CONTEXT,
          messages: [...history, { role: "user", content: text }],
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "I am sorry, I could not process that. Please call us at +91 94351 66121.";
      setIsTyping(false);
      addBotMessage(reply);
      setShowOptions(true);
    } catch {
      setIsTyping(false);
      addBotMessage("Sorry, I am having trouble connecting. Please call us at +91 94351 66121 or WhatsApp us.");
      setShowOptions(true);
    }
  };

  const handleQuickOption = (opt) => sendMessage(opt.text);
  const handleSubmit = () => { if (input.trim()) sendMessage(input.trim()); };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #091520 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Georgia, serif", padding: "16px",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column",
        height: "92vh", maxHeight: "780px", borderRadius: "24px", overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)", background: "#ECE5DD",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #075E54, #128C7E)",
          padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "#fff", flexShrink: 0,
          }}>🧠</div>
          <div>
            <div style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>DRBPLUS</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "Arial, sans-serif" }}>Dr. Biswadeep Borthakur • AI Assistant</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#25D366" }} />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: "Arial, sans-serif" }}>AI Online</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {!started && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, padding: "40px 20px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #075E54, #25D366)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🧠</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#075E54" }}>DRBPLUS AI Assistant</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4, fontFamily: "Arial, sans-serif" }}>Powered by Claude AI</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2, fontFamily: "Arial, sans-serif" }}>Margherita & Digboi, Assam</div>
              </div>
              <button onClick={handleStart} style={{ background: "linear-gradient(135deg, #075E54, #128C7E)", color: "#fff", border: "none", borderRadius: 24, padding: "12px 32px", fontSize: 14, fontWeight: "bold", fontFamily: "Arial, sans-serif", cursor: "pointer" }}>Start Chat</button>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "82%", background: msg.from === "user" ? "#DCF8C6" : "#fff", borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 13, fontFamily: "Arial, sans-serif", lineHeight: 1.55, color: "#1a1a1a", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
                <BubbleText text={msg.text} />
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#128C7E", animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {started && showOptions && !isTyping && messages.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {QUICK_OPTIONS.map((opt, i) => (
                <button key={i} onClick={() => handleQuickOption(opt)} style={{ background: "#fff", border: "1.5px solid #128C7E", borderRadius: 16, padding: "6px 12px", fontSize: 11, color: "#075E54", fontWeight: "600", fontFamily: "Arial, sans-serif", cursor: "pointer" }}>{opt.label}</button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {started && (
          <div style={{ padding: "10px 12px", background: "#f0f0f0", borderTop: "1px solid #ddd", display: "flex", gap: 8, flexShrink: 0 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Type your message..." style={{ flex: 1, border: "none", borderRadius: 20, padding: "10px 16px", fontSize: 13, fontFamily: "Arial, sans-serif", outline: "none", background: "#fff" }} />
            <button onClick={handleSubmit} style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: input.trim() ? "linear-gradient(135deg, #075E54, #128C7E)" : "#ccc", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>➤</button>
          </div>
        )}

        <div style={{ background: "#f0f0f0", padding: "6px", textAlign: "center", fontSize: 10, color: "#999", fontFamily: "Arial, sans-serif" }}>
          DRBPLUS • AI-Powered • Emergencies: call 112
        </div>
      </div>
      <style>{`@keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }`}</style>
    </div>
  );
}
